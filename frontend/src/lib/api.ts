import {
  CodingPreset,
  PlanAndEvaluateResponse,
  SingleEvaluationResponse,
  EvaluationPayload,
  BenchmarkCase,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth(): Promise<{
  online: boolean;
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return { online: true };
    }
    return { online: false, message: `Status: ${res.status}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { online: false, message: errorMsg };
  }
}

export async function runPlanAndEvaluate(payload: {
  task_description: string;
  tests: string;
  function_name?: string;
  timeout_seconds?: number;
  max_concurrency?: number;
  benchmark_cases?: BenchmarkCase[];
  benchmark_repetitions?: number;
  benchmark_warmups?: number;
}): Promise<PlanAndEvaluateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/tasks/plan-and-evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function runCandidatesEvaluation(payload: {
  candidates: Array<{
    candidate_id: string;
    strategy_name: string;
    code: string;
  }>;
  tests: string;
  function_name?: string;
  timeout_seconds?: number;
  max_concurrency?: number;
  benchmark_cases?: BenchmarkCase[];
  benchmark_repetitions?: number;
  benchmark_warmups?: number;
}): Promise<EvaluationPayload> {
  const res = await fetch(`${API_BASE_URL}/api/tasks/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function runSingleEvaluation(payload: {
  code: string;
  tests: string;
  timeout_seconds?: number;
}): Promise<SingleEvaluationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/evaluation/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

/**
 * Creates simulated AI strategies when Gemini API or Docker is unavailable,
 * allowing the user to explore the full interactive IDE and visualizer.
 */
export function getSimulatedStrategyPlan(preset: CodingPreset): PlanAndEvaluateResponse {
  return {
    task_description: preset.taskDescription,
    planner: "Google Gemini (Interactive Simulation)",
    strategies: {
      "strategy-1": {
        approach: "straightforward",
        rationale:
          "Baseline implementation focusing on code clarity and readability. Prioritizes developer understanding over micro-optimizations.",
      },
      "strategy-2": {
        approach: "algorithmic",
        rationale:
          "Algorithmic refactoring using structured data representations (e.g. hash tables / pointers) to reduce asymptotic complexity from quadratic to linear time.",
      },
      "strategy-3": {
        approach: "optimized",
        rationale:
          "High-performance specialized approach utilizing bitwise tricks, in-place state mutations, and minimal heap allocations for cache-locality.",
      },
    },
    evaluation: {
      total_candidates: 3,
      evaluated_count: 3,
      pruned_count: 0,
      ranked_candidates: [
        {
          candidate_id: "strategy-2",
          strategy_name: "Hash Table Complement Lookup",
          rank: 1,
          pass_rate: 1.0,
          performance_measured: true,
          code: preset.starterCode,
          result: {
            status: "completed",
            passed: true,
            passed_tests: 4,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 18,
            execution_duration_ms: 12.4,
            benchmark_median_ms: 0.048,
            stdout: "PASSED test_main.py::test_basic\nPASSED test_main.py::test_edges\n2 passed in 0.03s",
            stderr: "",
            benchmark: {
              status: "completed",
              benchmark_median_ms: 0.048,
              cases: [
                { case_index: 0, median_ms: 0.032, p95_ms: 0.051, repetitions: 20 },
                { case_index: 1, median_ms: 0.064, p95_ms: 0.089, repetitions: 20 },
              ],
            },
          },
        },
        {
          candidate_id: "strategy-3",
          strategy_name: "Two-Pointer Sorted Array Approach",
          rank: 2,
          pass_rate: 1.0,
          performance_measured: true,
          code: `# Strategy 3 (Optimized Index Sort)
def ${preset.functionName}(*args, **kwargs):
    # Simulated memory-efficient optimized pass
    return True
`,
          result: {
            status: "completed",
            passed: true,
            passed_tests: 4,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 22,
            execution_duration_ms: 15.1,
            benchmark_median_ms: 0.086,
            stdout: "PASSED all test suites in sandbox container.",
            stderr: "",
            benchmark: {
              status: "completed",
              benchmark_median_ms: 0.086,
              cases: [
                { case_index: 0, median_ms: 0.075, p95_ms: 0.098, repetitions: 20 },
                { case_index: 1, median_ms: 0.097, p95_ms: 0.124, repetitions: 20 },
              ],
            },
          },
        },
        {
          candidate_id: "strategy-1",
          strategy_name: "Brute Force Iterative Traversal",
          rank: 3,
          pass_rate: 1.0,
          performance_measured: true,
          code: `# Strategy 1 (Straightforward Nested Iteration)
def ${preset.functionName}(*args, **kwargs):
    # Nested loops O(N^2)
    return True
`,
          result: {
            status: "completed",
            passed: true,
            passed_tests: 4,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 84,
            execution_duration_ms: 71.0,
            benchmark_median_ms: 1.452,
            stdout: "PASSED test_main.py::test_basic",
            stderr: "",
            benchmark: {
              status: "completed",
              benchmark_median_ms: 1.452,
              cases: [
                { case_index: 0, median_ms: 1.25, p95_ms: 1.62, repetitions: 20 },
                { case_index: 1, median_ms: 1.65, p95_ms: 2.15, repetitions: 20 },
              ],
            },
          },
        },
      ],
      pruned_candidates: [],
    },
  };
}
