"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Candidate, EvaluationResponse, Preset } from "@/types";
import { PRESETS } from "@/lib/presets";
import {
  checkBackendHealth,
  runParallelEvaluation,
  simulateParallelEvaluation,
} from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { PresetBar } from "@/components/PresetBar";
import { CandidateEditor } from "@/components/CandidateEditor";
import { TestSuiteEditor } from "@/components/TestSuiteEditor";
import { ControlsBar } from "@/components/ControlsBar";
import { ResultsDashboard } from "@/components/ResultsDashboard";

export default function Home() {
  const [activePresetId, setActivePresetId] = useState<string>("fibonacci");
  const [candidates, setCandidates] = useState<Candidate[]>(
    PRESETS[0].candidates
  );
  const [activeCandidateId, setActiveCandidateId] = useState<string>(
    PRESETS[0].candidates[0].candidate_id
  );
  const [tests, setTests] = useState<string>(PRESETS[0].tests);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(
    PRESETS[0].timeout_seconds
  );
  const [concurrency, setConcurrency] = useState<number>(
    PRESETS[0].max_concurrency
  );

  const [backendHealth, setBackendHealth] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<EvaluationResponse | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  const handleCheckHealth = useCallback(async () => {
    setCheckingHealth(true);
    const health = await checkBackendHealth();
    setBackendHealth(health);
    setCheckingHealth(false);
    if (!health.ok) {
      // Auto-suggest demo simulation mode if backend isn't reachable
      setIsDemoMode(true);
    }
  }, []);

  useEffect(() => {
    handleCheckHealth();
  }, [handleCheckHealth]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setCandidates(preset.candidates);
    setActiveCandidateId(preset.candidates[0].candidate_id);
    setTests(preset.tests);
    setTimeoutSeconds(preset.timeout_seconds);
    setConcurrency(preset.max_concurrency);
    setErrorMessage(null);
  };

  // Reset current preset
  const handleResetPreset = () => {
    const original =
      PRESETS.find((p) => p.id === activePresetId) || PRESETS[0];
    handleSelectPreset(original);
  };

  // Add Candidate
  const handleAddCandidate = () => {
    if (candidates.length >= 10) return;
    const nextIndex = candidates.length + 1;
    const newId = `candidate-${Date.now().toString().slice(-4)}`;
    const newCandidate: Candidate = {
      candidate_id: newId,
      strategy_name: `Strategy #${nextIndex}`,
      code: `def solution():\n    \"\"\"Custom candidate implementation\"\"\"\n    pass\n`,
    };
    setCandidates([...candidates, newCandidate]);
    setActiveCandidateId(newId);
  };

  // Update Candidate
  const handleUpdateCandidate = (
    id: string,
    updates: Partial<Candidate>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.candidate_id === id ? { ...c, ...updates } : c))
    );
  };

  // Delete Candidate
  const handleDeleteCandidate = (id: string) => {
    if (candidates.length <= 1) return;
    const filtered = candidates.filter((c) => c.candidate_id !== id);
    setCandidates(filtered);
    if (activeCandidateId === id) {
      setActiveCandidateId(filtered[0].candidate_id);
    }
  };

  // Duplicate Candidate
  const handleDuplicateCandidate = (id: string) => {
    if (candidates.length >= 10) return;
    const target = candidates.find((c) => c.candidate_id === id);
    if (!target) return;

    const newId = `${target.candidate_id}-copy`;
    const duplicated: Candidate = {
      candidate_id: newId,
      strategy_name: `${target.strategy_name} (Copy)`,
      code: target.code,
    };
    setCandidates([...candidates, duplicated]);
    setActiveCandidateId(newId);
  };

  // Run Parallel Evaluation
  const handleRunEvaluation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMessage(null);

    try {
      let evaluationResult: EvaluationResponse;
      if (isDemoMode) {
        evaluationResult = await simulateParallelEvaluation(candidates, tests);
      } else {
        evaluationResult = await runParallelEvaluation(
          candidates,
          tests,
          timeoutSeconds,
          concurrency
        );
      }
      setResults(evaluationResult);

      // Smooth scroll down to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Evaluation failed";
      setErrorMessage(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunEvaluation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [candidates, tests, timeoutSeconds, concurrency, isDemoMode, isRunning]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans bg-grid">
      {/* Top Navbar */}
      <Navbar
        backendHealth={backendHealth}
        checkingHealth={checkingHealth}
        onRefreshHealth={handleCheckHealth}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
        {/* Preset Selector Banner */}
        <PresetBar
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onResetPreset={handleResetPreset}
        />

        {/* Studio Workspace: Code Editor & Pytest Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Candidate Strategies Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-[520px]">
            <CandidateEditor
              candidates={candidates}
              activeCandidateId={activeCandidateId}
              onSelectCandidate={setActiveCandidateId}
              onUpdateCandidate={handleUpdateCandidate}
              onAddCandidate={handleAddCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              onDuplicateCandidate={handleDuplicateCandidate}
            />
          </div>

          {/* Pytest Test Suite Editor (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-[520px]">
            <TestSuiteEditor
              tests={tests}
              onUpdateTests={setTests}
              onResetTests={handleResetPreset}
            />
          </div>
        </div>

        {/* Execution Controls Bar */}
        <ControlsBar
          concurrency={concurrency}
          timeoutSeconds={timeoutSeconds}
          onUpdateConcurrency={setConcurrency}
          onUpdateTimeout={setTimeoutSeconds}
          onRunEvaluation={handleRunEvaluation}
          isRunning={isRunning}
          hasResults={results !== null}
          onClearResults={() => setResults(null)}
        />

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-rose-400 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-rose-100">Execution Error</p>
                <p className="text-rose-300 font-mono mt-0.5">{errorMessage}</p>
              </div>
            </div>

            {!isDemoMode && (
              <button
                onClick={() => {
                  setIsDemoMode(true);
                  setErrorMessage(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-100 font-medium text-xs transition shrink-0"
              >
                Switch to Demo Mode &rarr;
              </button>
            )}
          </div>
        )}

        {/* Evaluation Results & Leaderboard Dashboard */}
        {results && (
          <div ref={resultsRef} className="pt-4">
            <ResultsDashboard results={results} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 py-5 px-4 text-center">
        <div className="font-mono text-[11px] text-zinc-600 flex flex-wrap items-center justify-center gap-2">
          <span className="token-comment">{"/*"}</span>
          <span className="token-keyword">ParallelMe</span>
          <span className="token-operator">::</span>
          <span className="token-fn">sandbox</span>
          <span className="token-operator">(</span>
          <span className="token-string">&apos;Parallel Strategy Engine&apos;</span>
          <span className="token-operator">)</span>
          <span className="token-comment">{"*/"}</span>
        </div>
      </footer>
    </div>
  );
}
