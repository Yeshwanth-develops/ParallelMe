import React from "react";
import {
  TerminalIcon,
  CheckCircleIcon,
  GaugeIcon,
  SparklesIcon,
  AlertTriangleIcon,
  CloseIcon,
  RefreshCwIcon,
} from "./Icons";
import {
  SingleEvaluationResponse,
  PlanAndEvaluateResponse,
} from "../lib/types";

export type TerminalTab = "terminal" | "tests" | "benchmarks" | "strategies" | "problems";

interface TerminalPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: TerminalTab;
  onSelectTab: (tab: TerminalTab) => void;
  singleResult: SingleEvaluationResponse | null;
  planResult: PlanAndEvaluateResponse | null;
  logs: string[];
  onClearLogs: () => void;
}

export function TerminalPanel({
  isOpen,
  onToggleOpen,
  activeTab,
  onSelectTab,
  singleResult,
  planResult,
  logs,
  onClearLogs,
}: TerminalPanelProps) {
  if (!isOpen) {
    return (
      <div className="h-7 bg-[#141520] border-t border-[#26283b] flex items-center justify-between px-3 text-xs select-none">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px]">Toggle Terminal & Results</span>
        </button>
        <span className="text-[10px] text-slate-500 font-mono">Ctrl+`</span>
      </div>
    );
  }

  const rankedCandidates = planResult?.evaluation?.ranked_candidates || [];

  return (
    <div className="h-64 bg-[#141520] border-t border-[#26283b] flex flex-col text-xs select-text overflow-hidden">
      {/* Panel Tab Header */}
      <div className="h-8 bg-[#10111a] border-b border-[#242536] flex items-center justify-between px-3 select-none shrink-0">
        <div className="flex items-center gap-1 h-full overflow-x-auto custom-scrollbar">
          <button
            onClick={() => onSelectTab("terminal")}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-medium transition-colors ${
              activeTab === "terminal"
                ? "border-cyan-400 text-cyan-300 bg-[#161726]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>TERMINAL</span>
          </button>

          <button
            onClick={() => onSelectTab("tests")}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-medium transition-colors ${
              activeTab === "tests"
                ? "border-emerald-400 text-emerald-300 bg-[#161726]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>TEST RESULTS</span>
            {singleResult && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  singleResult.passed
                    ? "bg-emerald-950 text-emerald-400"
                    : "bg-red-950 text-red-400"
                }`}
              >
                {singleResult.passed ? "PASS" : "FAIL"}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab("benchmarks")}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-medium transition-colors ${
              activeTab === "benchmarks"
                ? "border-amber-400 text-amber-300 bg-[#161726]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <GaugeIcon className="w-3.5 h-3.5" />
            <span>BENCHMARKS</span>
            {rankedCandidates.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-950 text-amber-400">
                {rankedCandidates.length}
              </span>
            )}
          </button>

          {planResult?.strategies && (
            <button
              onClick={() => onSelectTab("strategies")}
              className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-medium transition-colors ${
                activeTab === "strategies"
                  ? "border-purple-400 text-purple-300 bg-[#161726]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>AI EXPLANATIONS</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab("problems")}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-medium transition-colors ${
              activeTab === "problems"
                ? "border-red-400 text-red-300 bg-[#161726]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            <span>PROBLEMS</span>
          </button>
        </div>

        {/* Panel Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === "terminal" && (
            <button
              onClick={onClearLogs}
              title="Clear Terminal Output"
              className="text-slate-500 hover:text-slate-300 p-1 rounded"
            >
              <RefreshCwIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onToggleOpen}
            title="Close Panel (Ctrl+`)"
            className="text-slate-500 hover:text-slate-300 p-1 rounded"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
        {/* TAB 1: TERMINAL LOGS */}
        {activeTab === "terminal" && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">
                Terminal ready. Run tests or synthesize strategies to stream
                output logs.
              </div>
            ) : (
              logs.map((log, index) => {
                const isErr =
                  log.includes("[ERROR]") ||
                  log.includes("failed") ||
                  log.includes("Traceback");
                const isSuccess =
                  log.includes("[SUCCESS]") ||
                  log.includes("passed") ||
                  log.includes("completed");
                const isWarn = log.includes("[WARN]") || log.includes("pruned");

                return (
                  <div
                    key={index}
                    className={`leading-relaxed whitespace-pre-wrap ${
                      isErr
                        ? "text-rose-400"
                        : isSuccess
                        ? "text-emerald-400"
                        : isWarn
                        ? "text-amber-300"
                        : "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PYTEST RESULTS */}
        {activeTab === "tests" && (
          <div>
            {!singleResult && rankedCandidates.length === 0 ? (
              <div className="text-slate-500 italic">
                No test results recorded yet. Click &quot;Run Tests&quot; in the editor.
              </div>
            ) : singleResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#191b29] p-3 rounded border border-[#27293d]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      singleResult.passed
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-red-950 text-red-400 border border-red-800"
                    }`}
                  >
                    {singleResult.passed ? "✓" : "✗"}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">
                      {singleResult.passed
                        ? "Deterministic Evaluation Passed"
                        : "Deterministic Tests Failed"}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Passed:{" "}
                      <span className="text-emerald-400 font-bold">
                        {singleResult.passed_tests}
                      </span>{" "}
                      | Failed:{" "}
                      <span className="text-red-400 font-bold">
                        {singleResult.failed_tests}
                      </span>{" "}
                      | Wall Duration: {singleResult.duration_ms} ms
                    </div>
                  </div>
                </div>

                {/* Output dump */}
                {singleResult.stdout && (
                  <div>
                    <span className="text-slate-400 block mb-1 text-[11px]">
                      Pytest Standard Output:
                    </span>
                    <pre className="p-3 bg-[#0d0e17] rounded border border-[#202235] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {singleResult.stdout}
                    </pre>
                  </div>
                )}

                {singleResult.stderr && (
                  <div>
                    <span className="text-rose-400 block mb-1 text-[11px]">
                      Pytest Errors / Stderr:
                    </span>
                    <pre className="p-3 bg-red-950/20 rounded border border-red-900/30 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                      {singleResult.stderr}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-slate-300 font-semibold mb-2">
                  Parallel Candidate Test Results:
                </div>
                {rankedCandidates.map((c) => (
                  <div
                    key={c.candidate_id}
                    className="flex items-center justify-between p-2.5 bg-[#191b29] rounded border border-[#27293d]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">
                        #{c.rank}
                      </span>
                      <span className="text-slate-200">{c.strategy_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">
                        {c.result.passed_tests} passed
                      </span>
                      {c.result.failed_tests > 0 && (
                        <span className="text-red-400">
                          {c.result.failed_tests} failed
                        </span>
                      )}
                      <span className="text-slate-400 font-mono">
                        {c.result.duration_ms} ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BENCHMARK METRICS */}
        {activeTab === "benchmarks" && (
          <div>
            {rankedCandidates.length === 0 ? (
              <div className="text-slate-500 italic">
                No benchmark metrics measured. Run &quot;Synthesize & Evaluate&quot; with
                benchmark cases configured to compare execution latencies.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-slate-300 font-semibold">
                  Latency Comparison (Lower is Faster):
                </div>

                {/* Visual comparative bars */}
                <div className="space-y-3 bg-[#191b29] p-4 rounded-lg border border-[#27293d]">
                  {(() => {
                    const maxMedian = Math.max(
                      ...rankedCandidates.map(
                        (c) => c.result.benchmark_median_ms || 1
                      )
                    );

                    return rankedCandidates.map((c) => {
                      const median = c.result.benchmark_median_ms;
                      const percentage = median
                        ? Math.max(8, (median / maxMedian) * 100)
                        : 0;

                      return (
                        <div key={c.candidate_id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200 flex items-center gap-2">
                              <span>#{c.rank}</span>
                              <span>{c.strategy_name}</span>
                            </span>
                            <span className="text-cyan-300 font-mono font-bold">
                              {median !== undefined
                                ? `${median.toFixed(3)} ms`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#10111a] rounded-full overflow-hidden border border-[#26283b]">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                c.rank === 1
                                  ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                                  : c.rank === 2
                                  ? "bg-gradient-to-r from-cyan-600 to-indigo-500"
                                  : "bg-slate-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Case breakdown details */}
                <div className="space-y-2">
                  <span className="text-slate-400 text-xs block font-semibold">
                    Case-by-Case Breakdown:
                  </span>
                  {rankedCandidates[0]?.result.benchmark?.cases?.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-[#10111a] rounded border border-[#232538] text-[11px]"
                      >
                        <span className="text-slate-400">
                          Benchmark Case #{idx + 1} ({item.repetitions} reps)
                        </span>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-slate-300">
                            Median:{" "}
                            <span className="text-cyan-400">
                              {item.median_ms.toFixed(3)} ms
                            </span>
                          </span>
                          <span className="text-slate-400">
                            p95:{" "}
                            <span className="text-purple-400">
                              {item.p95_ms.toFixed(3)} ms
                            </span>
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AI STRATEGIES & RATIONALE */}
        {activeTab === "strategies" && (
          <div>
            {!planResult?.strategies ? (
              <div className="text-slate-500 italic">
                No AI explanations available for the current code.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-purple-300 font-semibold flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-purple-400" />
                  <span>Synthesized Paradigms from {planResult.planner}:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(planResult.strategies).map(
                    ([key, strategy]) => (
                      <div
                        key={key}
                        className="p-3 bg-[#191b29] border border-[#27293d] rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">
                            {key}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold capitalize ${
                              strategy.approach === "optimized"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : strategy.approach === "algorithmic"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}
                          >
                            {strategy.approach}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          {strategy.rationale}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROBLEMS */}
        {activeTab === "problems" && (
          <div>
            {singleResult?.syntax_error ? (
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-red-300 flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">
                    Syntax Error at Line {singleResult.syntax_error.line}, Offset{" "}
                    {singleResult.syntax_error.offset}
                  </div>
                  <div className="text-[11px] text-red-400 font-mono mt-0.5">
                    {singleResult.syntax_error.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic">
                No syntax or lint problems detected in current workspace.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
