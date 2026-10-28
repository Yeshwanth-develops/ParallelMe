"use client";

import React, { useState } from "react";
import { EvaluationResponse, RankedCandidate, PrunedCandidate } from "@/types";
import { TerminalModal } from "./TerminalModal";

interface ResultsDashboardProps {
  results: EvaluationResponse;
}

const RANK_BADGE: Record<number, { emoji: string; border: string; bg: string; shadow: string }> = {
  1: { emoji: "🥇", border: "border-amber-400",   bg: "bg-amber-400/10",  shadow: "shadow-amber-400/20" },
  2: { emoji: "🥈", border: "border-zinc-400",    bg: "bg-zinc-400/10",   shadow: "" },
  3: { emoji: "🥉", border: "border-amber-700",   bg: "bg-amber-700/10",  shadow: "" },
};

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<
    RankedCandidate | PrunedCandidate | null
  >(null);

  const ranked = results.ranked_candidates || [];
  const pruned = results.pruned_candidates || [];

  const validDurations = ranked
    .map((c) => c.result.duration_ms)
    .filter((d) => typeof d === "number" && d > 0);
  const minDuration = validDurations.length ? Math.min(...validDurations) : 0;
  const maxDuration = validDurations.length ? Math.max(...validDurations) : 1;
  const winner = ranked.length > 0 && ranked[0].result.passed ? ranked[0] : null;

  return (
    <div className="flex flex-col gap-6 slide-up">

      {/* ── Section header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
        <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-2">
          <span className="token-comment">{"// evaluation.results"}</span>
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
      </div>

      {/* ── Metric Cards (styled as code object properties) ──────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 font-mono">
        {[
          {
            label: "total_candidates",
            value: results.total_candidates,
            color: "text-zinc-200",
            accent: "border-zinc-700/50",
            icon: "{}",
          },
          {
            label: "evaluated_count",
            value: results.evaluated_count,
            color: "text-emerald-300",
            accent: "border-emerald-800/50 glow-green",
            icon: "▶",
          },
          {
            label: "pruned_count",
            value: results.pruned_count,
            color: "text-amber-300",
            accent: "border-amber-900/50",
            icon: "⚠",
          },
          {
            label: "fastest_ms",
            value: minDuration > 0 ? `${minDuration}ms` : "—",
            color: "text-cyan-300",
            accent: "border-cyan-900/50 glow-cyan",
            icon: "⚡",
          },
        ].map(({ label, value, color, accent, icon }) => (
          <div
            key={label}
            className={`bg-zinc-900/50 border ${accent} rounded-xl p-4 shadow-md hover:bg-zinc-900/70 transition-all duration-200`}
          >
            {/* Property key */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mb-1">
              <span className="text-zinc-600">{icon}</span>
              <span className="token-keyword">{label}</span>
              <span className="token-operator">:</span>
            </div>
            {/* Value */}
            <div className={`text-2xl lg:text-3xl font-extrabold ${color} leading-tight`}>
              {value}
            </div>
            {label === "fastest_ms" && winner && (
              <div className="text-[10px] text-zinc-600 mt-1 truncate">
                <span className="token-comment">{`// ${winner.strategy_name}`}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Leaderboard ──────────────────────────────────────────── */}
      <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-950/80 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-amber-400 font-bold">🏆</span>
            <span className="token-keyword">ranked_candidates</span>
            <span className="token-operator">.</span>
            <span className="token-fn">sort</span>
            <span className="token-operator">(</span>
            <span className="token-string">&apos;pass_rate&apos;</span>
            <span className="text-zinc-500">,</span>
            <span className="token-string">&apos;duration_ms&apos;</span>
            <span className="token-operator">)</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 hidden sm:block">
            {ranked.length} result{ranked.length !== 1 ? "s" : ""}
          </span>
        </div>

        {ranked.length === 0 ? (
          <div className="p-10 text-center font-mono text-zinc-600 text-sm">
            <span className="token-comment">{"// All candidates were pruned before evaluation"}</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {ranked.map((candidate) => {
              const res = candidate.result;
              const isWinner = candidate.rank === 1 && res.passed;
              const passPercent = Math.round(candidate.pass_rate * 100);
              const badge = RANK_BADGE[candidate.rank];

              return (
                <div
                  key={candidate.candidate_id}
                  className={`group p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-150 ${
                    isWinner
                      ? "bg-emerald-950/15 hover:bg-emerald-950/25"
                      : "hover:bg-zinc-800/30"
                  }`}
                >
                  {/* Left: rank + identity */}
                  <div className="flex items-start md:items-center gap-3">
                    {/* Rank badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 border shadow-md ${
                        badge
                          ? `${badge.border} ${badge.bg} ${badge.shadow}`
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {badge ? badge.emoji : `#${candidate.rank}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-100 text-sm">{candidate.strategy_name}</span>
                        {isWinner && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 glow-green">
                            winner
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/60">
                          {candidate.candidate_id}
                        </span>
                      </div>
                      {/* Status line styled like an object */}
                      <div className="font-mono text-[10px] text-zinc-600 mt-0.5 flex items-center gap-2">
                        <span className="token-keyword">status</span>
                        <span className="token-operator">:</span>
                        <span
                          className={
                            res.passed
                              ? "token-string"
                              : res.status === "timeout"
                              ? "text-amber-400"
                              : "text-rose-400"
                          }
                        >
                          &apos;{res.status}&apos;
                        </span>
                        <span className="text-zinc-700">|</span>
                        <span className="token-keyword">exit</span>
                        <span className="token-operator">:</span>
                        <span className={res.exit_code === 0 ? "token-number" : "text-rose-400"}>
                          {res.exit_code ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: pass-rate progress bar */}
                  <div className="flex flex-col gap-1.5 md:w-52 shrink-0">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-zinc-600">
                        <span className="token-keyword">pass_rate</span>
                        <span className="token-operator">:</span>
                      </span>
                      <span
                        className={`font-bold ${
                          passPercent === 100
                            ? "text-emerald-400"
                            : passPercent > 0
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        <span className="token-number">{passPercent}</span>
                        <span className="text-zinc-500">%</span>
                      </span>
                    </div>

                    {/* Progress bar with shimmer on 100% */}
                    <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          passPercent === 100
                            ? "bg-emerald-500"
                            : passPercent > 0
                            ? "bg-amber-500"
                            : "bg-rose-600"
                        }`}
                        style={{ width: `${passPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between font-mono text-[9px] text-zinc-600">
                      <span>
                        <span className="text-emerald-500">✓</span> {res.passed_tests ?? 0} passed
                      </span>
                      <span>
                        <span className="text-rose-500">✕</span> {res.failed_tests ?? 0} failed
                      </span>
                    </div>
                  </div>

                  {/* Right: duration + logs button */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-zinc-600">
                        <span className="token-keyword">duration</span>
                        <span className="token-operator">:</span>
                      </div>
                      <div className="text-sm font-extrabold text-cyan-300">
                        <span className="token-number">{res.duration_ms}</span>
                        <span className="text-cyan-600 font-normal">ms</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700/60 hover:border-zinc-600 transition-all duration-150 hover:shadow-sm"
                      title="Inspect terminal output logs"
                    >
                      <span className="text-zinc-500 group-hover:text-zinc-300">$</span>
                      <span>logs()</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Runtime Comparison Chart ──────────────────────────────── */}
      {ranked.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-mono text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="token-comment">{"// execution_time.benchmark()"}</span>
              <span className="text-zinc-600">— lower is faster</span>
            </h4>
            <span className="font-mono text-[10px] text-zinc-600">
              min:<span className="token-number">{minDuration}</span>ms
              {" · "}
              max:<span className="token-number">{maxDuration}</span>ms
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {ranked.map((c) => {
              const duration = c.result.duration_ms || 0;
              const widthPercent = maxDuration > 0
                ? Math.max(6, Math.min(100, Math.round((duration / maxDuration) * 100)))
                : 6;

              return (
                <div key={c.candidate_id} className="flex items-center gap-3 text-xs font-mono group">
                  <div className="w-28 sm:w-36 truncate text-zinc-400 text-right shrink-0 text-[11px] group-hover:text-zinc-200 transition-colors">
                    {c.strategy_name}
                  </div>
                  <div className="flex-1 bg-zinc-800/60 rounded h-7 overflow-hidden flex items-center p-1">
                    <div
                      className={`h-full rounded transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                        c.rank === 1 && c.result.passed
                          ? "bg-gradient-to-r from-emerald-600 to-cyan-500"
                          : c.result.passed
                          ? "bg-gradient-to-r from-cyan-700 to-indigo-600"
                          : "bg-rose-900/80"
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      {widthPercent > 18 && <span>{duration}ms</span>}
                    </div>
                    {widthPercent <= 18 && (
                      <span className="ml-2 text-[10px] text-zinc-500">{duration}ms</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pruned Candidates ──────────────────────────────────────── */}
      {pruned.length > 0 && (
        <div className="bg-zinc-900/40 border border-amber-900/30 rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3 bg-amber-950/15 border-b border-amber-900/20 flex items-center justify-between">
            <div className="font-mono text-[11px] flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span className="token-keyword">pruned_candidates</span>
              <span className="token-operator">:</span>
              <span className="token-number">[{pruned.length}]</span>
            </div>
            <span className="font-mono text-[10px] token-comment hidden sm:block">
              {"// AST-validated before container allocation"}
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {pruned.map((c) => {
              const res = c.result;
              const isDuplicate = res.reason === "duplicate_code";

              return (
                <div
                  key={c.candidate_id}
                  className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 flex flex-col gap-2.5 hover:border-zinc-700/60 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-semibold text-sm text-zinc-200">{c.strategy_name}</h5>
                      <span className="font-mono text-[10px] text-zinc-600">{c.candidate_id}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        isDuplicate
                          ? "bg-amber-950/80 text-amber-400 border-amber-800/50"
                          : "bg-rose-950/80 text-rose-400 border-rose-800/50"
                      }`}
                    >
                      {isDuplicate ? "duplicate" : "SyntaxError"}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5">
                    {isDuplicate ? (
                      <span className="token-comment">
                        {`// duplicate_of: "${res.duplicate_of || "previous candidate"}"`}
                      </span>
                    ) : (
                      <span className="text-rose-300">
                        <span className="text-rose-500">SyntaxError: </span>
                        {res.syntax_error?.message || "invalid syntax"}
                        {res.syntax_error?.line ? (
                          <span className="text-zinc-500"> (Ln {res.syntax_error.line})</span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TerminalModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
    </div>
  );
}
