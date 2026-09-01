import Link from "next/link";
import { getRecentFeed, getAccountSummaries } from "@/lib/data";
import { scoreClasses, scoreLabel, formatDate } from "@/lib/score";
import RecentActivity from "./RecentActivity";
import CompanyLogo from "./CompanyLogo";

export default function Home() {
  const feed = getRecentFeed();
  const accounts = getAccountSummaries().sort((a, b) => a.company.name.localeCompare(b.company.name));

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Accounts</h1>
        <p className="text-sm text-slate-500 mb-4">
          {accounts.length} strategic accounts monitored · updated daily
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((a) => (
            <Link
              key={a.slug}
              href={`/account/${a.slug}`}
              className="block border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <CompanyLogo website={a.company.website} />
                  <span className="font-medium text-slate-900">{a.company.name}</span>
                </div>
                {a.worstScore !== null && a.worstScore <= -1 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${scoreClasses(a.worstScore)}`}>
                    {scoreLabel(a.worstScore)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {a.latestHeadline ?? "No signals recorded yet"}
              </p>
              {a.lastRunAt && (
                <p className="text-[11px] text-slate-400 mt-2">Last updated {formatDate(a.lastRunAt)}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent activity</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-slate-500">No signals recorded yet — check back after the next run.</p>
        ) : (
          <RecentActivity feed={feed} />
        )}
      </section>
    </div>
  );
}
