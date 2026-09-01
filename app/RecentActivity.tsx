"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/data";
import { scoreClasses, scoreLabel, formatDate } from "@/lib/score";
import { withinPeriod, updateTypeLabel } from "@/lib/filters";
import { useFilters } from "./FilterContext";

export default function RecentActivity({ feed }: { feed: FeedItem[] }) {
  const { selectedScores, period, updateType } = useFilters();

  const filtered = useMemo(() => {
    return feed.filter((item) => {
      if (selectedScores.size > 0 && !selectedScores.has(item.signal.score)) return false;
      if (updateType !== "all" && item.signal.updateType !== updateType) return false;
      if (!withinPeriod(item.runAt, period)) return false;
      return true;
    });
  }, [feed, selectedScores, period, updateType]);

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">No signals match the current filters.</p>
      )}
      {filtered.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/account/${item.slug}`} className="font-medium text-slate-900 hover:underline">
                {item.company}
              </Link>
              <span className="text-xs text-slate-500">{item.signal.category}</span>
              {updateTypeLabel(item.signal.updateType) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 bg-slate-50">
                  {updateTypeLabel(item.signal.updateType)}
                </span>
              )}
            </div>
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${scoreClasses(item.signal.score)}`}>
              {scoreLabel(item.signal.score)}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-2">{item.signal.summary}</p>
          <p className="text-xs text-slate-500 mb-2">
            <span className="text-slate-600">Suggested action:</span> {item.signal.suggestedAction}
          </p>
          <div className="flex items-center justify-between mt-2">
            {item.signal.sourceLink ? (
              <a
                href={item.signal.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline"
              >
                {item.signal.sourceName ?? "Source"} ↗
              </a>
            ) : (
              <span />
            )}
            <p className="text-[11px] text-slate-400">{formatDate(item.runAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
