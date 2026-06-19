import type { CriteriaKey, Sector, Province } from './types'

export type AIExtractedInfo = {
  title?: string
  sector?: Sector
  province?: Province
  capex?: number
  description?: string
}

export type AIDocResult = {
  criteriaKey: CriteriaKey
  confidence: number
  docScore: number
  insights: string[]
  extractedInfo: AIExtractedInfo
}

type StageCallback = (s: { index: number; message: string; total: number }) => void

export const ANALYSIS_STAGES: Record<CriteriaKey, string[]> = {
  offtake: [
    'Parsing contract structure and signatories...',
    'Extracting offtake volume, pricing, and duration...',
    'Verifying revenue certainty and force majeure clauses...',
    'Scoring against IFC Revenue Risk Framework...',
  ],
  permits: [
    'Reading regulatory document headers and authorities...',
    'Identifying permit types: AMDAL, IUP, IUPTL, OSS...',
    'Verifying validity dates and compliance status...',
    'Scoring against regulatory readiness criteria...',
  ],
  financial: [
    'Parsing financial model structure and assumptions...',
    'Extracting IRR, DSCR, NPV, and debt coverage ratios...',
    'Validating capital structure and equity cushion...',
    "Scoring against Moody's Project Finance methodology...",
  ],
  esg: [
    'Analyzing environmental impact assessment scope...',
    'Checking IFC Performance Standards 1–8 compliance...',
    'Reviewing community engagement and FPIC documentation...',
    'Scoring against GCF climate and social criteria...',
  ],
  sponsor: [
    'Reading sponsor credentials and organizational profile...',
    'Extracting track record: past projects and AUM data...',
    'Verifying team qualifications and co-investor references...',
    'Scoring sponsor execution risk and credibility...',
  ],
  strategic: [
    'Parsing strategic documentation and policy references...',
    'Cross-referencing PSN and RPJMN 2025–2029 priorities...',
    'Identifying BKPM facilitation and VGF pathways...',
    'Scoring strategic alignment with national plan...',
  ],
}

const INSIGHTS: Record<CriteriaKey, string[]> = {
  offtake: [
    '20-year PPA detected with creditworthy state offtaker (PLN)',
    'Fixed tariff structure — strong revenue certainty signal',
    'Minimum 85% offtake guarantee covers debt service',
    'Force majeure and step-in rights properly structured',
  ],
  permits: [
    'AMDAL environmental clearance verified, current through 2028',
    'IUP construction permit issued — OSS single-window confirmed',
    'Grid connection permit application on file with PLN',
    'No outstanding regulatory objections detected',
  ],
  financial: [
    'Project IRR: 14.2% — above IFC minimum 12% threshold',
    'DSCR: 1.38x — strong debt service coverage ratio',
    '70/30 debt-equity structure within DFI parameters',
    'NPV positive at 10% discount rate across base and stress cases',
  ],
  esg: [
    'ESMP prepared to IFC Performance Standards 1 & 6',
    'Biodiversity impact assessment completed — no critical habitat',
    'Community benefit-sharing mechanism documented',
    'GHG reduction: 180,000 tCO₂e/year — GCF eligible',
  ],
  sponsor: [
    'Sponsor: 3 completed renewable projects (850 MW total)',
    'Management team avg 15 years in infrastructure finance',
    'IFC equity participation confirmed in prior co-developed project',
    'AUM $2.1B — demonstrates financial capacity for this scale',
  ],
  strategic: [
    'Project listed under PSN 2024 as priority energy infrastructure',
    'Aligned with RPJMN 2025–2029 renewable energy targets',
    'BKPM facilitation letter secured — fast-track processing active',
    'Eligible for government Viability Gap Funding (VGF)',
  ],
}

const SCORE_RANGE: Record<CriteriaKey, [number, number]> = {
  offtake:   [78, 94],
  permits:   [72, 91],
  financial: [75, 93],
  esg:       [70, 90],
  sponsor:   [73, 92],
  strategic: [71, 89],
}

const DETECT_PATTERNS: Array<[RegExp, CriteriaKey]> = [
  [/offtake|ppa|power.?purchase|energy.?sale|tariff|offtaker/i, 'offtake'],
  [/permit|licen[sc]e|izin|amdal|iup|iuptl|oss|regulatory/i, 'permits'],
  [/financial|model|projection|cashflow|cash.?flow|irr|dscr|npv|feasib/i, 'financial'],
  [/esg|environmental|social|esmp|ghg|biodiversity|climate|impact/i, 'esg'],
  [/sponsor|credential|track.?record|profile|management|team|cv|resume/i, 'sponsor'],
  [/strategic|rpjmn|psn|alignment|national|bkpm|policy|government/i, 'strategic'],
]

export function detectCriteriaFromFilename(filename: string): CriteriaKey | null {
  for (const [pattern, key] of DETECT_PATTERNS) {
    if (pattern.test(filename)) return key
  }
  return null
}

const EXTRACTED_PROJECT_INFOS: AIExtractedInfo[] = [
  {
    title: 'North Java Solar Farm',
    sector: 'Renewable Energy',
    province: 'Java',
    capex: 420,
    description: '200MW utility-scale solar PV project in Central Java with grid-scale BESS storage and 20-year PPA with PLN.',
  },
  {
    title: 'Sulawesi Green Hydrogen Hub',
    sector: 'Renewable Energy',
    province: 'Sulawesi',
    capex: 850,
    description: 'First-of-kind green hydrogen production facility (300MW hydro) targeting export to Japan and South Korea.',
  },
  {
    title: 'Sumatra Biomass Power Plant',
    sector: 'Renewable Energy',
    province: 'Sumatra',
    capex: 280,
    description: '120MW biomass-to-power project using certified sustainable palm residue, co-developed with local cooperative.',
  },
  {
    title: 'Bali Eco-Tourism Corridor',
    sector: 'Tourism',
    province: 'Bali',
    capex: 190,
    description: 'Integrated carbon-neutral tourism corridor: Ubud–Kintamani EV transit, eco-resort cluster, carbon offset registry.',
  },
  {
    title: 'Papua Micro-Hydro Grid',
    sector: 'Infrastructure',
    province: 'Papua',
    capex: 155,
    description: '12 run-of-river micro-hydro plants totaling 48MW electrifying 60 remote villages in Highland Papua.',
  },
]

let _extractIndex = 0

export async function runMockAIAnalysis(
  file: File,
  criteriaKey: CriteriaKey | undefined,
  onStage: StageCallback,
  options?: { withFeedback?: boolean },
): Promise<AIDocResult> {
  const detectedKey = criteriaKey ?? detectCriteriaFromFilename(file.name) ?? 'offtake'
  const base = ANALYSIS_STAGES[detectedKey]
  const stages = options?.withFeedback
    ? ['Incorporating your feedback and context...', ...base]
    : base

  for (let i = 0; i < stages.length; i++) {
    onStage({ index: i, message: stages[i], total: stages.length })
    await sleep(480 + Math.random() * 520)
  }

  const [min, max] = SCORE_RANGE[detectedKey]
  const boost = options?.withFeedback ? Math.floor(3 + Math.random() * 5) : 0
  const docScore = Math.min(98, Math.floor(min + Math.random() * (max - min + 1)) + boost)
  const confidence = Math.min(99, Math.floor(87 + Math.random() * 11) + (options?.withFeedback ? 2 : 0))

  const extractedInfo: AIExtractedInfo =
    criteriaKey === undefined
      ? EXTRACTED_PROJECT_INFOS[_extractIndex++ % EXTRACTED_PROJECT_INFOS.length]
      : {}

  return { criteriaKey: detectedKey, confidence, docScore, insights: INSIGHTS[detectedKey], extractedInfo }
}

export const PROJECT_DOC_STAGES = [
  'Parsing document layout and structure...',
  'Identifying project title and scope...',
  'Extracting sector and geographic location...',
  'Reading investment size and capital structure...',
  'Summarizing commercial terms and project details...',
]

export async function runProjectDocAnalysis(
  file: File,
  onStage: StageCallback,
): Promise<AIExtractedInfo> {
  for (let i = 0; i < PROJECT_DOC_STAGES.length; i++) {
    onStage({ index: i, message: PROJECT_DOC_STAGES[i], total: PROJECT_DOC_STAGES.length })
    await sleep(520 + Math.random() * 480)
  }
  return EXTRACTED_PROJECT_INFOS[_extractIndex++ % EXTRACTED_PROJECT_INFOS.length]
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
