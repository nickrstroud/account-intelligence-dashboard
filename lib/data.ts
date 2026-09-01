import { readFileSync } from "node:fs";
import path from "node:path";
import { slugify } from "./slug";

export { slugify };

export interface Company {
  name: string;
  website: string;
  ticker: string | null;
  isPublic: boolean;
  newsQuery: string;
  // Example/demo fields, not real account data.
  renewalDate?: string; // "YYYY-MM-DD"
  contractValue?: number; // USD
}

export interface AccountSignal {
  category: string;
  updateType?: string;
  score: -2 | -1 | 0 | 1 | 2;
  summary: string;
  suggestedAction: string;
  sourceName?: string;
  sourceLink: string;
}

export interface CompanyAnalysis {
  company: string;
  runAt: string;
  headline: string;
  signals: AccountSignal[];
  source?: "daily" | "backfill";
}

export interface FeedItem {
  company: string;
  slug: string;
  runAt: string;
  signal: AccountSignal;
}

const DATA_DIR = path.join(process.cwd(), "data");

export function getCompanies(): Company[] {
  const raw = readFileSync(path.join(DATA_DIR, "companies.json"), "utf-8");
  return JSON.parse(raw);
}

export function getCompanyBySlug(slug: string): Company | undefined {
  return getCompanies().find((c) => slugify(c.name) === slug);
}

export function getCompanyHistory(slug: string): CompanyAnalysis[] {
  try {
    const raw = readFileSync(path.join(DATA_DIR, "reports", `${slug}.json`), "utf-8");
    const history: CompanyAnalysis[] = JSON.parse(raw);
    return [...history].sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime());
  } catch {
    return [];
  }
}

export function getRecentFeed(limit = 500): FeedItem[] {
  const items: FeedItem[] = [];
  for (const company of getCompanies()) {
    const slug = slugify(company.name);
    for (const run of getCompanyHistory(slug)) {
      for (const signal of run.signals) {
        items.push({ company: company.name, slug, runAt: run.runAt, signal });
      }
    }
  }
  items.sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime());
  return items.slice(0, limit);
}

export function getAccountSummaries() {
  return getCompanies().map((company) => {
    const slug = slugify(company.name);
    const history = getCompanyHistory(slug);
    const latestRun = history[0];
    const allSignals = history.flatMap((r) => r.signals);
    const worstScore = allSignals.length ? Math.min(...allSignals.map((s) => s.score)) : null;
    const bestScore = allSignals.length ? Math.max(...allSignals.map((s) => s.score)) : null;
    return {
      company,
      slug,
      lastRunAt: latestRun?.runAt ?? null,
      latestHeadline: latestRun?.headline ?? null,
      signalCount: allSignals.length,
      worstScore,
      bestScore,
    };
  });
}
