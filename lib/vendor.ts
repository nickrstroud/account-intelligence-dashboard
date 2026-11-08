// Everything specific to the (illustrative) vendor this dashboard is framed around:
// name, product lineup, how the CS team works, how the agent scores news, and where
// industry news comes from. Prompts, plays, filters, and page copy read from it.
// Swap this file (and data/companies.json) to point the same pipeline at another
// vendor and account list.

export interface Product {
  value: string; // stable id used in companies.json `products`
  label: string;
  description: string; // what it is, for the model
  core?: boolean; // the platform nearly every account owns: too broad to link an account to routine industry news
}

export const VENDOR = {
  name: "Account Intelligence",
  website: "",
  appName: "Account Intelligence Dashboard",
  teamLabel: "Strategic Accounts", // header badge
  role: "strategic accounts team", // footer: "built for a <role> workflow"
  summary: `a B2B data and analytics software vendor selling an enterprise platform, analytics,
workflow automation, and data integrations to large consumer-goods and retail companies`,
  csMotion: `The strategic accounts team owns retention and expansion across a book of large
enterprise customers (CPG manufacturers, grocers, and big-box retailers). Revenue scales with
the teams, business units, and data volume a customer runs on the platform. The job: know what
is happening at each key account before they bring it up, protect renewals, grow coverage to
new business units and products, and bring structured customer insight back to Product.`,
};

// A generic four-product lineup (illustrative, not a real company's catalog).
export const PRODUCTS: Product[] = [
  {
    value: "platform",
    label: "Core Platform",
    core: true,
    description:
      "core platform: the shared workspace, data model, and reporting layer nearly every customer owns; scales with teams and business units covered",
  },
  {
    value: "analytics",
    label: "Analytics Suite",
    description:
      "advanced analytics and forecasting: demand, pricing, and market-share analysis for category, finance, and strategy teams",
  },
  {
    value: "automation",
    label: "Workflow Automation",
    description:
      "workflow automation: alerting, approvals, and playbooks that route insights to the right team (supply chain, merchandising, marketing)",
  },
  {
    value: "integrations",
    label: "Data Integrations",
    description:
      "data integrations and APIs: connectors to ERP, retail POS, e-commerce, and third-party data providers for new business units and acquisitions",
  },
];

// Whether an industry signal is about something this account owns. The core
// platform only counts for act-this-week items, other products from relevance 2.
export function industryTouchesOwned(owned: string[] | undefined, signal: { products: string[]; relevance: number }): boolean {
  return signal.products.some((v) => {
    if (!owned?.includes(v)) return false;
    const core = PRODUCTS.find((p) => p.value === v)?.core;
    return core ? signal.relevance >= 3 : signal.relevance >= 2;
  });
}

// The mirror image: an industry signal on a product the account doesn't own yet.
export function industryTouchesWhitespace(owned: string[] | undefined, signal: { products: string[]; relevance: number }): boolean {
  return signal.products.some((v) => {
    if (owned?.includes(v)) return false;
    const core = PRODUCTS.find((p) => p.value === v)?.core;
    return core ? signal.relevance >= 3 : signal.relevance >= 2;
  });
}

export function productLabel(value: string): string {
  return PRODUCTS.find((p) => p.value === value)?.label ?? value;
}

// How the account agent scores one customer's news. Each line: event -> score (play).
export const ACCOUNT_RUBRIC = `- Acquires a company or brand, or launches a new business unit, channel, or market -> +2
  (onboard the new unit; Data Integrations and Core Platform expansion)
- New product lines, new stores/distribution centers, or capacity expansion -> +1/+2
  (Core Platform coverage and Workflow Automation)
- Strong earnings, raised guidance, or record sales -> +1 (budget to expand; Analytics Suite)
- Supply-chain disruption, recall, or plant/DC outage at the account -> +1 (Workflow Automation
  alerting; keep the tone helpful, not opportunistic)
- Price war, share loss, or margin pressure in their category -> +1 (Analytics Suite for
  pricing and demand), or -1 if it is driving cost cuts
- Funding, refinancing, or large capital-expenditure announcements -> +1 (budget to expand)
- Digital, AI, or data-platform initiatives announced -> +1/+2 (Analytics Suite, Data Integrations)
- New CEO/CFO/COO/Chief Strategy or data leader -> 0 or +1 (re-introduction; new leaders review vendors)
- Named champion leaving -> -1
- Divesting a brand or business unit, or being acquired -> -2 (seats and data leaving the
  platform; consolidation risk)
- Layoffs, store closures, restructuring, missed guidance, bankruptcy -> -1/-2
- A competing analytics/data vendor named as a new supplier -> -1/-2
- Awards, rankings, positive press -> 0/+1 (advocacy / case-study ask)
- Materiality: judge size relative to the account. One small store opening at a 500-store
  grocer is routine (0 or +1); for a regional chain with 40 stores it is material.`;

export const EXAMPLE_ACTION = `"Ask their VP of Strategy whether the brand they just
acquired will be onboarded to the platform this quarter, and offer an integration plan for
the new unit's data"`;

// Industry lane: what to keep.
export const INDUSTRY_SCOPE = `Scope: consumer-packaged-goods and retail industry news that affects
large CPG manufacturers, grocers, and big-box retailers (pricing and inflation, tariffs and
trade, commodity and supply-chain shocks, retail M&A and consolidation, labor and wage
changes, consumer demand shifts, regulation of food/labels/advertising, e-commerce and retail
media, store and distribution-network changes, and data/AI adoption). Keep such items even
when they do not map to a specific vendor product: they are talking points for a customer
conversation. Drop generic business news with no meaningful effect on this sector, and
anything promotional or opinion-only.

Strongest reasons to keep an item:
- Retail and CPG M&A, divestitures, and portfolio reshaping
- Tariffs, trade rules, and commodity or inflation shocks changing cost of goods
- Supply-chain disruptions, recalls, strikes, or distribution-network changes
- Price wars, private-label growth, and share shifts among grocers and big-box retailers
- FDA/FTC/USDA rules on labeling, advertising, ingredients, or food safety
- Retail media, e-commerce, loyalty, and AI/data-platform adoption at large retailers
- Consumer demand, SNAP/benefit changes, and earnings-season read-throughs`;

// Industry lane sources. RSS feeds are fetched directly; topic queries go to
// Google News; the Federal Register pulls formal rules from the listed agencies.
export const INDUSTRY_SOURCES = {
  rss: [
    { name: "Grocery Dive", url: "https://www.grocerydive.com/feeds/news/" },
    { name: "Retail Dive", url: "https://www.retaildive.com/feeds/news/" },
    { name: "Supply Chain Dive", url: "https://www.supplychaindive.com/feeds/news/" },
    { name: "Food Dive", url: "https://www.fooddive.com/feeds/news/" },
    { name: "Beverage Industry", url: "https://www.bevindustry.com/rss/topic/3052-news" },
  ],
  topicQueries: [
    "grocery (price war OR \"private label\") retailers",
    "retail (acquisition OR merger OR divestiture) consumer brands",
    "tariffs retailers consumer goods costs",
    "supply chain disruption retail OR grocery OR beverage",
    "food recall (FDA OR USDA) major brand",
    "retail media network advertising",
    "SNAP benefits grocery retailers",
    "CPG (inflation OR \"commodity costs\" OR \"volume decline\")",
    "retail AI data analytics investment",
    "union strike OR labor contract grocery OR warehouse",
  ],
  topicsBlurb: "retail and CPG M&A, tariffs, supply chain, price wars, recalls, retail media, SNAP, and labor",
  federalRegister: {
    term: '"food labeling" | "nutrition" | tariff | "unfair or deceptive" | "food safety" | "retail food" | "supplemental nutrition"',
    agencies: [
      "food-and-drug-administration",
      "agriculture-department",
      "federal-trade-commission",
      "international-trade-administration",
      "commerce-department",
    ],
  },
  description:
    "Consumer-goods and retail news that affects large CPG and retail accounts: M&A, tariffs, supply chain, price wars, recalls, retail media, SNAP and labeling rules, and labor.",
};

// The disclaimer, split in two so the header can show it as a compact two-line note.
export const DISCLAIMER = [
  `Independent portfolio project built by Nick Stroud. Account list: large public CPG and retail companies.`,
  `Public sources only; not affiliated with any company shown. Updates daily via a scheduled Claude agent.`,
] as const;

export const FOOTER = DISCLAIMER.join(" ");
