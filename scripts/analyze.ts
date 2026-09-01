import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem } from "./fetch-news.ts";
import { UPDATE_TYPE_OPTIONS } from "../lib/filters.ts";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export interface AccountSignal {
  category: string;
  updateType: string;
  score: -2 | -1 | 0 | 1 | 2;
  summary: string;
  suggestedAction: string;
  sourceName: string;
  sourceLink: string;
}

export interface CompanyAnalysis {
  company: string;
  runAt: string;
  signals: AccountSignal[];
  headline: string;
  source?: "daily" | "backfill";
}

const SYSTEM_PROMPT = `You are an account-intelligence analyst monitoring a strategic
customer account list on behalf of a B2B vendor's account team. Given recent public news
about one of the accounts, extract signals relevant to the *account relationship* — not
general news summarization.

Score each distinct signal from -2 (strong renewal/relationship risk) to +2 (strong
expansion opportunity), per this rubric:

- Funding raised, revenue growth, new business line/channel -> positive (budget/expansion)
- Leadership departure (named champion) -> strong risk
- New buyer-side leadership hire -> mixed (relationship risk + re-pitch opportunity)
- Layoffs in the buying function specifically -> mixed (budget risk + "do more with less" case)
- Broad layoffs, revenue decline, being acquired -> risk
- Acquiring another company -> opportunity (new business unit to expand into)
- Competing vendor mentioned -> risk (competitive threat)
- Positive press/award -> mild opportunity (rapport talking point)
- Unrelated negative press (lawsuit, PR crisis) -> neutral, context only

If nothing in the provided articles is relevant to the account relationship, return an
empty signals array rather than forcing a score.

In addition to the score, classify each signal into exactly one updateType from this
fixed list — pick the closest fit, don't invent new categories:
${UPDATE_TYPE_OPTIONS.map((t) => `- "${t.value}" (${t.label})`).join("\n")}

Rough mapping: acquiring/being acquired -> ma. Earnings/revenue growth or decline,
guidance changes -> earnings. Leadership hires/departures -> leadership. Layoffs (buying-
function-specific or broad) -> restructuring. Funding raised/new business line/channel
launch -> expansion. Competitor mention -> competitive. Lawsuits -> legal. Regulatory/
compliance news affecting the account's industry -> regulatory. Stock price moves ->
market. Positive press/award/unrelated PR crisis -> brand.`;

const RECORD_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "record_analysis",
  description: "Record the account-relationship analysis for this company's recent news.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "One-line summary of this run's overall picture" },
      signals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            updateType: {
              type: "string",
              enum: UPDATE_TYPE_OPTIONS.map((t) => t.value),
              description: "Fixed taxonomy classification — see system prompt for the mapping",
            },
            score: { type: "integer", enum: [-2, -1, 0, 1, 2] },
            summary: { type: "string" },
            suggestedAction: { type: "string" },
            sourceName: {
              type: "string",
              description: "The publication/outlet name this signal's evidence came from, exactly as given in the article list (e.g. 'NBC News', 'nbcnews.com')",
            },
            sourceLink: { type: "string" },
          },
          required: ["category", "updateType", "score", "summary", "suggestedAction", "sourceName", "sourceLink"],
        },
      },
    },
    required: ["headline", "signals"],
  },
};

export interface AnalyzeOptions {
  runAt?: string;
  source?: "daily" | "backfill";
  periodLabel?: string;
}

export async function analyzeCompany(
  company: string,
  news: NewsItem[],
  opts: AnalyzeOptions = {},
): Promise<CompanyAnalysis> {
  const articleBlock = news
    .map((n, i) => `[${i}] ${n.title} (${n.source}, ${n.publishedAt})\n${n.snippet}\nLink: ${n.link}`)
    .join("\n\n");

  const period = opts.periodLabel ?? "Recent";

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [RECORD_ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "record_analysis" },
    messages: [
      {
        role: "user",
        content: `Account: ${company}\n\n${period} articles:\n\n${articleBlock || "(no articles found this period)"}`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`no tool_use block in response for ${company} (stop_reason=${message.stop_reason})`);
  }
  const parsed = toolUse.input as { headline?: string; signals?: AccountSignal[] };

  return {
    company,
    runAt: opts.runAt ?? new Date().toISOString(),
    source: opts.source ?? "daily",
    headline: parsed.headline ?? "",
    signals: parsed.signals ?? [],
  };
}
