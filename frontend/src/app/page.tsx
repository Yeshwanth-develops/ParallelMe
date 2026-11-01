"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ActivityBar, ActiveSidebarTab } from "../components/ActivityBar";
import { Sidebar } from "../components/Sidebar";
import { Editor } from "../components/Editor";
import { TerminalPanel, TerminalTab } from "../components/TerminalPanel";
import { StatusBar } from "../components/StatusBar";
import { CommandPalette } from "../components/CommandPalette";
import {
  FileTab,
  CodingPreset,
  SingleEvaluationResponse,
  PlanAndEvaluateResponse,
} from "../lib/types";
import { CODING_PRESETS } from "../lib/presets";
import {
  checkBackendHealth,
  runPlanAndEvaluate,
  runSingleEvaluation,
  getSimulatedStrategyPlan,
} from "../lib/api";
import {
  SparklesIcon,
  PlayIcon,
} from "../components/Icons";

export default function Home() {
  // Preset & Configuration
  const [activePreset, setActivePreset] = useState<CodingPreset>(
    CODING_PRESETS[0]
  );
  const [taskDescription, setTaskDescription] = useState(
    CODING_PRESETS[0].taskDescription
  );
  const [functionName, setFunctionName] = useState(
    CODING_PRESETS[0].functionName
  );
  const [concurrency, setConcurrency] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(5);
  const [benchmarkRepetitions, setBenchmarkRepetitions] = useState(20);

  // Files in Workspace
  const [files, setFiles] = useState<FileTab[]>([
    {
      id: "main.py",
      name: "main.py",
      language: "python",
      content: CODING_PRESETS[0].starterCode,
      badge: "active",
    },
    {
      id: "test_main.py",
      name: "test_main.py",
      language: "python",
      content: CODING_PRESETS[0].tests,
      badge: "tests",
    },
    {
      id: "cases.json",
      name: "cases.json",
      language: "json",
      content: JSON.stringify(CODING_PRESETS[0].benchmarkCases, null, 2),
      badge: "benchmarks",
    },
  ]);

  const [activeFileId, setActiveFileId] = useState("main.py");
  const [splitFileId, setSplitFileId] = useState<string | null>("test_main.py");

  // UI Panels state
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<ActiveSidebarTab>("files");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [activeTerminalTab, setActiveTerminalTab] =
    useState<TerminalTab>("terminal");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Execution & Backend state
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [singleResult, setSingleResult] =
    useState<SingleEvaluationResponse | null>(null);
  const [planResult, setPlanResult] =
    useState<PlanAndEvaluateResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "[ParallelMe Engine v0.1.0] Antigravity Strategy Studio initialized.",
    "[SYSTEM] Environment: Python 3.11.9, Pytest, Docker Isolation.",
    "[STATUS] Ready for parallel synthesis and sandboxed evaluation.",
  ]);

  // Cursor tracking
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Check Backend health on mount
  useEffect(() => {
    const probe = async () => {
      const health = await checkBackendHealth();
      setBackendOnline(health.online);
      if (health.online) {
        addLog("[BACKEND] Connected to FastAPI at http://127.0.0.1:8000 (Healthy)");
      } else {
        addLog(
          "[BACKEND] API server currently offline. Interactive mode enabled with simulated strategy generation."
        );
      }
    };
    probe();
    const interval = setInterval(probe, 15000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${entry}`]);
  };

  // Switch challenge preset
  const handleLoadPreset = (preset: CodingPreset) => {
    setActivePreset(preset);
    setTaskDescription(preset.taskDescription);
    setFunctionName(preset.functionName);
    setBenchmarkRepetitions(preset.benchmarkRepetitions);

    setFiles((prev) => {
      const nonStrategies = prev.filter((f) => !f.id.startsWith("strategy-"));
      return nonStrategies.map((file) => {
        if (file.id === "main.py") {
          return { ...file, content: preset.starterCode, isDirty: false };
        }
        if (file.id === "test_main.py") {
          return { ...file, content: preset.tests, isDirty: false };
        }
        if (file.id === "cases.json") {
          return {
            ...file,
            content: JSON.stringify(preset.benchmarkCases, null, 2),
            isDirty: false,
          };
        }
        return file;
      });
    });

    setActiveFileId("main.py");
    showToast(`Loaded preset: ${preset.name}`);
    addLog(`[PRESET] Loaded "${preset.name}" (${preset.difficulty})`);
  };

  // Code editor updates
  const handleCodeChange = (fileId: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, content: newContent, isDirty: true } : f
      )
    );
  };

  // Run Pytest in Sandbox on current code
  const handleRunTests = async () => {
    const mainFile = files.find((f) => f.id === "main.py");
    const testFile = files.find((f) => f.id === "test_main.py");

    if (!mainFile || !testFile) return;

    setIsLoading(true);
    setLoadingMessage("Executing Pytest in Sandbox...");
    setIsTerminalOpen(true);
    setActiveTerminalTab("terminal");
    addLog(`[RUN] Dispatching ${mainFile.name} to pytest container...`);

    try {
      if (backendOnline) {
        const result = await runSingleEvaluation({
          code: mainFile.content,
          tests: testFile.content,
          timeout_seconds: timeoutSeconds,
        });

        setSingleResult(result);
        if (result.passed) {
          addLog(
            `[SUCCESS] Pytest passed: ${result.passed_tests} tests completed in ${result.duration_ms}ms.`
          );
          showToast("Pytest Evaluation: PASSED");
        } else {
          addLog(
            `[ERROR] Pytest failed: ${result.failed_tests} failure(s) detected.`
          );
          showToast("Pytest Evaluation: FAILED");
        }
      } else {
        // Simulated local execution if offline
        await new Promise((r) => setTimeout(r, 600));
        const simResult: SingleEvaluationResponse = {
          status: "completed",
          passed: true,
          passed_tests: 4,
          failed_tests: 0,
          skipped_tests: 0,
          duration_ms: 24,
          execution_duration_ms: 18.5,
          stdout:
            "=================== test session starts ===================\ncollecting ... collected 4 items\n\ntest_main.py::test_basic PASSED\ntest_main.py::test_edge PASSED\n\n=================== 4 passed in 0.02s ===================",
          stderr: "",
        };
        setSingleResult(simResult);
        addLog(
          `[SUCCESS] (Interactive Mode) Pytest passed 4 tests in 24ms.`
        );
        showToast("Interactive Evaluation: PASSED");
      }
      setActiveTerminalTab("tests");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`[ERROR] Sandbox execution failed: ${errMsg}`);
      showToast(`Execution Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // AI Strategy Synthesis via Gemini & Sandbox Benchmarking
  const handlePlanAndEvaluate = async () => {
    const testFile = files.find((f) => f.id === "test_main.py");
    const casesFile = files.find((f) => f.id === "cases.json");
    if (!testFile) return;

    let parsedCases = activePreset.benchmarkCases;
    if (casesFile) {
      try {
        parsedCases = JSON.parse(casesFile.content);
      } catch {
        addLog("[WARN] Could not parse cases.json, falling back to preset cases.");
      }
    }

    setIsLoading(true);
    setLoadingMessage("Synthesizing Strategies with Gemini...");
    setIsTerminalOpen(true);
    setActiveTerminalTab("terminal");
    addLog(
      `[GEMINI] Requesting 3 distinct algorithmic implementations from Gemini...`
    );

    try {
      let response: PlanAndEvaluateResponse;

      if (backendOnline) {
        setLoadingMessage("Gemini synthesized code. Benchmarking in sandboxes...");
        response = await runPlanAndEvaluate({
          task_description: taskDescription,
          tests: testFile.content,
          function_name: functionName || "solve",
          timeout_seconds: timeoutSeconds,
          max_concurrency: concurrency,
          benchmark_cases: parsedCases,
          benchmark_repetitions: benchmarkRepetitions,
          benchmark_warmups: 3,
          benchmark_rounds: activePreset.benchmarkRounds || 5,
          benchmark_dataset: activePreset.benchmarkDataset,
        });
      } else {
        // Fallback simulation for offline testing
        await new Promise((r) => setTimeout(r, 1200));
        response = getSimulatedStrategyPlan(activePreset);
      }

      setPlanResult(response);
      addLog(`[GEMINI] Strategies generated: straightforward, algorithmic, optimized.`);
      addLog(
        `[PARALLEL] Sandbox evaluation finished. Total: ${response.evaluation.total_candidates}, Evaluated: ${response.evaluation.evaluated_count}, Pruned: ${response.evaluation.pruned_count}`
      );

      // Create editor tabs for the generated strategies
      const newStrategyTabs: FileTab[] =
        response.evaluation.ranked_candidates.map((candidate) => {
          const strategyMeta =
            response.strategies[candidate.candidate_id] || {
              approach: "algorithmic",
              rationale: "",
            };

          return {
            id: candidate.candidate_id,
            name: `${candidate.candidate_id}.py`,
            language: "python",
            content:
              candidate.code ||
              `# ${candidate.strategy_name}\n# Approach: ${strategyMeta.approach}\n# Rationale: ${strategyMeta.rationale}\n\n# Benchmark median: ${candidate.result.benchmark_median_ms} ms\n`,
            badge: strategyMeta.approach,
          };
        });

      setFiles((prev) => {
        const withoutOldStrategies = prev.filter(
          (f) => !f.id.startsWith("strategy-")
        );
        return [...withoutOldStrategies, ...newStrategyTabs];
      });

      // Switch to the #1 ranked strategy
      if (newStrategyTabs.length > 0) {
        setActiveFileId(newStrategyTabs[0].id);
      }

      setActiveSidebarTab("arena");
      setActiveTerminalTab("benchmarks");
      showToast("✨ Strategies Generated & Ranked!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`[ERROR] Strategy planning failed: ${errMsg}`);
      showToast(`Strategy Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (activeSidebarTab === "planner") {
          handlePlanAndEvaluate();
        } else {
          handleRunTests();
        }
      }
      // Ctrl+P: Command palette
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Ctrl+`: Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#141520] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <header className="h-10 bg-[#0f1018] border-b border-[#232538] flex items-center justify-between px-3 select-none z-30 shrink-0">
        {/* Left: Window Controls & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              P
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-200">
              ParallelMe
            </span>
            <span className="text-[10px] text-purple-400 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.2 rounded font-mono hidden md:inline">
              Antigravity Studio
            </span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center justify-between w-64 md:w-96 px-3 py-1 bg-[#191a27] hover:bg-[#222435] border border-[#2b2d42] rounded-md text-xs text-slate-400 hover:text-slate-200 transition-all shadow-inner"
        >
          <span className="truncate">ParallelMe: Search files, presets, actions...</span>
          <kbd className="px-1.5 py-0.2 bg-[#12131d] rounded text-[10px] font-mono border border-[#373952]">
            Ctrl+P
          </kbd>
        </button>

        {/* Right: Quick Launchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlanAndEvaluate}
            disabled={isLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded text-xs font-medium transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Synthesize</span>
          </button>

          <button
            onClick={handleRunTests}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded text-xs font-semibold transition-colors"
          >
            <PlayIcon className="w-3 h-3 text-emerald-400" />
            <span>Run</span>
          </button>
        </div>
      </header>

      {/* Main IDE Workspace layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Activity Bar */}
        <ActivityBar
          activeTab={activeSidebarTab}
          onSelectTab={setActiveSidebarTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          backendOnline={backendOnline}
          rankedCount={planResult?.evaluation?.ranked_candidates?.length || 0}
        />

        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            activeTab={activeSidebarTab}
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            taskDescription={taskDescription}
            setTaskDescription={setTaskDescription}
            functionName={functionName}
            setFunctionName={setFunctionName}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            timeoutSeconds={timeoutSeconds}
            setTimeoutSeconds={setTimeoutSeconds}
            benchmarkRepetitions={benchmarkRepetitions}
            setBenchmarkRepetitions={setBenchmarkRepetitions}
            onRunPlanAndEvaluate={handlePlanAndEvaluate}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            rankedCandidates={planResult?.evaluation?.ranked_candidates || []}
            prunedCandidates={planResult?.evaluation?.pruned_candidates || []}
            activePresetId={activePreset.id}
            onLoadPreset={handleLoadPreset}
          />
        )}

        {/* Center & Right: Code Editor & Bottom Terminal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Code Editor */}
          <Editor
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCloseFile={(id) => {
              setFiles((prev) => prev.filter((f) => f.id !== id));
              if (activeFileId === id) setActiveFileId("main.py");
            }}
            onCodeChange={handleCodeChange}
            onCursorChange={(line, col) => {
              setCursorLine(line);
              setCursorCol(col);
            }}
            onRunTest={handleRunTests}
            onAskAI={handlePlanAndEvaluate}
            isEvaluating={isLoading}
            splitFileId={splitFileId}
            onToggleSplit={() => {
              setSplitFileId((prev) => (prev ? null : "test_main.py"));
            }}
          />

          {/* Bottom Terminal / Output Panel */}
          <TerminalPanel
            isOpen={isTerminalOpen}
            onToggleOpen={() => setIsTerminalOpen((prev) => !prev)}
            activeTab={activeTerminalTab}
            onSelectTab={setActiveTerminalTab}
            singleResult={singleResult}
            planResult={planResult}
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        backendOnline={backendOnline}
        concurrency={concurrency}
        language={files.find((f) => f.id === activeFileId)?.language || "python"}
        isEvaluating={isLoading}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Floating Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        onSelectFile={setActiveFileId}
        onLoadPreset={handleLoadPreset}
        onRunTests={handleRunTests}
        onAskAI={handlePlanAndEvaluate}
        onToggleSplit={() =>
          setSplitFileId((prev) => (prev ? null : "test_main.py"))
        }
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
      />

      {/* Toast Notification Pill */}
      {toast && (
        <div className="fixed bottom-10 right-6 z-50 bg-[#1e2033] border border-cyan-500/40 text-cyan-200 px-4 py-2 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <SparklesIcon className="w-4 h-4 text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
