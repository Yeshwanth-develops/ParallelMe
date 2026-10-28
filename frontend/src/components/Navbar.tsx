"use client";

import React from "react";

interface NavbarProps {
  backendHealth: { ok: boolean; message: string } | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export function Navbar({
  backendHealth,
  checkingHealth,
  onRefreshHealth,
  isDemoMode,
  onToggleDemoMode,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      {/* Top accent line – animated gradient */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animated-border" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">

        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Logo tile */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 glow-cyan shrink-0">
            <span className="font-mono font-black text-white text-sm select-none">⚡</span>
          </div>

          <div>
            {/* Wordmark + badge */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Parallel<span className="text-cyan-400">Me</span>
              </span>
              {/* Simulated code badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/70 text-cyan-300 font-semibold">
                <span className="token-operator text-[9px]">&lt;/&gt;</span>
                <span>Engine v0.1</span>
              </span>
            </div>

            {/* Tagline — shown as a faint code comment */}
            <p className="hidden sm:block text-[11px] font-mono text-zinc-500 mt-0.5">
              <span className="token-comment">
                {`// Parallel Strategy Experimentation & Benchmark Engine`}
              </span>
            </p>
          </div>
        </div>

        {/* ── Centre decorative code snippet (hidden on mobile) ── */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] select-none px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <span className="token-keyword">const</span>
          <span className="text-zinc-300">evaluate</span>
          <span className="token-operator">=</span>
          <span className="token-keyword">async</span>
          <span className="token-operator">(</span>
          <span className="text-amber-300">candidates</span>
          <span className="token-operator">)</span>
          <span className="token-operator">=&gt;</span>
          <span className="token-operator">{"{"}</span>
          <span className="token-string">&apos;sandbox&apos;</span>
          <span className="token-operator">{"}"}</span>
          <span className="cursor-blink text-cyan-400 font-bold ml-0.5">|</span>
        </div>

        {/* ── Status & Controls ──────────────────────────────── */}
        <div className="flex items-center gap-2.5">

          {/* Demo Mode toggle */}
          <button
            onClick={onToggleDemoMode}
            title="Toggle between live Docker backend and fast client simulation"
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all duration-200 ${
              isDemoMode
                ? "bg-amber-950/50 border-amber-600/60 text-amber-300 shadow-sm shadow-amber-500/10"
                : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isDemoMode ? "bg-amber-400 animate-pulse" : "bg-zinc-600"
              }`}
            />
            <span>{isDemoMode ? "demo:true" : "demo:false"}</span>
          </button>

          {/* Backend health pill */}
          <div
            onClick={onRefreshHealth}
            title="Click to re-check FastAPI backend health (http://localhost:8000/api/health)"
            className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700 text-xs font-mono transition-all duration-200"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                checkingHealth
                  ? "bg-blue-400 animate-ping"
                  : backendHealth?.ok
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/60"
                  : "bg-rose-500"
              }`}
            />
            <span className={`text-[11px] ${backendHealth?.ok ? "text-emerald-300" : "text-zinc-400"}`}>
              {checkingHealth ? "checking…" : backendHealth?.ok ? "api.online" : "api.offline"}
            </span>
            <span className="text-zinc-600 group-hover:text-zinc-400 text-[10px] transition-colors">↻</span>
          </div>

          {/* Port badge */}
          <span className="hidden md:inline-flex items-center font-mono text-[10px] text-zinc-500 bg-zinc-900/50 border border-zinc-800/60 px-2.5 py-1.5 rounded-lg gap-1">
            <span className="text-zinc-600">#</span>
            <span>:8000</span>
          </span>
        </div>
      </div>
    </header>
  );
}
