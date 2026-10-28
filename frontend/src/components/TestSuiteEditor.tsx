"use client";

import React, { useRef, useState } from "react";

interface TestSuiteEditorProps {
  tests: string;
  onUpdateTests: (tests: string) => void;
  onResetTests?: () => void;
}

export function TestSuiteEditor({ tests, onUpdateTests, onResetTests }: TestSuiteEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(tests);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = textarea.value.substring(0, start) + "    " + textarea.value.substring(end);
      onUpdateTests(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = Math.max(tests.split("\n").length, 1);
  const testFnCount = (tests.match(/def test_/g) || []).length;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex flex-col h-full overflow-hidden shadow-xl editor-focus-ring transition-all duration-200">

      {/* ── Tab header (single tab = "test_suite.py") ─────────────── */}
      <div className="bg-zinc-950/80 border-b border-zinc-800/70 flex items-center justify-between shrink-0">
        {/* Fake VS-Code tab */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-b-2 border-b-emerald-500 bg-zinc-900 text-[11px] font-mono text-emerald-300">
          <span className="text-emerald-600 text-[9px] font-bold">fn</span>
          <span className="text-zinc-500 text-[9px]">#shared</span>
          <span>test_suite.py</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 ml-1">
            .py
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pr-3">
          {/* Test count pill */}
          <span className="font-mono text-[10px] bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-2 py-0.5 rounded">
            <span className="token-number">{testFnCount}</span>
            <span className="text-emerald-600"> tests</span>
          </span>

          {onResetTests && (
            <button
              onClick={onResetTests}
              className="px-2 py-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded border border-zinc-800/60 transition-all duration-150"
              title="Reset tests to preset defaults"
            >
              reset()
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded border border-zinc-800/60 transition-all duration-150"
          >
            <span>{copied ? "✓" : "⧉"}</span>
            <span>{copied ? "copied" : "copy()"}</span>
          </button>
        </div>
      </div>

      {/* ── Editor body ───────────────────────────────────────────── */}
      <div className="relative flex-1 flex bg-[#0a0f0a] font-mono text-xs overflow-hidden min-h-[220px]">
        {/* Line numbers gutter */}
        <div className="select-none pt-3 pb-3 px-2 text-right bg-[#090d09] border-r border-zinc-800/40 text-zinc-700 font-mono text-[11px] min-w-[2.75rem] shrink-0 leading-5">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-5">{i + 1}</div>
          ))}
        </div>

        {/* Textarea – tests have a subtly green-tinted background to visually separate them */}
        <textarea
          ref={textareaRef}
          value={tests}
          onChange={(e) => onUpdateTests(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full h-full pt-3 pb-3 pl-4 pr-3 bg-transparent text-emerald-200/90 font-mono text-[12.5px] leading-5 resize-none focus:outline-none selection:bg-emerald-500/25 overflow-auto whitespace-pre tab-4"
          placeholder={`import pytest\nfrom main import solution\n\ndef test_example():\n    assert solution() is not None`}
        />
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div className="px-3 py-1.5 bg-[#090d09] border-t border-zinc-800/40 flex items-center justify-between font-mono text-[10px]">
        <div className="flex items-center gap-3 text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-sm shadow-emerald-400/30" />
            <span>pytest</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span>Runs against all candidates concurrently</span>
        </div>
        <span className="text-zinc-600">Ln {lineCount}</span>
      </div>
    </div>
  );
}
