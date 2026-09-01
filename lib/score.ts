export function scoreLabel(score: number): string {
  switch (score) {
    case 2:
      return "Strong Opportunity";
    case 1:
      return "Opportunity";
    case 0:
      return "Neutral";
    case -1:
      return "Risk";
    case -2:
      return "Strong Risk";
    default:
      return "Unknown";
  }
}

export function scoreClasses(score: number): string {
  switch (score) {
    case 2:
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case 1:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 0:
      return "bg-slate-100 text-slate-600 border-slate-300";
    case -1:
      return "bg-amber-100 text-amber-800 border-amber-300";
    case -2:
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
