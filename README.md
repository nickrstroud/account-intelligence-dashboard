# Account Intelligence Dashboard

A live agent that monitors public signals (news, SEC filings-ready schema, and stock
data as an optional v2) on a set of strategic customer accounts, scores each signal
against an account-relationship rubric using Claude, and publishes a running, queryable
dashboard per account — an "always-on account prep" tool.

Built as a portfolio project demonstrating an actual scheduled, multi-step agent
(fetch → analyze → persist → publish), not a one-off script. The account list here
(Coca-Cola, PepsiCo, Walmart, Costco, Target, Kroger, P&G, Keurig Dr Pepper) is a
generic, publicly-known set of large consumer/retail brands used purely to demonstrate
the pipeline — this isn't tied to any specific vendor relationship.

## How it works

1. **Fetch** — `scripts/fetch-news.ts` pulls recent articles per account via Google News
   RSS (free, no key required).
2. **Analyze** — `scripts/analyze.ts` sends the articles to Claude Haiku 4.5 with the
   rubric in [`RUBRIC.md`](./RUBRIC.md), scoring each signal from -2 (relationship risk)
   to +2 (expansion opportunity) with a suggested action.
3. **Persist** — `scripts/run.ts` appends each run's results to
   `data/reports/<account-slug>.json`, so history accumulates rather than overwrites.
4. **Backfill** — `scripts/backfill.ts` seeds historical context via GDELT (free,
   keyless, date-range news search), for depth beyond what daily runs alone would build up.
5. **Schedule** — `.github/workflows/daily-run.yml` runs the pipeline daily via GitHub
   Actions and commits the updated reports back to the repo. This doubles as the "living
   document" — the git history of `data/reports/` *is* the audit trail of how each
   account's signal picture changed over time. No database needed.
6. **Dashboard** — a Next.js app (`app/`) reads the committed JSON directly at build
   time — fully static, no API layer. Deployed on Vercel, connected to this repo, so
   every daily commit triggers an automatic redeploy. Includes:
   - Home feed of recent activity + an account grid, both alphabetized
   - Per-account timeline, tagged "historical" vs. live daily entries
   - Sentiment (toggle-chip) and time-period filters, shared globally via
     `app/FilterContext.tsx` so they persist across navigation
   - Named, direct source links where the underlying link resolves to one (GDELT
     articles always do; Google News links fall back to a generic label — Google's
     redirect only resolves client-side via JS, confirmed by testing, not assumed)
   - Company logos via favicon lookup, keyed off each account's website

## Why GitHub Actions instead of Vercel Cron

Vercel serverless functions have an ephemeral filesystem in production, so a
Vercel-Cron-triggered function can't durably persist the growing JSON history without
adding a database. A scheduled GitHub Action that commits results back to the repo gets
persistence for free and produces a literal, inspectable history of every run — better
for a portfolio demo than a black-box database anyway.

## Setup

```bash
bun install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
cp data/companies.example.json data/companies.json  # fill in your own account list
bun run run       # one local daily run, writes to data/reports/
bun run backfill  # optional: seed historical context via GDELT
bun run dev        # preview the dashboard locally
```

To go live: create a GitHub repo, push, add `ANTHROPIC_API_KEY` as a repo secret
(Settings → Secrets and variables → Actions), connect the repo to a Vercel project
(Project Settings → Git → Connect Git Repository) so pushes auto-deploy, and the daily
workflow takes over from there. Trigger it manually anytime from the Actions tab
(`workflow_dispatch`) for a live demo.

## Company schema

```json
{
  "name": "Example Corp",
  "website": "https://example.com/",
  "ticker": "EXPL",
  "isPublic": true,
  "newsQuery": "\"Example Corp\"",
  "renewalDate": "2027-01-01",
  "contractValue": 250000
}
```

`ticker` / `isPublic` are carried through the schema for a future SEC-filings/stock-move
enrichment step (see Status below); the pipeline as shipped is news-only regardless of
these values. `renewalDate` and `contractValue` are illustrative demo fields, not real
account data — swap in your own or drop them if you don't need that view.

## Cost

Claude Haiku 4.5 at current pricing ($1/$5 per MTok in/out): roughly $0.007–0.01 per
account per run. At 8 accounts, daily, that's under $2/month. News fetching is free.
See [Claude Platform Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
for current rates.

## Status

- [x] Vendor-agnostic rubric drafted (`RUBRIC.md`)
- [x] Pipeline built (fetch/analyze/run/backfill scripts, daily workflow)
- [x] Dashboard (home feed, account pages, filters, logos, named sources)
- [x] Demo account list (`data/companies.json`) — 8 public consumer/retail brands
- [ ] SEC 8-K filings + stock-move enrichment for publicly traded accounts (optional v2)
- [ ] Query interface over accumulated history (natural-language Q&A against the JSON)
