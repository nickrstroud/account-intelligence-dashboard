import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchGdeltArticles } from "./gdelt.ts";
import { analyzeCompany, type CompanyAnalysis } from "./analyze.ts";
import type { NewsItem } from "./fetch-news.ts";

interface Company {
  name: string;
  website: string;
  ticker: string | null;
  isPublic: boolean;
  newsQuery: string;
}

const DATA_DIR = path.resolve(import.meta.dirname, "../data");
const REPORTS_DIR = path.join(DATA_DIR, "reports");
const MONTHS_BACK = 6;
const GDELT_DELAY_MS = 8000; // baseline spacing; fetchGdeltArticles also retries with backoff on 429

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Some brand names collide with common words/other entities (e.g. "Coterie"
// the diaper brand vs. "Coterie Noir" photographers). Mirrors the same
// disambiguation already used in companies.json's newsQuery for the daily
// Google News pipeline.
const DISAMBIGUATORS: Record<string, string> = {
  Coterie: "(diapers OR baby)",
  Comfrt: "(blankets OR loungewear)",
};

function gdeltQuery(name: string): string {
  // repeat2 requires the term to appear 2+ times in an article — filters out
  // passing mentions (e.g. stock-roundup articles that name-drop the brand
  // once) in favor of articles substantially about the company. GDELT only
  // accepts a single word in a REPEAT block, so multi-word names (which are
  // already fairly precise as an exact phrase) skip it.
  const base = /[\s-]/.test(name.trim()) ? `"${name}"` : `"${name}" repeat2:"${name}"`;
  const disambiguator = DISAMBIGUATORS[name];
  return disambiguator ? `${base} ${disambiguator}` : base;
}

function monthWindows(months: number): { start: Date; end: Date; label: string }[] {
  const now = new Date();
  const windows: { start: Date; end: Date; label: string }[] = [];
  for (let i = months; i >= 1; i--) {
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() - (i - 1) * 30);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 30);
    windows.push({ start, end, label: start.toISOString().slice(0, 7) });
  }
  return windows;
}

async function loadHistory(slug: string): Promise<CompanyAnalysis[]> {
  try {
    const raw = await readFile(path.join(REPORTS_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await mkdir(REPORTS_DIR, { recursive: true });
  const companies: Company[] = JSON.parse(await readFile(path.join(DATA_DIR, "companies.json"), "utf-8"));
  const windows = monthWindows(MONTHS_BACK);

  for (const company of companies) {
    const slug = slugify(company.name);
    const existing = await loadHistory(slug);

    if (existing.some((r) => r.source === "backfill")) {
      console.log(`Skipping ${company.name} — backfill already present`);
      continue;
    }

    console.log(`Backfilling ${company.name} (${windows.length} months)...`);
    const backfillEntries: CompanyAnalysis[] = [];

    for (const w of windows) {
      await sleep(GDELT_DELAY_MS);
      let articles;
      try {
        articles = await fetchGdeltArticles(gdeltQuery(company.name), w.start, w.end, 75);
      } catch (err) {
        console.error(`  ${w.label}: GDELT fetch failed — ${err instanceof Error ? err.message : err}`);
        continue;
      }

      if (articles.length === 0) {
        console.log(`  ${w.label}: no coverage`);
        continue;
      }

      const newsItems: NewsItem[] = articles.map((a) => ({
        title: a.title,
        source: a.domain,
        link: a.url,
        publishedAt: a.seendate,
        snippet: "",
      }));

      const analysis = await analyzeCompany(company.name, newsItems, {
        runAt: w.end.toISOString(),
        source: "backfill",
        periodLabel: w.label,
      });
      console.log(`  ${w.label}: ${articles.length} article(s), ${analysis.signals.length} signal(s)`);
      backfillEntries.push(analysis);
    }

    if (backfillEntries.length === 0) {
      console.log(`  no historical coverage found for ${company.name}`);
      continue;
    }

    const merged = [...backfillEntries, ...existing].sort(
      (a, b) => new Date(a.runAt).getTime() - new Date(b.runAt).getTime(),
    );
    await writeFile(path.join(REPORTS_DIR, `${slug}.json`), JSON.stringify(merged, null, 2));
    console.log(`  saved ${backfillEntries.length} historical month(s) for ${company.name}`);
  }
}

main();
