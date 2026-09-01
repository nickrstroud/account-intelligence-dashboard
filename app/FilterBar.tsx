"use client";

import { SENTIMENT_OPTIONS, PERIOD_OPTIONS, UPDATE_TYPE_OPTIONS } from "@/lib/filters";
import { scoreClasses } from "@/lib/score";
import { useFilters } from "./FilterContext";

export default function FilterBar() {
  const { selectedScores, toggleScore, clearScores, period, setPeriod, updateType, setUpdateType } = useFilters();
  const filtering = selectedScores.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SENTIMENT_OPTIONS.map((opt) => {
        const active = !filtering || selectedScores.has(opt.score);
        return (
          <button
            key={opt.score}
            type="button"
            onClick={() => toggleScore(opt.score)}
            className={`text-[10px] leading-none whitespace-nowrap px-2 py-1 rounded-full border cursor-pointer transition-opacity ${scoreClasses(opt.score)} ${
              active ? "opacity-100" : "opacity-40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
      {filtering && (
        <button
          type="button"
          onClick={clearScores}
          className="text-[10px] leading-none whitespace-nowrap px-2 py-1 rounded-full border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 cursor-pointer"
        >
          Clear
        </button>
      )}
      <select
        value={updateType}
        onChange={(e) => setUpdateType(e.target.value)}
        className="text-[11px] bg-white border border-slate-300 text-slate-600 rounded-md pl-2 pr-1 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <option value="all">All update types</option>
        {UPDATE_TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="text-[11px] bg-white border border-slate-300 text-slate-600 rounded-md pl-2 pr-1 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {PERIOD_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
