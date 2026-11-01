import React, { useRef, useState, useMemo } from "react";
import { FileTab } from "../lib/types";
import {
  PythonIcon,
  JsonIcon,
  CloseIcon,
  SplitIcon,
  CopyIcon,
  CheckIcon,
  PlayIcon,
  SparklesIcon,
} from "./Icons";

interface EditorProps {
  files: FileTab[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onCodeChange: (fileId: string, newContent: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onRunTest: () => void;
  onAskAI: () => void;
  isEvaluating: boolean;
  splitFileId: string | null;
  onToggleSplit: () => void;
}

export function Editor({
  files,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onCodeChange,
  onCursorChange,
  onRunTest,
  onAskAI,
  isEvaluating,
  splitFileId,
  onToggleSplit,
}: EditorProps) {
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const splitFile = splitFileId ? files.find((f) => f.id === splitFileId) || null : null;

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e2e] overflow-hidden select-text">
      {/* Tab bar header */}
      <div className="h-9 bg-[#181825] flex items-center justify-between border-b border-[#2b2c40] px-2 select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar h-full">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center gap-2 px-3 h-full border-r border-[#242536] cursor-pointer text-xs transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#1e1e2e] text-slate-100 border-t-2 border-t-cyan-400 font-medium"
                    : "text-slate-400 hover:bg-[#1f2030] hover:text-slate-200"
                }`}
              >
                {file.language === "python" ? (
                  <PythonIcon className="w-3.5 h-3.5" />
                ) : (
                  <JsonIcon className="w-3.5 h-3.5" />
                )}
                <span>{file.name}</span>
                {file.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold capitalize ${
                      file.badge === "optimized"
                        ? "bg-emerald-950 text-emerald-400"
                        : file.badge === "algorithmic"
                        ? "bg-purple-950 text-purple-400"
                        : "bg-blue-950 text-blue-400"
                    }`}
                  >
                    {file.badge}
                  </span>
                )}
                {file.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:hidden" />
                )}
                {/* Allow closing non-root files */}
                {file.id.startsWith("strategy-") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-100 p-0.5 rounded hover:bg-[#2b2c40]"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Editor Top-Right Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <button
            onClick={onToggleSplit}
            title={splitFileId ? "Close Split Editor" : "Split Editor Right"}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              splitFileId
                ? "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#26283d]"
            }`}
          >
            <SplitIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onAskAI}
            title="Ask Antigravity Strategy Agent"
            className="px-2.5 py-1 rounded text-xs bg-purple-950/60 border border-purple-800/40 hover:bg-purple-900/50 text-purple-300 flex items-center gap-1.5 transition-colors font-medium shadow-sm"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Strategies</span>
          </button>

          <button
            onClick={onRunTest}
            disabled={isEvaluating}
            title="Run Pytest in Sandbox (Ctrl+Enter)"
            className="px-2.5 py-1 rounded text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 transition-all font-semibold shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isEvaluating ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <PlayIcon className="w-3 h-3" />
            )}
            <span>Run Tests</span>
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="h-6 bg-[#1b1c2b] border-b border-[#26283b] px-4 flex items-center gap-1.5 text-[11px] text-slate-400 select-none">
        <span className="text-slate-500">workspace</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">{activeFile?.name}</span>
        {activeFile?.language === "python" && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-mono">def implementation</span>
          </>
        )}
      </div>

      {/* Editor Body (supports single or side-by-side split) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane (Primary Active File) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#26283b]">
          {activeFile && (
            <SingleEditorPane
              file={activeFile}
              onChange={(newVal) => onCodeChange(activeFile.id, newVal)}
              onCursorChange={onCursorChange}
            />
          )}
        </div>

        {/* Right Pane (Split Mode if enabled) */}
        {splitFile && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1a1b2a]">
            <div className="h-7 bg-[#161725] px-3 flex items-center justify-between border-b border-[#26283b] text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                {splitFile.language === "python" ? (
                  <PythonIcon className="w-3.5 h-3.5" />
                ) : (
                  <JsonIcon className="w-3.5 h-3.5" />
                )}
                <span className="font-medium text-slate-200">{splitFile.name}</span>
                <span className="text-[10px] text-slate-500">(Split View)</span>
              </div>
              <button
                onClick={onToggleSplit}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
            <SingleEditorPane
              file={splitFile}
              onChange={(newVal) => onCodeChange(splitFile.id, newVal)}
              onCursorChange={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SingleEditorPaneProps {
  file: FileTab;
  onChange: (content: string) => void;
  onCursorChange: (line: number, col: number) => void;
}

function SingleEditorPane({ file, onChange, onCursorChange }: SingleEditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeLine, setActiveLine] = useState(1);

  const lines = useMemo(() => file.content.split("\n"), [file.content]);

  // Sync line number scrolling with code scrolling
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const { selectionStart } = textareaRef.current;
    const textUpToCursor = file.content.substring(0, selectionStart);
    const lineIndex = textUpToCursor.split("\n").length;
    const currentLineText = textUpToCursor.split("\n").pop() || "";
    const colIndex = currentLineText.length + 1;

    setActiveLine(lineIndex);
    onCursorChange(lineIndex, colIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key support: insert 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        file.content.substring(0, start) + "    " + file.content.substring(end);
      onChange(newContent);

      // Reposition cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        updateCursorPosition();
      }, 0);
    }

    // Auto-indent on Enter
    if (e.key === "Enter") {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const textUpToCursor = file.content.substring(0, start);
      const lastLine = textUpToCursor.split("\n").pop() || "";
      const match = lastLine.match(/^(\s+)/);
      const indent = match ? match[1] : "";
      const extraIndent = lastLine.trim().endsWith(":") ? "    " : "";

      if (indent || extraIndent) {
        e.preventDefault();
        const addition = "\n" + indent + extraIndent;
        const newContent =
          file.content.substring(0, start) +
          addition +
          file.content.substring(textarea.selectionEnd);
        onChange(newContent);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + addition.length;
          updateCursorPosition();
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex-1 flex h-full font-mono text-sm overflow-hidden bg-[#1e1e2e]">
      {/* Floating Copy Button */}
      <button
        onClick={handleCopy}
        title="Copy Code"
        className="absolute top-2 right-4 z-10 p-1.5 rounded bg-[#2b2c40]/80 text-slate-400 hover:text-slate-100 hover:bg-[#35374e] transition-all backdrop-blur-sm shadow"
      >
        {copied ? (
          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <CopyIcon className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Gutter / Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="w-12 py-3 bg-[#1e1e2e] text-[#585b70] select-none text-right pr-3 overflow-hidden border-r border-[#26283b] shrink-0 font-mono text-xs leading-[22px]"
      >
        {lines.map((_, index) => {
          const lineNum = index + 1;
          const isCurrent = lineNum === activeLine;
          return (
            <div
              key={lineNum}
              className={`${
                isCurrent ? "text-slate-200 font-bold" : "text-[#585b70]"
              }`}
            >
              {lineNum}
            </div>
          );
        })}
      </div>

      {/* Code Textarea with Active Line Highlighting */}
      <div className="relative flex-1 h-full overflow-hidden">
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full h-full py-3 px-4 bg-transparent text-slate-100 resize-none focus:outline-none font-mono text-xs leading-[22px] overflow-auto custom-scrollbar tab-size-4 selection:bg-[#3e445e]"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}
