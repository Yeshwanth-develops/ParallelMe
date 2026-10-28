import { Candidate, EvaluationResponse, RankedCandidate, PrunedCandidate } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      return { ok: true, message: "Connected to ParallelMe API" };
    }
    return { ok: false, message: `API returned HTTP ${res.status}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    return { ok: false, message: `Backend unavailable (${errorMsg})` };
  }
}

export async function runParallelEvaluation(
  candidates: Candidate[],
  tests: string,
  timeoutSeconds: number = 5,
  maxConcurrency: number = 3
): Promise<EvaluationResponse> {
  const payload = {
    candidates: candidates.map((c) => ({
      candidate_id: c.candidate_id,
      strategy_name: c.strategy_name,
      code: c.code,
    })),
    tests,
    timeout_seconds: timeoutSeconds,
    max_concurrency: maxConcurrency,
  };

  const response = await fetch(`${API_BASE}/api/tasks/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = `Server responded with ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        detail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore json parse error
    }

    if (response.status === 503) {
      throw new Error(
        `Docker Daemon Unavailable (HTTP 503): ${detail}. Ensure Docker is running, or toggle Demo Simulation Mode.`
      );
    }
    throw new Error(detail);
  }

  return response.json();
}

/**
 * Built-in client simulation mode.
 * Runs when Docker daemon is not active or when user toggles Demo Mode.
 */
export async function simulateParallelEvaluation(
  candidates: Candidate[],
  tests: string
): Promise<EvaluationResponse> {
  // Simulate network & docker run delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const seenFingerprints: Record<string, string> = {};
  const ready: Candidate[] = [];
  const pruned: PrunedCandidate[] = [];

  for (const candidate of candidates) {
    const cleanCode = candidate.code.trim();

    // Check deliberate syntax error simulation
    const openParens = (candidate.code.match(/\(/g) || []).length;
    const closeParens = (candidate.code.match(/\)/g) || []).length;
    if (openParens !== closeParens || candidate.code.includes("def func(:") || candidate.candidate_id.includes("syntax")) {
      pruned.push({
        candidate_id: candidate.candidate_id,
        strategy_name: candidate.strategy_name,
        result: {
          status: "pruned",
          passed: false,
          passed_tests: 0,
          failed_tests: 0,
          duration_ms: 0,
          reason: "invalid_syntax",
          syntax_error: {
            message: "unexpected EOF while parsing (syntax mismatch)",
            line: 4,
            offset: 28,
          },
        },
      });
      continue;
    }

    // Check duplicate simulation
    const normalized = cleanCode.replace(/\s+/g, " ");
    if (seenFingerprints[normalized]) {
      pruned.push({
        candidate_id: candidate.candidate_id,
        strategy_name: candidate.strategy_name,
        result: {
          status: "pruned",
          reason: "duplicate_code",
          duplicate_of: seenFingerprints[normalized],
          passed: false,
          passed_tests: 0,
          failed_tests: 0,
          duration_ms: 0,
        },
      });
      continue;
    }

    seenFingerprints[normalized] = candidate.candidate_id;
    ready.push(candidate);
  }

  // Count tests in test suite
  const testCountMatches = tests.match(/def test_/g);
  const totalTests = testCountMatches ? testCountMatches.length : 3;

  const evaluated: RankedCandidate[] = ready.map((candidate, index) => {
    const isFlawed =
      candidate.candidate_id.includes("buggy") ||
      candidate.strategy_name.toLowerCase().includes("flawed") ||
      candidate.code.includes("num < 0: continue");

    const isNaive =
      candidate.candidate_id.includes("recursive") ||
      candidate.candidate_id.includes("bubblesort") ||
      candidate.candidate_id.includes("bruteforce");

    const passedTests = isFlawed ? Math.max(1, totalTests - 2) : totalTests;
    const failedTests = isFlawed ? 2 : 0;
    const passRate = totalTests > 0 ? passedTests / totalTests : 1.0;
    const baseDuration = isNaive ? 180 + index * 40 : 15 + index * 12;

    return {
      candidate_id: candidate.candidate_id,
      strategy_name: candidate.strategy_name,
      rank: 0,
      pass_rate: Number(passRate.toFixed(4)),
      result: {
        status: isFlawed ? "tests_failed" : "completed",
        passed: !isFlawed,
        passed_tests: passedTests,
        failed_tests: failedTests,
        skipped_tests: 0,
        duration_ms: baseDuration,
        exit_code: isFlawed ? 1 : 0,
        stdout: isFlawed
          ? `pytest summary: ${passedTests} passed, ${failedTests} failed in ${(baseDuration / 1000).toFixed(2)}s\nFAILED test_negative_numbers - AssertionError`
          : `pytest summary: ${passedTests} passed in ${(baseDuration / 1000).toFixed(2)}s`,
        stderr: "",
      },
    };
  });

  // Rank from strongest to weakest
  evaluated.sort((a, b) => {
    if (a.result.passed !== b.result.passed) {
      return a.result.passed ? -1 : 1;
    }
    if (b.pass_rate !== a.pass_rate) {
      return b.pass_rate - a.pass_rate;
    }
    return a.result.duration_ms - b.result.duration_ms;
  });

  evaluated.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    total_candidates: candidates.length,
    evaluated_count: evaluated.length,
    pruned_count: pruned.length,
    ranked_candidates: evaluated,
    pruned_candidates: pruned,
  };
}
