import { readFile, mkdir, readFile as readFileOrEmpty, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchNews } from "./fetch-news.ts";
import { analyzeCompany, type CompanyAnalysis } from "./analyze.ts";

interface Company {
  name: string;
  website: string;
  ticker: string | null;
  isPublic: boolean;
  newsQuery: string;
}

const DATA_DIR = path.resolve(import.meta.dirname, "../data");
const REPORTS_DIR = path.join(DATA_DIR, "reports");

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function loadHistory(slug: string): Promise<CompanyAnalysis[]> {
  try {
    const raw = await readFileOrEmpty(path.join(REPORTS_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function main() {
  await mkdir(REPORTS_DIR, { recursive: true });

  const companiesPath = path.join(DATA_DIR, "companies.json");
  const companies: Company[] = JSON.parse(await readFile(companiesPath, "utf-8"));

  for (const company of companies) {
    console.log(`Analyzing ${company.name}...`);
    try {
      const news = await fetchNews(company.newsQuery);
      const analysis = await analyzeCompany(company.name, news);
      const slug = slugify(company.name);
      const history = await loadHistory(slug);
      history.push(analysis);
      await writeFile(path.join(REPORTS_DIR, `${slug}.json`), JSON.stringify(history, null, 2));
      console.log(`  -> ${analysis.signals.length} signal(s) recorded`);
    } catch (err) {
      console.error(`  failed for ${company.name}:`, err);
    }
  }
}

main();
