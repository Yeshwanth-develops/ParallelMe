"use client";

import React, { useRef } from "react";
import { Candidate } from "@/types";

interface CandidateEditorProps {
  candidates: Candidate[];
  activeCandidateId: string;
  onSelectCandidate: (id: string) => void;
  onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
  onAddCandidate: () => void;
  onDeleteCandidate: (id: string) => void;
  onDuplicateCandidate: (id: string) => void;
}

/** File-language badge colours mirroring VS Code */
const PY_BADGE = (
  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/40 text-blue-300">
    .py
  </span>
);

export function CandidateEditor({
  candidates,
  activeCandidateId,
  onSelectCandidate,
  onUpdateCandidate,
  onAddCandidate,
  onDeleteCandidate,
  onDuplicateCandidate,
}: CandidateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeCandidate =
    candidates.find((c) => c.candidate_id === activeCandidateId) || candidates[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onUpdateCandidate(activeCandidate.candidate_id, { code: newValue });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const codeLines = (activeCandidate?.code || "").split("\n");
  const lineCount = Math.max(codeLines.length, 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex flex-col h-full overflow-hidden shadow-xl editor-focus-ring transition-all duration-200">

      {/* ── VS-Code-style Tab Bar ─────────────────────────────────── */}
      <div className="bg-zinc-950/80 border-b border-zinc-800/70 flex items-center justify-between overflow-x-auto shrink-0">
        <div className="flex items-center overflow-x-auto">
          {candidates.map((c, index) => {
            const isActive = c.candidate_id === activeCandidate.candidate_id;
            return (
              <button
                key={c.candidate_id}
                onClick={() => onSelectCandidate(c.candidate_id)}
                className={`group flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-mono whitespace-nowrap shrink-0 border-r border-zinc-800/60 transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border-b-2 border-b-cyan-500 tab-active-glow"
                    : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 border-b-2 border-b-transparent"
                }`}
              >
                <span className={`text-[8px] font-bold transition-colors ${isActive ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-500"}`}>
                  fn
                </span>
                <span className="text-zinc-500 text-[9px]">#{index + 1}</span>
                <span className="truncate max-w-[110px]">{c.strategy_name}</span>
                {PY_BADGE}
              </button>
            );
          })}

          {candidates.length < 10 && (
            <button
              onClick={onAddCandidate}
              title="Add a new candidate strategy (max 10)"
              className="flex items-center gap-1 px-3 py-2.5 text-[11px] font-mono text-zinc-600 hover:text-cyan-400 border-b-2 border-b-transparent hover:bg-zinc-900/40 transition-all duration-150 whitespace-nowrap shrink-0"
            >
              <span className="text-base font-bold leading-none">+</span>
              <span className="hidden sm:inline text-[10px]">strategy</span>
            </button>
          )}
        </div>

        <span className="text-[10px] font-mono text-zinc-600 shrink-0 pr-3 pl-2">
          {candidates.length}/10
        </span>
      </div>

      {/* ── Meta Bar (strategy name input + actions) ──────────────── */}
      <div className="px-3 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          {/* Inline code-style label */}
          <span className="font-mono text-[10px] text-zinc-500 shrink-0">
            <span className="token-keyword">const</span>{" "}
            <span className="text-amber-300">strategy</span>{" "}
            <span className="token-operator">=</span>
          </span>
          <input
            type="text"
            value={activeCandidate.strategy_name}
            onChange={(e) =>
              onUpdateCandidate(activeCandidate.candidate_id, {
                strategy_name: e.target.value,
              })
            }
            className="bg-zinc-950/60 border border-zinc-800/80 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500/60 focus:bg-zinc-950 transition-all duration-150 w-full max-w-xs"
            placeholder="Iterative O(1)"
          />
          <span className="hidden sm:inline text-[10px] font-mono text-zinc-600 bg-zinc-950/60 border border-zinc-800/60 px-2 py-0.5 rounded shrink-0">
            id:{activeCandidate.candidate_id}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDuplicateCandidate(activeCandidate.candidate_id)}
            title="Duplicate this strategy"
            className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-800/70 bg-zinc-900/60 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 text-[10px] font-mono transition-all duration-150 hover:bg-zinc-800/50"
          >
            <span className="text-zinc-500">⧉</span>
            <span>copy()</span>
          </button>

          {candidates.length > 1 && (
            <button
              onClick={() => onDeleteCandidate(activeCandidate.candidate_id)}
              title="Delete this candidate"
              className="flex items-center gap-1 px-2 py-1 rounded border border-rose-900/40 bg-rose-950/20 text-rose-500 hover:text-rose-300 hover:bg-rose-950/40 text-[10px] font-mono transition-all duration-150"
            >
              <span>✕</span>
              <span>del()</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Code Editor Body ──────────────────────────────────────── */}
      <div className="relative flex-1 flex bg-[#0d0d0f] font-mono text-xs overflow-hidden min-h-[300px]">

        {/* Line-numbers gutter */}
        <div className="select-none pt-3 pb-3 px-2 text-right bg-[#0a0a0c] border-r border-zinc-800/50 text-zinc-600 font-mono text-[11px] min-w-[3rem] shrink-0 leading-5">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className={`leading-5 px-1 transition-colors ${
                i === 0 ? "text-zinc-400" : ""
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={activeCandidate.code}
          onChange={(e) =>
            onUpdateCandidate(activeCandidate.candidate_id, { code: e.target.value })
          }
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full h-full pt-3 pb-3 pl-4 pr-3 bg-transparent text-zinc-200 font-mono text-[12.5px] leading-5 resize-none focus:outline-none selection:bg-cyan-500/25 overflow-auto whitespace-pre tab-4"
          placeholder={`# Python strategy to evaluate...\ndef solution():\n    pass`}
        />
      </div>

      {/* ── VS-Code-style status bar ──────────────────────────────── */}
      <div className="px-3 py-1.5 bg-[#0a0a0c] border-t border-zinc-800/50 flex items-center justify-between font-mono text-[10px]">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-sm shadow-cyan-400/40" />
            <span>Python 3.11</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-600">Isolated Sandbox</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-600">UTF-8</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-600">
          <span>Ln {lineCount}</span>
          <span>{activeCandidate.code.length} chars</span>
        </div>
      </div>
    </div>
  );
}
