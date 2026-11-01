import React, { useState, useEffect, useRef } from "react";
import { FileTab, CodingPreset } from "../lib/types";
import { CODING_PRESETS } from "../lib/presets";
import {
  PythonIcon,
  JsonIcon,
  PlayIcon,
  SparklesIcon,
  SplitIcon,
  TerminalIcon,
  ZapIcon,
  CloseIcon,
} from "./Icons";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileTab[];
  onSelectFile: (fileId: string) => void;
  onLoadPreset: (preset: CodingPreset) => void;
  onRunTests: () => void;
  onAskAI: () => void;
  onToggleSplit: () => void;
  onToggleTerminal: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onLoadPreset,
  onRunTests,
  onAskAI,
  onToggleSplit,
  onToggleTerminal,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter actions and files
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPresets = CODING_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#181926] border border-[#2f3249] rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 text-xs font-sans"
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#2b2d42] bg-[#141520]">
          <span className="text-cyan-400 font-mono text-sm mr-2.5">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search files... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {/* Quick Actions */}
          <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions
          </div>

          <button
            onClick={() => {
              onRunTests();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <PlayIcon className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Run Pytest in Sandbox</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-[#12131d] rounded text-[10px] text-slate-400 font-mono border border-[#2a2d42]">
              Ctrl+Enter
            </kbd>
          </button>

          <button
            onClick={() => {
              onAskAI();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              <span className="font-medium">Generate Strategies with Gemini</span>
            </div>
            <span className="text-[10px] text-purple-400 font-mono">ParallelMe AI</span>
          </button>

          <button
            onClick={() => {
              onToggleSplit();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SplitIcon className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">Toggle Split Editor View</span>
            </div>
          </button>

          <button
            onClick={() => {
              onToggleTerminal();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-amber-400" />
              <span className="font-medium">Toggle Terminal & Metrics Panel</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-[#12131d] rounded text-[10px] text-slate-400 font-mono border border-[#2a2d42]">
              Ctrl+`
            </kbd>
          </button>

          {/* Files section */}
          {filteredFiles.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Files
              </div>
              {filteredFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {file.language === "python" ? (
                      <PythonIcon className="w-4 h-4" />
                    ) : (
                      <JsonIcon className="w-4 h-4" />
                    )}
                    <span>{file.name}</span>
                  </div>
                  {file.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#1f2133] rounded text-slate-400 capitalize">
                      {file.badge}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Presets section */}
          {filteredPresets.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Coding Challenge Presets
              </div>
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onLoadPreset(preset);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-[#25283f] text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ZapIcon className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {preset.difficulty}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

