"use client";

import React, { useState, useEffect } from "react";
import { RankedCandidate, PrunedCandidate } from "@/types";

interface TerminalModalProps {
  candidate: RankedCandidate | PrunedCandidate | null;
  onClose: () => void;
}

export function TerminalModal({ candidate, onClose }: TerminalModalProps) {
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stdout");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!candidate) return null;

  const result = candidate.result;
  const stdout = result.stdout || "(No standard output recorded)";
  const stderr = result.stderr || "(No standard error recorded)";
  const displayedContent = activeTab === "stdout" ? stdout : stderr;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = result.passed
    ? "text-emerald-400 border-emerald-800 bg-emerald-950/60"
    : result.status === "pruned"
    ? "text-amber-400 border-amber-800 bg-amber-950/60"
    : "text-rose-400 border-rose-800 bg-rose-950/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] slide-up">

        {/* ── macOS traffic-light style title bar ───────────────── */}
        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Traffic lights */}
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors" title="Close" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />

            {/* Tab/title */}
            <div className="ml-3 flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-500">~/</span>
              <span className="text-zinc-300 font-medium">{candidate.strategy_name}</span>
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60">
                {candidate.candidate_id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-all text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {/* ── Status & tab switcher ─────────────────────────────── */}
        <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded border font-bold uppercase text-[10px] ${statusColor}`}>
              {result.status}
            </span>
            {result.duration_ms !== undefined && (
              <span className="text-zinc-500">
                <span className="token-keyword">duration</span>
                <span className="token-operator">=</span>
                <span className="token-number">{result.duration_ms}</span>
                <span className="token-string">ms</span>
              </span>
            )}
            {result.exit_code !== undefined && (
              <span className="text-zinc-500">
                <span className="token-keyword">exit</span>
                <span className="token-operator">=</span>
                <span className={result.exit_code === 0 ? "token-string" : "text-rose-400"}>
                  {result.exit_code}
                </span>
              </span>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg overflow-hidden">
            {(["stdout", "stderr"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[11px] font-mono transition-all duration-150 ${
                  activeTab === tab
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
                {tab === "stderr" && result.stderr && (
                  <span className="ml-1 text-rose-400 font-bold">!</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Terminal body ─────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden">
          {/* Scanlines overlay for terminal feel */}
          <div className="absolute inset-0 scanlines pointer-events-none z-10" />

          <div className="relative h-full p-4 bg-black overflow-auto font-mono text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap select-text selection:bg-cyan-500/25 z-0">
            {/* Fake terminal prompt prefix */}
            <span className="select-none text-zinc-700">
              {`$ docker exec sandbox pytest test_main.py\n`}
            </span>
            {displayedContent}
            <span className="cursor-blink text-zinc-500 ml-0.5">█</span>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="px-4 py-2.5 bg-zinc-900/80 border-t border-zinc-800/60 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-600 font-mono">
            <span className="token-comment">// Isolated Docker container execution log</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 transition-all duration-150 flex items-center gap-1.5"
            >
              <span>{copied ? "✓" : "⧉"}</span>
              <span>{copied ? "copied" : "copy(log)"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium text-zinc-200 bg-zinc-700 hover:bg-zinc-600 transition-all duration-150"
            >
              close()
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
