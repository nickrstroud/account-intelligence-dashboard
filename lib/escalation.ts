import type { Company, Workflow } from "./types";

// The CSM / account manager leads each play; the CS Director is looped in by rule,
// not by the model, so it is consistent across every workflow.
export const LEAD_ROLE = "CSM/Acct Mgr.";
export const DIRECTOR_ROLE = "CS Director";

// "Top-revenue" accounts: ARR at or above this (illustrative demo ARR, USD).
export const TOP_ACCOUNT_ARR = 450_000;

export function isTopAccount(company: Company | undefined): boolean {
  return (company?.arr ?? 0) >= TOP_ACCOUNT_ARR;
}

export function isAtRiskSignal(score: number, play: string): boolean {
  return score < 0 || play === "protect_renewal";
}

const ESCALATION_PREFIXES = [`Alert the ${DIRECTOR_ROLE}:`, `Update the ${DIRECTOR_ROLE}:`, `Include the ${DIRECTOR_ROLE}:`];

// Only the model's own text says "CS Director" as the lead; the escalation bullets keep it.
function renameLead(text: string): string {
  return ESCALATION_PREFIXES.some((p) => text.startsWith(p)) ? text : text.replace(/CS Director/g, LEAD_ROLE);
}

function dedupeOwner(owner: string): string {
  const parts = owner.split(/\s*\+\s*/).filter(Boolean);
  return [...new Set(parts)].join(" + ");
}

// Idempotent: safe to run on new and already-processed workflows.
export function applyDirectorRules(wf: Workflow, company: Company | undefined, atRisk: boolean): Workflow {
  const w: Workflow = JSON.parse(JSON.stringify(wf), (_k, v) => (typeof v === "string" ? renameLead(v) : v));
  w.owner = dedupeOwner(w.owner);

  const add = (key: string, marker: string, task: string) => {
    const stage = w.stages.find((s) => s.key === key);
    if (stage && !stage.tasks.some((t) => t.startsWith(marker))) stage.tasks.push(task);
  };

  if (atRisk) {
    const a = `Alert the ${DIRECTOR_ROLE}:`;
    add("align", a, `${a} flag this potential churn / at-risk scenario at ${w.account} right away so they can weigh in on the save plan.`);
    const t = `Update the ${DIRECTOR_ROLE}:`;
    add("track", t, `${t} report the status of the prior steps (validation, alignment, outreach, and actions taken) and keep them posted until the risk is resolved.`);
  }
  if (isTopAccount(company)) {
    const m = `Include the ${DIRECTOR_ROLE}:`;
    add("act", m, `${m} ${w.account} is a top-revenue account, so bring them into this play and the customer outreach whether the signal is a risk or an opportunity.`);
  }
  return w;
}
