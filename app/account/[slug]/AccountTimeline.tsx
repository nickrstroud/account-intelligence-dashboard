"use client";

import { useMemo } from "react";
import type { CompanyAnalysis } from "@/lib/data";
import { scoreClasses, scoreLabel, formatDate } from "@/lib/score";
import { withinPeriod, updateTypeLabel } from "@/lib/filters";
import { useFilters } from "@/app/FilterContext";

export default function AccountTimeline({ history }: { history: CompanyAnalysis[] }) {
  const { selectedScores, period, updateType } = useFilters();

  const filteredRuns = useMemo(() => {
    const signalFilterActive = selectedScores.size > 0 || updateType !== "all";
    return history
      .filter((run) => withinPeriod(run.runAt, period))
      .map((run) => ({
        ...run,
        visibleSignals: signalFilterActive
          ? run.signals.filter(
              (s) =>
                (selectedScores.size === 0 || selectedScores.has(s.score)) &&
                (updateType === "all" || s.updateType === updateType),
            )
          : run.signals,
      }))
      .filter((run) => !signalFilterActive || run.visibleSignals.length > 0);
  }, [history, selectedScores, period, updateType]);

  return (
    <div>
      {filteredRuns.length === 0 && (
        <p className="text-sm text-slate-500">No runs match the current filters.</p>
      )}

      <div className="space-y-6">
        {filteredRuns.map((run, i) => (
          <div key={i} className="border-l-2 border-slate-200 pl-5 relative">
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300" />
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] text-slate-400">{formatDate(run.runAt)}</p>
              {run.source === "backfill" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-500">
                  historical
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 mb-3">{run.headline}</p>
            {run.visibleSignals.length === 0 ? (
              <p className="text-xs text-slate-400">No account-relevant signals this run.</p>
            ) : (
              <div className="space-y-3">
                {run.visibleSignals.map((signal, j) => (
                  <div key={j} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500">{signal.category}</span>
                        {updateTypeLabel(signal.updateType) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 bg-slate-50">
                            {updateTypeLabel(signal.updateType)}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${scoreClasses(signal.score)}`}>
                        {scoreLabel(signal.score)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{signal.summary}</p>
                    <p className="text-xs text-slate-500 mb-2">
                      <span className="text-slate-600">Suggested action:</span> {signal.suggestedAction}
                    </p>
                    {signal.sourceLink && (
                      <a
                        href={signal.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline"
                      >
                        {signal.sourceName ?? "Source"} ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
