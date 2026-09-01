export interface GdeltArticle {
  title: string;
  url: string;
  seendate: string;
  domain: string;
}

function formatGdeltDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GDELT DOC 2.0 API — free, keyless, supports historical date-range search.
// Unlike Google News RSS, results carry no article body/snippet — title,
// domain, and date only.
export async function fetchGdeltArticles(
  query: string,
  start: Date,
  end: Date,
  maxrecords = 100,
): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    maxrecords: String(maxrecords),
    format: "json",
    startdatetime: formatGdeltDate(start),
    enddatetime: formatGdeltDate(end),
    sort: "DateDesc",
  });
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  // GDELT's stated "1 request per 5s" limit is looser than actual behavior —
  // bursts of requests (even spaced 6s apart) draw sustained 429s. Retry with
  // real backoff rather than treating a single miss as "no coverage".
  const maxAttempts = 4;
  let res: Response | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(url, { headers: { "User-Agent": "account-intelligence-dashboard/0.1" } });
    if (res.status !== 429) break;
    if (attempt === maxAttempts) break;
    const backoffMs = 10000 * attempt;
    await sleep(backoffMs);
  }

  if (!res || !res.ok) throw new Error(`GDELT fetch failed (${res?.status}) for query "${query}"`);

  const text = await res.text();
  let data: { articles?: unknown[] };
  try {
    data = JSON.parse(text);
  } catch {
    // GDELT returns an HTML error page (not JSON) on malformed queries or
    // transient outages rather than a clean error status.
    throw new Error(`GDELT returned non-JSON for query "${query}": ${text.slice(0, 200)}`);
  }

  return (data.articles ?? []).map((a) => {
    const article = a as Record<string, string>;
    return {
      title: article.title ?? "",
      url: article.url ?? "",
      seendate: article.seendate ?? "",
      domain: article.domain ?? "",
    };
  });
}
