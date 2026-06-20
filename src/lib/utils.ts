import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CriteriaKey } from "@/lib/scoring";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CRITERIA_WEIGHTS: Record<CriteriaKey, number> = {
  offtake: 0.25, permits: 0.20, financial: 0.20, esg: 0.15, sponsor: 0.10, strategic: 0.10,
}

export const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  offtake: 'Offtake Agreement', permits: 'Permits & Licensing', financial: 'Financial Model',
  esg: 'ESG Compliance', sponsor: 'Sponsor Strength', strategic: 'Strategic Alignment',
}

export const CRITERIA_DESC: Record<CriteriaKey, string> = {
  offtake: 'Long-term buyer commitment', permits: 'Regulatory readiness',
  financial: 'Returns and capital structure', esg: 'Environmental & social safeguards',
  sponsor: 'Track record and credibility', strategic: 'National priority fit',
}

export const CRITERIA_ADVICE: Record<CriteriaKey, string> = {
  offtake: 'Securing a long-term offtake agreement is the single highest-impact action. It signals revenue certainty to DFIs and reduces perceived risk significantly.',
  permits: 'Regulatory clearance removes the #1 blocker for international capital. OSS-verified permits trigger automatic score uplift.',
  financial: 'A complete financial model (IRR, DSCR, NPV) is required by IFC and ADB before any investment committee review.',
  esg: 'GCF and multilateral mandates require ESMP compliance. This unlocks access to the largest pool of climate-aligned capital.',
  sponsor: 'Sponsor track record documentation (past projects, AUM, team CVs) directly affects perceived execution risk.',
  strategic: 'PSN / RPJMN alignment documentation activates BKPM priority support and government co-financing pathways.',
}

export function computeScoreFromDocs(docs: Record<CriteriaKey, boolean>): number {
  const BASE: Record<CriteriaKey, number> = {
    offtake: 25, permits: 20, financial: 20, esg: 15, sponsor: 10, strategic: 10,
  }
  return (Object.keys(docs) as CriteriaKey[]).filter(k => docs[k]).reduce((sum, k) => sum + BASE[k], 0)
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'var(--success)'
  if (score >= 70) return 'var(--accent)'
  if (score >= 50) return 'var(--amber)'
  return 'var(--danger)'
}

export type BankabilityTier = 'investment-ready' | 'near-bankable' | 'development' | 'early-stage'

export interface ScoreCriteria {
  key: CriteriaKey
  label: string
  weight: number
  score: number
  hasDoc: boolean
  gapPoints: number
  advice: string
}

export interface TierMeta {
  label: string
  key: BankabilityTier
  color: string
  bg: string
  ring: string
  nextThreshold: number | null
  nextLabel: string | null
}

export function getTierMeta(score: number): TierMeta {
  if (score >= 85) return { label: 'Investment Ready', key: 'investment-ready', color: 'text-success', bg: 'bg-success/15', ring: 'ring-success/40', nextThreshold: null, nextLabel: null }
  if (score >= 70) return { label: 'Near Bankable', key: 'near-bankable', color: 'text-accent', bg: 'bg-accent/15', ring: 'ring-accent/40', nextThreshold: 85, nextLabel: 'Investment Ready' }
  if (score >= 50) return { label: 'Development', key: 'development', color: 'text-amber', bg: 'bg-amber/15', ring: 'ring-amber/40', nextThreshold: 70, nextLabel: 'Near Bankable' }
  return { label: 'Early Stage', key: 'early-stage', color: 'text-danger', bg: 'bg-danger/15', ring: 'ring-danger/40', nextThreshold: 70, nextLabel: 'Near Bankable' }
}

export function formatCapex(usdM: number): string {
  if (usdM >= 1000) return `$${(usdM / 1000).toFixed(1)}B`
  return `$${usdM}M`
}
