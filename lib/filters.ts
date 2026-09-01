export const SENTIMENT_OPTIONS = [
  { score: 2 as const, label: "Strong Opportunity" },
  { score: 1 as const, label: "Opportunity" },
  { score: 0 as const, label: "Neutral" },
  { score: -1 as const, label: "Risk" },
  { score: -2 as const, label: "Strong Risk" },
];

// Single source of truth for the update-type taxonomy — imported by both
// scripts/analyze.ts (constrains the model's classification via the tool
// schema enum) and the dashboard filter UI, so the two can't drift apart.
export const UPDATE_TYPE_OPTIONS = [
  { value: "ma", label: "M&A" },
  { value: "earnings", label: "Earnings Performance" },
  { value: "leadership", label: "Leadership Change" },
  { value: "restructuring", label: "Restructuring" },
  { value: "expansion", label: "Business Expansion" },
  { value: "competitive", label: "Competitive Pressure" },
  { value: "legal", label: "Legal" },
  { value: "regulatory", label: "Regulatory Risk" },
  { value: "market", label: "Market Signal" },
  { value: "brand", label: "Brand & Press" },
];

export function updateTypeLabel(value: string | undefined): string | null {
  if (!value) return null;
  return UPDATE_TYPE_OPTIONS.find((t) => t.value === value)?.label ?? null;
}

export const PERIOD_OPTIONS = [
  { value: "all", label: "All time", days: null as number | null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 3 months", days: 90 },
  { value: "180d", label: "Last 6 months", days: 180 },
];

export function withinPeriod(dateIso: string, periodValue: string): boolean {
  const period = PERIOD_OPTIONS.find((p) => p.value === periodValue);
  if (!period || period.days === null) return true;
  const cutoffMs = Date.now() - period.days * 24 * 60 * 60 * 1000;
  return new Date(dateIso).getTime() >= cutoffMs;
}
