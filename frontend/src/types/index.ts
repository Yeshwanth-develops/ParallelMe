export interface Candidate {
  candidate_id: string;
  strategy_name: string;
  code: string;
}

export interface SyntaxErrorDetails {
  message: string;
  line: number;
  offset: number;
}

export interface ExecutionResult {
  status:
    | "completed"
    | "tests_failed"
    | "timeout"
    | "invalid_syntax"
    | "invalid_test_syntax"
    | "evaluation_error"
    | "pruned";
  passed: boolean;
  passed_tests: number;
  failed_tests: number;
  skipped_tests?: number;
  duration_ms: number;
  exit_code?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  syntax_error?: SyntaxErrorDetails;
  reason?: string;
  duplicate_of?: string;
}

export interface RankedCandidate {
  candidate_id: string;
  strategy_name: string;
  rank: number;
  pass_rate: number;
  result: ExecutionResult;
}

export interface PrunedCandidate {
  candidate_id: string;
  strategy_name: string;
  result: ExecutionResult;
}

export interface EvaluationResponse {
  total_candidates: number;
  evaluated_count: number;
  pruned_count: number;
  ranked_candidates: RankedCandidate[];
  pruned_candidates: PrunedCandidate[];
}

export interface Preset {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  timeout_seconds: number;
  max_concurrency: number;
  tests: string;
  candidates: Candidate[];
}

