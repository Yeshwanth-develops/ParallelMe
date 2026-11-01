import React from "react";
import { ActiveSidebarTab } from "./ActivityBar";
import {
  FileTab,
  RankedCandidate,
  PrunedCandidate,
  CodingPreset,
} from "../lib/types";
import { CODING_PRESETS } from "../lib/presets";
import {
  PythonIcon,
  JsonIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  TrophyIcon,
  AlertTriangleIcon,
} from "./Icons";

interface SidebarProps {
  activeTab: ActiveSidebarTab;
  files: FileTab[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  // Planner properties
  taskDescription: string;
  setTaskDescription: (val: string) => void;
  functionName: string;
  setFunctionName: (val: string) => void;
  concurrency: number;
  setConcurrency: (val: number) => void;
  timeoutSeconds: number;
  setTimeoutSeconds: (val: number) => void;
  benchmarkRepetitions: number;
  setBenchmarkRepetitions: (val: number) => void;
  onRunPlanAndEvaluate: () => void;
  isLoading: boolean;
  loadingMessage: string;
  // Arena properties
  rankedCandidates: RankedCandidate[];
  prunedCandidates: PrunedCandidate[];
  activePresetId: string;
  onLoadPreset: (preset: CodingPreset) => void;
}

export function Sidebar({
  activeTab,
  files,
  activeFileId,
  onSelectFile,
  taskDescription,
  setTaskDescription,
  functionName,
  setFunctionName,
  concurrency,
  setConcurrency,
  timeoutSeconds,
  setTimeoutSeconds,
  benchmarkRepetitions,
  setBenchmarkRepetitions,
  onRunPlanAndEvaluate,
  isLoading,
  loadingMessage,
  rankedCandidates,
  prunedCandidates,
  activePresetId,
  onLoadPreset,
}: SidebarProps) {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = React.useState(true);
  const [isStrategiesOpen, setIsStrategiesOpen] = React.useState(true);

  // Group files into workspace root vs generated strategies
  const rootFiles = files.filter((f) => !f.id.startsWith("strategy-"));
  const strategyFiles = files.filter((f) => f.id.startsWith("strategy-"));

  return (
    <div className="w-80 bg-[#151622] text-slate-300 flex flex-col border-r border-[#26283b] select-none h-full overflow-hidden text-xs">
      {/* Sidebar Header */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-[#232538] text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        <span>
          {activeTab === "files" && "Explorer"}
          {activeTab === "planner" && "AI Strategy Planner"}
          {activeTab === "arena" && "Strategy Arena"}
          {activeTab === "presets" && "Coding Challenges"}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">ParallelMe</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* TAB 1: FILES EXPLORER */}
        {activeTab === "files" && (
          <div className="py-2">
            {/* Main Workspace Section */}
            <div>
              <button
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                className="w-full flex items-center gap-1.5 px-3 py-1 text-slate-400 hover:text-slate-200 font-bold uppercase tracking-wider text-[11px] transition-colors"
              >
                {isWorkspaceOpen ? (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                )}
                <span>WORKSPACE</span>
              </button>

              {isWorkspaceOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {rootFiles.map((file) => {
                    const isActive = activeFileId === file.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() => onSelectFile(file.id)}
                        className={`w-full flex items-center justify-between px-6 py-1.5 transition-colors ${
                          isActive
                            ? "bg-[#25283f] text-cyan-300 border-l-2 border-cyan-400 font-medium"
                            : "text-slate-300 hover:bg-[#1a1b2b] hover:text-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {file.language === "python" ? (
                            <PythonIcon className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <JsonIcon className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                        {file.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2c2f4a] text-slate-400">
                            {file.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generated Strategies Section */}
            {strategyFiles.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setIsStrategiesOpen(!isStrategiesOpen)}
                  className="w-full flex items-center gap-1.5 px-3 py-1 text-purple-300 hover:text-purple-100 font-bold uppercase tracking-wider text-[11px] transition-colors"
                >
                  {isStrategiesOpen ? (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  )}
                  <span>GENERATED STRATEGIES</span>
                  <span className="ml-auto text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                    {strategyFiles.length}
                  </span>
                </button>

                {isStrategiesOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {strategyFiles.map((file) => {
                      const isActive = activeFileId === file.id;
                      return (
                        <button
                          key={file.id}
                          onClick={() => onSelectFile(file.id)}
                          className={`w-full flex items-center justify-between px-6 py-1.5 transition-colors ${
                            isActive
                              ? "bg-[#281e42] text-purple-300 border-l-2 border-purple-400 font-medium"
                              : "text-slate-300 hover:bg-[#1f1830] hover:text-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <PythonIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          {file.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                                file.badge === "optimized"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : file.badge === "algorithmic"
                                  ? "bg-purple-950 text-purple-300 border border-purple-800"
                                  : "bg-blue-950 text-blue-300 border border-blue-800"
                              }`}
                            >
                              {file.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Presets in explorer quick access */}
            <div className="mt-6 px-4 pt-4 border-t border-[#232538]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Task Templates
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {CODING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onLoadPreset(preset)}
                    className={`text-left p-2 rounded border transition-all text-[11px] ${
                      activePresetId === preset.id
                        ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-sm"
                        : "bg-[#191b29] border-[#292c42] hover:border-slate-500 text-slate-300"
                    }`}
                  >
                    <div className="font-medium truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {preset.difficulty}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI STRATEGY PLANNER */}
        {activeTab === "planner" && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-3 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-300 font-semibold mb-1">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                <span>Google Gemini Agent</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ParallelMe automatically synthesizes three distinct Python
                paradigms (straightforward, algorithmic, optimized) and ranks them
                in parallel sandboxes.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Task Specification
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={5}
                placeholder="Describe your coding task or algorithm problem in detail..."
                className="w-full bg-[#10111a] border border-[#2a2d45] rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Function Name
                </label>
                <input
                  type="text"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  className="w-full bg-[#10111a] border border-[#2a2d45] rounded px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Parallel Workers
                </label>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full bg-[#10111a] border border-[#2a2d45] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>1 Worker (Sequential)</option>
                  <option value={2}>2 Workers</option>
                  <option value={3}>3 Workers (Default)</option>
                  <option value={4}>4 Workers</option>
                  <option value={5}>5 Workers (Max)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Sandbox Timeout: {timeoutSeconds}s
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Benchmark Reps: {benchmarkRepetitions}
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={benchmarkRepetitions}
                  onChange={(e) => setBenchmarkRepetitions(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={onRunPlanAndEvaluate}
              disabled={isLoading || !taskDescription.trim()}
              className={`w-full py-2.5 px-4 rounded font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLoading
                  ? "bg-purple-900/60 text-purple-200 cursor-not-allowed border border-purple-500/30"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 hover:shadow-purple-700/50 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{loadingMessage || "Generating Strategies..."}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Synthesize & Evaluate</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center font-mono">
              Press <kbd className="px-1 py-0.5 bg-[#25283f] rounded border border-[#3b3f60] text-slate-300">Ctrl+Enter</kbd> to execute
            </p>
          </div>
        )}

        {/* TAB 3: ARENA & LEADERBOARD */}
        {activeTab === "arena" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#232538]">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <TrophyIcon className="w-4 h-4 text-amber-400" />
                <span>Strategy Leaderboard</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {rankedCandidates.length} evaluated
              </span>
            </div>

            {rankedCandidates.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <TrophyIcon className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">No evaluation results yet.</p>
                <p className="text-[11px] text-slate-600">
                  Run the Gemini Strategy Planner or evaluate code to view rank
                  comparisons.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedCandidates.map((candidate) => {
                  const medal =
                    candidate.rank === 1
                      ? "🥇"
                      : candidate.rank === 2
                      ? "🥈"
                      : candidate.rank === 3
                      ? "🥉"
                      : `#${candidate.rank}`;
                  const medianMs = candidate.result.benchmark_median_ms;
                  const isSuccess = candidate.result.passed;

                  return (
                    <div
                      key={candidate.candidate_id}
                      className={`p-3 rounded-lg border transition-all ${
                        candidate.rank === 1
                          ? "bg-amber-950/20 border-amber-500/40 shadow-sm"
                          : "bg-[#181a29] border-[#292c42]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
                          <span className="text-sm">{medal}</span>
                          <span className="truncate">
                            {candidate.strategy_name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSuccess
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {isSuccess ? "PASS" : "FAIL"}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] bg-[#10111a] p-2 rounded font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px]">
                            PASS RATE
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {Math.round(candidate.pass_rate * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">
                            MEDIAN LATENCY
                          </span>
                          <span className="font-semibold text-cyan-300">
                            {medianMs !== undefined ? `${medianMs.toFixed(3)} ms` : "N/A"}
                          </span>
                        </div>
                      </div>

                      {candidate.code && (
                        <button
                          onClick={() => {
                            // If strategy tab exists, switch to it
                            onSelectFile(candidate.candidate_id);
                          }}
                          className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium block"
                        >
                          Inspect Code in Editor →
                        </button>
                      )}
                    </div>
                  );
                })}

                {prunedCandidates.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#232538]">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <AlertTriangleIcon className="w-3.5 h-3.5" />
                      <span>Pruned Strategies ({prunedCandidates.length})</span>
                    </span>
                    {prunedCandidates.map((pruned) => (
                      <div
                        key={pruned.candidate_id}
                        className="p-2 bg-amber-950/20 border border-amber-900/30 rounded text-[11px] mb-1.5 text-amber-200"
                      >
                        <div className="font-medium truncate">
                          {pruned.strategy_name}
                        </div>
                        <div className="text-[10px] text-amber-300/70 mt-0.5">
                          Reason: {pruned.result.reason || "duplicate_code"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CODING PRESETS */}
        {activeTab === "presets" && (
          <div className="p-4 space-y-3">
            <div className="text-slate-400 text-xs mb-1">
              Select an algorithmic benchmark challenge to populate the editor
              and tests.
            </div>

            {CODING_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onLoadPreset(preset)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500/60 shadow-md"
                      : "bg-[#181a29] border-[#292c42] hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100 text-xs">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        preset.difficulty === "Easy"
                          ? "bg-emerald-950 text-emerald-400"
                          : preset.difficulty === "Medium"
                          ? "bg-amber-950 text-amber-400"
                          : "bg-red-950 text-red-400"
                      }`}
                    >
                      {preset.difficulty}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">
                    {preset.taskDescription}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{preset.category}</span>
                    <span className="text-cyan-400">fn: {preset.functionName}()</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
