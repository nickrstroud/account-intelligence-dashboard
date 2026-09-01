import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  publishedAt: string;
  snippet: string;
}

const parser = new XMLParser({ ignoreAttributes: false });

// Google News RSS — free, keyless. Good enough coverage for company-name
// searches; swap in a paid news API here if recall becomes a problem.
export async function fetchNews(query: string, maxItems = 8): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "User-Agent": "account-intelligence-dashboard/0.1" } });
  if (!res.ok) throw new Error(`news fetch failed for "${query}": ${res.status}`);

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, maxItems).map((item: any) => ({
    title: String(item.title ?? ""),
    source: String(item.source?.["#text"] ?? item.source ?? "unknown"),
    link: String(item.link ?? ""),
    publishedAt: String(item.pubDate ?? ""),
    snippet: String(item.description ?? "").replace(/<[^>]+>/g, "").trim(),
  }));
}
