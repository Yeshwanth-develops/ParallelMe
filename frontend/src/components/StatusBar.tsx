import React from "react";
import { SparklesIcon, CpuIcon } from "./Icons";

interface StatusBarProps {
  cursorLine: number;
  cursorCol: number;
  backendOnline: boolean;
  concurrency: number;
  language: string;
  isEvaluating: boolean;
  onOpenCommandPalette: () => void;
}

export function StatusBar({
  cursorLine,
  cursorCol,
  backendOnline,
  concurrency,
  language,
  isEvaluating,
  onOpenCommandPalette,
}: StatusBarProps) {
  return (
    <footer className="h-6 bg-[#0f1018] text-[#858b9f] text-[11px] font-mono flex items-center justify-between px-3 border-t border-[#232538] select-none z-30 shrink-0">
      {/* Left side items */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <span className="text-cyan-400 font-bold">⎇</span>
          <span>main*</span>
        </button>

        <span className="text-[#3b3e55]">|</span>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline
                ? "bg-emerald-400"
                : "bg-amber-400"
            }`}
          />
          <span className={backendOnline ? "text-emerald-400" : "text-amber-400"}>
            {backendOnline ? "API Online (8000)" : "Interactive Mode"}
          </span>
        </div>

        <span className="text-[#3b3e55]">|</span>

        <div className="flex items-center gap-1.5 text-slate-400">
          <CpuIcon className="w-3 h-3 text-cyan-400" />
          <span>Workers: {concurrency}x</span>
        </div>

        {isEvaluating && (
          <>
            <span className="text-[#3b3e55]">|</span>
            <div className="flex items-center gap-1.5 text-cyan-300 animate-pulse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <span>Running Sandboxes...</span>
            </div>
          </>
        )}
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4">
        <span>
          Ln {cursorLine}, Col {cursorCol}
        </span>
        <span className="hidden sm:inline">Spaces: 4</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="text-cyan-300 uppercase font-semibold">{language}</span>
        <div className="flex items-center gap-1 text-purple-400 font-medium">
          <SparklesIcon className="w-3 h-3" />
          <span>Gemini 3.1</span>
        </div>
      </div>
    </footer>
  );
}

