import React from "react";
import {
  FilesIcon,
  SparklesIcon,
  TrophyIcon,
  SettingsIcon,
  ZapIcon,
} from "./Icons";

export type ActiveSidebarTab = "files" | "planner" | "arena" | "presets";

interface ActivityBarProps {
  activeTab: ActiveSidebarTab;
  onSelectTab: (tab: ActiveSidebarTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  backendOnline: boolean;
  rankedCount: number;
}

export function ActivityBar({
  activeTab,
  onSelectTab,
  isSidebarOpen,
  onToggleSidebar,
  backendOnline,
  rankedCount,
}: ActivityBarProps) {
  const handleClick = (tab: ActiveSidebarTab) => {
    if (activeTab === tab && isSidebarOpen) {
      onToggleSidebar();
    } else {
      onSelectTab(tab);
      if (!isSidebarOpen) {
        onToggleSidebar();
      }
    }
  };

  return (
    <aside
      className="w-12 bg-[#12131c] flex flex-col items-center justify-between py-3 border-r border-[#26283b] select-none z-20 shrink-0"
      aria-label="Activity Bar"
    >
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        <button
          onClick={() => handleClick("files")}
          title="Explorer (Files & Workspace)"
          className={`relative w-10 h-10 flex items-center justify-center rounded-md transition-all ${
            isSidebarOpen && activeTab === "files"
              ? "text-cyan-400 bg-[#1c1e2e]"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#181a27]"
          }`}
        >
          {isSidebarOpen && activeTab === "files" && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-cyan-400 rounded-r-sm" />
          )}
          <FilesIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleClick("planner")}
          title="ParallelMe AI Strategy Planner (Gemini Agent)"
          className={`relative w-10 h-10 flex items-center justify-center rounded-md transition-all ${
            isSidebarOpen && activeTab === "planner"
              ? "text-purple-400 bg-[#1c1e2e]"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#181a27]"
          }`}
        >
          {isSidebarOpen && activeTab === "planner" && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-purple-400 rounded-r-sm" />
          )}
          <SparklesIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleClick("arena")}
          title="Strategy Arena & Leaderboard"
          className={`relative w-10 h-10 flex items-center justify-center rounded-md transition-all ${
            isSidebarOpen && activeTab === "arena"
              ? "text-amber-400 bg-[#1c1e2e]"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#181a27]"
          }`}
        >
          {isSidebarOpen && activeTab === "arena" && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-amber-400 rounded-r-sm" />
          )}
          <TrophyIcon className="w-5 h-5" />
          {rankedCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center rounded-full">
              {rankedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleClick("presets")}
          title="Challenge Presets & Tasks"
          className={`relative w-10 h-10 flex items-center justify-center rounded-md transition-all ${
            isSidebarOpen && activeTab === "presets"
              ? "text-emerald-400 bg-[#1c1e2e]"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#181a27]"
          }`}
        >
          {isSidebarOpen && activeTab === "presets" && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-emerald-400 rounded-r-sm" />
          )}
          <ZapIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom status & settings */}
      <div className="flex flex-col items-center gap-2">
        <div
          title={
            backendOnline
              ? "Backend API Online (http://localhost:8000)"
              : "Backend Offline (Interactive Simulation Available)"
          }
          className="relative group p-1.5 cursor-pointer"
        >
          <span
            className={`block w-2.5 h-2.5 rounded-full ${
              backendOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-500 animate-pulse"
            }`}
          />
        </div>

        <button
          onClick={() => handleClick("planner")}
          title="ParallelMe Engine Settings"
          className="w-9 h-9 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

