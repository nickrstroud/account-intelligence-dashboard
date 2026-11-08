# Account Intelligence Dashboard

An always-on Claude agent that watches a set of strategic customer accounts (here: large
public CPG and retail companies) plus the market around them, ranks which account needs a
conversation first, and turns each meaningful signal into a ready-to-run workflow. Built as
an independent portfolio project. It runs daily on a schedule with no database.

Live: https://account-intelligence-dashboard-two.vercel.app

## What it does

- **Account lane.** Fetches news per account (Google News RSS), sends only new articles to
  Claude Haiku, and gets back scored signals: score (-2 risk to +2 opportunity), update type,
  a play, and one concrete suggested action.
- **Industry lane.** A second pass reads consumer-goods/retail trade feeds, Federal Register
  rules (FDA, USDA, FTC, trade), and topic searches, keeps what a CSM could act on, and tags
  which products each item touches ("affects what they own" vs "upsell angle").
- **Ranking.** Signals are weighted by strength, last 90 days only, 30-day half-life; risk
  weighs slightly more than upside. ARR bands and a 90-day renewal window multiply the score.
- **Learns from the user.** 👍 / 👎 on every signal reweights that update type live and
  re-ranks the accounts.
- **Workflows.** Each non-neutral signal gets a pre-generated play: five stages (Validate,
  Align, Engage Customer, Act, Close Loop) with timing and tasks, a "done when", and drafts
  of the customer email, Slack note, and CRM task. Trigger one, tick stages off, and track
  everything in My workflows or the Workflow status filter (progress is stored in the browser).
- **Ask the agent.** Plain-English Q&A over the dashboard's own data, with a daily question cap.
- **Filters.** Sentiment, product, workflow status, update type, time period, and account.

## Architecture

1. `scripts/run.ts`: daily pipeline (accounts, industry lane, workflows). Fails loudly if the
   API key is missing or rejected instead of silently skipping accounts. `--days=N` widens the
   news window for a catch-up run.
2. Results are written to `data/` as JSON and committed by a scheduled GitHub Action
   (`.github/workflows/daily-run.yml`, 9am ET). The git history is the audit trail.
3. A static Next.js app reads that JSON at build time; every commit redeploys on Vercel.
   The only server route is `app/api/ask/route.ts`.

All vendor-specific framing (product lineup, scoring rubric, industry scope and sources,
disclaimer) lives in [`lib/vendor.ts`](./lib/vendor.ts). The account list is
`data/companies.json`. Point the same pipeline at a different vendor or customer list by
editing those two files.

The vendor, products, ARR, and renewal dates here are illustrative placeholders, not real
customer data. Every signal comes from public news, linked to its source.

## Setup

```bash
bun install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
bun run run                        # one local run, writes to data/
bun run dev                        # preview the dashboard
```

Environment:

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | GitHub Actions secret | Daily pipeline |
| `ANTHROPIC_API_KEY` | Vercel env (Production) | "Ask the agent". Use a separate key |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel env (Upstash Redis) | Daily question cap (falls back to in-memory) |

Use one dedicated Anthropic key per purpose, turn on auto-reload in billing, and set a
monthly spend limit as a backstop. API keys don't expire, but they stop working if revoked
or if credit runs out.

Trigger a manual or catch-up run from the Actions tab (`workflow_dispatch`, with a `days`
input), or locally with `bun run run -- --days=21`.

## Cost

Claude Haiku at roughly a cent or two per account per run. Eight accounts plus the industry
lane and workflows is a few dollars a month. News, Federal Register, and RSS are free.
