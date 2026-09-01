# Account Signal Rubric

Defines how the agent scores public signals about an account "relative to the vendor
relationship" — i.e. what a piece of news implies for a B2B customer relationship, not
just whether it's good or bad news in the abstract. Written generically so the same
pipeline works for any vendor's strategic-account list — swap in your own product
context by editing the "why it matters" column and the system prompt in
`scripts/analyze.ts`.

## Sentiment scale

| Score | Label | Meaning |
|---|---|---|
| +2 | Strong Opportunity | Clear expansion or upsell trigger — act this week |
| +1 | Mild Opportunity | Worth noting, no urgency |
| 0 | Neutral | Informational only, no account action implied |
| -1 | Mild Risk | Watch, mention in next internal sync |
| -2 | Strong Risk | Renewal/relationship at risk — escalate |

## Update type taxonomy

Alongside the sentiment score, every signal is classified into exactly one fixed
`updateType` — this is what the dashboard's "update type" filter reads. It's a separate
axis from score: type answers "what kind of thing happened," score answers "is that good
or bad for the relationship." Defined once in `lib/filters.ts` (`UPDATE_TYPE_OPTIONS`)
and imported by `scripts/analyze.ts` so the model's tool-schema enum and the dashboard
filter can never drift apart:

`ma`, `earnings`, `leadership`, `restructuring`, `expansion`, `competitive`, `legal`,
`regulatory`, `market`, `brand`

The signal-category table below maps each rubric row to its type in the last column.

## Signal categories

| Category | Trigger examples | Score | Type | Why it matters | Suggested action |
|---|---|---|---|---|---|
| **Funding raised / revenue growth** | New round announced, "record quarter," beat guidance | +1 | `earnings`/`expansion` | Budget headroom likely | Note for next QBR talking point |
| **New business line, market, or channel** | New product category, new geography, new sales channel | +1 | `expansion` | New surface area the vendor's product could cover | Flag to AE for expansion conversation |
| **M&A — acquiring another company** | Company announces acquisition | +1 | `ma` | Possible new business unit to expand the relationship into | Flag to AE for multi-BU expansion |
| **M&A — being acquired** | Company is an acquisition target | -1 | `ma` | Contract/renewal terms may be renegotiated under new ownership | Flag to legal/AE, prep continuity conversation |
| **New buyer-side leadership** | New VP/Director in the function that owns this relationship | -1 / +1 (mixed) | `leadership` | New buyer = relationship risk (unproven stakeholder) AND re-pitch opportunity | Prioritize intro call within 2 weeks |
| **Leadership departure (named champion)** | Named internal champion leaves the company | -2 | `leadership` | Direct relationship risk — loses internal advocate | Immediate stakeholder-map update, find new champion |
| **Layoffs in the buying function specifically** | Headcount cuts in the team that owns this relationship | -1 / +1 (mixed) | `restructuring` | Budget risk, but also a "do more with less" case for the vendor's product | Reframe as ROI conversation, not retention panic |
| **Broad, company-wide layoffs** | General workforce reduction | -1 | `restructuring` | Budget pressure across the board | Prep renewal defense, lead with ROI proof |
| **Revenue decline / guidance cut** | Missed earnings, lowered forecast (public companies only) | -2 | `earnings` | Renewal and expansion both at risk | Escalate internally, prep value-defense narrative |
| **Large stock move (>8% in a day)** | Market reaction to news (public companies only) | 0 | `market` | Context for the underlying cause, not conclusive on its own | Pair with the underlying cause before acting |
| **Competitor activity in the account's own market** | A rival's product launch or market-share move | 0 | `competitive` | Context on the account's business, not directly about this vendor relationship | Note for account context |
| **Competing vendor mentioned** | Press or job posting referencing a competing product in this category | -1 | `competitive` | Direct competitive threat to this relationship | Prep win-back/differentiation talking points |
| **Positive press / award / customer growth** | "Fastest growing," industry award, etc. | +1 | `brand` | Relationship-building talking point, low urgency | Reference in next check-in as rapport-builder |
| **Negative press / lawsuit / PR crisis** | Public controversy unrelated to this vendor | 0 | `legal` (lawsuit) or `brand` (general PR) | Context only — affects tone of outreach, not a direct signal | Note for account sensitivity, no direct action |
| **Regulatory / compliance news** | New law or rule affecting the account's industry | 0 | `regulatory` | Context — may surface as a future conversation | Log for awareness |

## Notes for editing

- "Mixed" categories intentionally cut both ways — the agent should surface both readings
  rather than force a single score, since the right interpretation depends on account
  context you have and the model doesn't.
- Scores are directional prompts for the model, not a strict formula — the write-up per
  account should explain *why*, not just output a number.
- This file is documentation, not executable — the actual prompt lives in
  `scripts/analyze.ts`'s `SYSTEM_PROMPT`. Keep them in sync manually when you edit either
  one.
- This rubric is intentionally vendor-agnostic. A real deployment for a specific company
  would sharpen the "why it matters" column around that company's actual product — e.g.
  corporate turbulence reads very differently for a vendor whose usage tracks the
  account's own revenue versus one selling research/diligence tooling that customers
  lean on *more* during turbulence.
