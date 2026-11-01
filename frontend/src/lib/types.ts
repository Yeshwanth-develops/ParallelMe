export type Language = "python" | "json" | "markdown";

export interface FileTab {
  id: string;
  name: string;
  language: Language;
  content: string;
  isDirty?: boolean;
  isReadonly?: boolean;
  badge?: string;
  description?: string;
}

export interface BenchmarkCase {
  args: unknown[];
  kwargs?: Record<string, unknown>;
  expected?: unknown;
  name?: string;
  input_size?: number;
}

export interface CandidateResult {
  status: string;
  passed: boolean;
  passed_tests: number;
  failed_tests: number;
  skipped_tests?: number;
  stdout?: string;
  stderr?: string;
  duration_ms?: number;
  execution_duration_ms?: number | null;
  benchmark?: {
    status: string;
    benchmark_median_ms?: number;
    ranking_metric?: string;
    cases?: Array<{
      case_index: number;
      name?: string;
      input_size?: number;
      median_ms: number;
      p95_ms: number;
      repetitions?: number;
      rounds?: Array<{ round_index: number; median_ms: number }>;
      total_samples?: number;
      correct?: boolean;
    }>;
    error?: string;
  };
  benchmark_median_ms?: number;
  error?: string;
  reason?: string;
  duplicate_of?: string;
}

export interface RankedCandidate {
  candidate_id: string;
  strategy_name: string;
  rank: number;
  pass_rate: number;
  performance_measured: boolean;
  result: CandidateResult;
  code?: string;
}

export interface PrunedCandidate {
  candidate_id: string;
  strategy_name: string;
  result: CandidateResult;
}

export interface EvaluationPayload {
  total_candidates: number;
  evaluated_count: number;
  pruned_count: number;
  ranked_candidates: RankedCandidate[];
  pruned_candidates: PrunedCandidate[];
}

export interface PlanAndEvaluateResponse {
  task_description: string;
  planner: string;
  strategies: Record<
    string,
    {
      approach: "straightforward" | "algorithmic" | "optimized" | string;
      rationale: string;
    }
  >;
  evaluation: EvaluationPayload;
}

export interface SingleEvaluationResponse {
  status: string;
  passed: boolean;
  passed_tests: number;
  failed_tests: number;
  skipped_tests?: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  execution_duration_ms?: number | null;
  exit_code?: number;
  syntax_error?: {
    message: string;
    line: number;
    offset: number;
  };
}

export interface CodingPreset {
  id: string;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  functionName: string;
  taskDescription: string;
  starterCode: string;
  tests: string;
  benchmarkCases: BenchmarkCase[];
  benchmarkRepetitions: number;
  benchmarkWarmups: number;
  benchmarkRounds?: number;
  benchmarkDataset?: "two_sum";
}
