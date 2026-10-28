"use client";

import React, { useEffect, useState } from "react";

interface ControlsBarProps {
  concurrency: number;
  timeoutSeconds: number;
  onUpdateConcurrency: (val: number) => void;
  onUpdateTimeout: (val: number) => void;
  onRunEvaluation: () => void;
  isRunning: boolean;
  hasResults: boolean;
  onClearResults: () => void;
}

export function ControlsBar({
  concurrency,
  timeoutSeconds,
  onUpdateConcurrency,
  onUpdateTimeout,
  onRunEvaluation,
  isRunning,
  hasResults,
  onClearResults,
}: ControlsBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      setElapsed(0);
      timer = setInterval(() => setElapsed((p) => p + 100), 100);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/70 shadow-xl">
      {/* Subtle top gradient accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="p-4 lg:p-5 flex flex-col md:flex-row items-center justify-between gap-5">

        {/* ── Config Block: shown as pseudo-object literal ─────── */}
        <div className="flex flex-wrap items-start gap-6 w-full md:w-auto font-mono">

          {/* Concurrency "property" */}
          <div className="flex flex-col gap-2 min-w-[175px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="token-keyword">max_concurrency</span>
                <span className="token-operator">:</span>
              </span>
              <span className="bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 font-bold px-2 py-0.5 rounded text-[11px] glow-cyan">
                {concurrency}
                <span className="text-cyan-600 font-normal ml-0.5">
                  {" "}{concurrency === 1 ? "worker" : "workers"}
                </span>
              </span>
            </div>
            <input
              type="range"
              min={1} max={5} step={1}
              value={concurrency}
              disabled={isRunning}
              onChange={(e) => onUpdateConcurrency(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1 rounded-full"
            />
            <div className="flex justify-between text-[9px] text-zinc-600">
              {[1,2,3,4,5].map((n) => (
                <span
                  key={n}
                  className={n === concurrency ? "text-cyan-400 font-bold" : ""}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="text-zinc-700 self-center font-mono text-xs hidden md:block">,</div>

          {/* Timeout "property" */}
          <div className="flex flex-col gap-2 min-w-[175px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="token-keyword">timeout_seconds</span>
                <span className="token-operator">:</span>
              </span>
              <span className="bg-amber-950/70 border border-amber-800/50 text-amber-300 font-bold px-2 py-0.5 rounded text-[11px]">
                <span className="token-number">{timeoutSeconds}</span>
                <span className="text-amber-600 font-normal">s</span>
              </span>
            </div>
            <input
              type="range"
              min={1} max={30} step={1}
              value={timeoutSeconds}
              disabled={isRunning}
              onChange={(e) => onUpdateTimeout(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 rounded-full"
            />
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
              <span>1s</span>
              <span className={timeoutSeconds === 15 ? "text-amber-400 font-bold" : ""}>15s</span>
              <span>30s</span>
            </div>
          </div>
        </div>

        {/* ── Run Action ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {hasResults && (
            <button
              onClick={onClearResults}
              disabled={isRunning}
              className="px-3 py-2.5 rounded-lg text-[11px] font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70 border border-zinc-800/70 transition-all duration-150"
            >
              clear()
            </button>
          )}

          <button
            onClick={onRunEvaluation}
            disabled={isRunning}
            className={`relative group overflow-hidden px-6 py-3 rounded-xl font-mono font-bold text-xs tracking-wide transition-all duration-200 shadow-lg flex items-center justify-center gap-2.5 min-w-[200px] ${
              isRunning
                ? "bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-indigo-500/30 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {/* Animated gloss layer */}
            {!isRunning && (
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out pointer-events-none" />
            )}

            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>
                  <span className="token-fn">evaluate</span>
                  <span>(…) </span>
                  <span className="text-zinc-400">{(elapsed / 1000).toFixed(1)}s</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-sm">▶</span>
                <span>
                  <span className="token-fn text-white">evaluate</span>
                  <span className="text-white/70">(</span>
                  <span className="text-amber-200">candidates</span>
                  <span className="text-white/70">)</span>
                </span>
                <kbd className="hidden lg:inline-block bg-black/30 border border-white/20 text-[9px] px-1.5 py-0.5 rounded font-mono text-zinc-300">
                  ⌃↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtle bottom gradient accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  );
}
