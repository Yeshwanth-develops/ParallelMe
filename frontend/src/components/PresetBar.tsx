"use client";

import React from "react";
import { Preset } from "@/types";
import { PRESETS } from "@/lib/presets";

interface PresetBarProps {
  activePresetId: string;
  onSelectPreset: (preset: Preset) => void;
  onResetPreset: () => void;
}

const PRESET_ICONS: Record<string, string> = {
  fibonacci:  "fn()",
  "two-sum":  "{}",
  sorting:    "[]",
  palindrome: "</>",
};

const DIFFICULTY_COLORS = {
  Easy:   "bg-emerald-950/80 text-emerald-400 border-emerald-800/50",
  Medium: "bg-amber-950/80   text-amber-400   border-amber-800/50",
  Hard:   "bg-rose-950/80    text-rose-400    border-rose-800/50",
};

export function PresetBar({ activePresetId, onSelectPreset, onResetPreset }: PresetBarProps) {
  const currentPreset = PRESETS.find((p) => p.id === activePresetId) || PRESETS[0];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-md bg-grid">
      {/* ── Header strip ──────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-zinc-950/70 border-b border-zinc-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          {/* Fake file-path breadcrumb */}
          <span className="text-zinc-600">~/</span>
          <span className="text-zinc-500">parallelme</span>
          <span className="text-zinc-600">/</span>
          <span className="text-cyan-400 font-semibold">presets</span>
          <span className="text-zinc-600">/</span>
          <span className="text-emerald-400">{currentPreset.id}.py</span>
        </div>

        {/* Reset */}
        <button
          onClick={onResetPreset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800/70 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-[11px] font-mono transition-all duration-150 hover:bg-zinc-800/60"
          title="Reset preset to its original state"
        >
          <span className="text-zinc-500">↺</span>
          <span>reset()</span>
        </button>
      </div>

      {/* ── Preset tabs ───────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-[11px] font-mono text-zinc-500 shrink-0 flex items-center gap-1.5">
          <span className="token-keyword">import</span>
          <span className="text-zinc-300">{"{"}</span>
          <span className="text-amber-300">preset</span>
          <span className="text-zinc-300">{"}"}</span>
          <span className="token-keyword">from</span>
        </span>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = preset.id === activePresetId;
            const icon = PRESET_ICONS[preset.id] ?? "{}";
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border ${
                  isActive
                    ? "bg-zinc-800/90 border-cyan-500/50 text-cyan-300 shadow-sm glow-cyan"
                    : "bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/40"
                }`}
              >
                {/* Code-symbol icon */}
                <span
                  className={`font-mono text-[10px] font-bold ${
                    isActive ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"
                  } transition-colors`}
                >
                  {icon}
                </span>
                <span>{preset.title}</span>
                {/* Difficulty badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    DIFFICULTY_COLORS[preset.difficulty]
                  }`}
                >
                  {preset.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Description strip (styled as a code comment) ──────────── */}
      <div className="px-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="font-mono text-[11px] token-comment leading-relaxed">
          {`/* ${currentPreset.description} */`}
        </p>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/50 text-zinc-400">
            <span className="token-number">{currentPreset.candidates.length}</span>
            <span className="text-zinc-500"> strategies</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/50 text-zinc-400">
            <span className="text-zinc-500">timeout=</span>
            <span className="token-number">{currentPreset.timeout_seconds}</span>
            <span className="token-string">s</span>
          </span>
        </div>
      </div>
    </div>
  );
}
