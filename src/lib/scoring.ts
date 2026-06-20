export type CriterionKey = "offtake" | "permits" | "financial" | "esg" | "sponsor" | "strategic";

export const CRITERIA: { key: CriterionKey; label: string; weight: number; description: string }[] = [
  { key: "offtake", label: "Offtake Agreement", weight: 25, description: "Long-term buyer commitment" },
  { key: "permits", label: "Permits & Licensing", weight: 20, description: "Regulatory readiness" },
  { key: "financial", label: "Financial Model", weight: 20, description: "Returns and capital structure" },
  { key: "esg", label: "ESG Compliance", weight: 15, description: "Environmental & social safeguards" },
  { key: "sponsor", label: "Sponsor Strength", weight: 10, description: "Track record and credibility" },
  { key: "strategic", label: "Strategic Alignment", weight: 10, description: "National priority fit" },
];

export type DocStatus = Record<CriterionKey, boolean>;

export function subScore(present: boolean) {
  return present ? 85 : 28;
}

export function calcBankability(docs: DocStatus): number {
  const total = CRITERIA.reduce((acc, c) => acc + (subScore(docs[c.key]) * c.weight) / 100, 0);
  return Math.round(total);
}

export type ScoreBand = {
  label: string;
  key: "ready" | "near" | "dev" | "early";
  color: string;
  bg: string;
  ring: string;
};

export function getBand(score: number): ScoreBand {
  if (score >= 85) return { label: "Investment Ready", key: "ready", color: "text-success", bg: "bg-success/15", ring: "ring-success/40" };
  if (score >= 70) return { label: "Near Bankable", key: "near", color: "text-accent", bg: "bg-accent/15", ring: "ring-accent/40" };
  if (score >= 50) return { label: "Development", key: "dev", color: "text-amber", bg: "bg-amber/15", ring: "ring-amber/40" };
  return { label: "Early Stage", key: "early", color: "text-danger", bg: "bg-danger/15", ring: "ring-danger/40" };
}

export function bandColorVar(score: number): string {
  if (score >= 85) return "var(--success)";
  if (score >= 70) return "var(--accent)";
  if (score >= 50) return "var(--amber)";
  return "var(--danger)";
}

// Alias for compatibility with ported components
export type CriteriaKey = CriterionKey;
