import type { CriteriaKey } from '@/lib/scoring'
import type { Sector, Province, Project } from '@/lib/data'

export type AIExtractedInfo = {
  title?: string
  sector?: Sector
  province?: Province
  capex?: number
  description?: string
}

export type ChecklistItem = {
  label: string
  status: 'pass' | 'warn' | 'fail'
  concern?: string
  evidence?: string  // plain string with [[highlighted phrase]] markers
}

export type AIDocResult = {
  criteriaKey: CriteriaKey
  confidence: number
  docScore: number
  insights: string[]
  extractedInfo: AIExtractedInfo
  reasoning: string
  checklistItems: ChecklistItem[]
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
    'Checking IFC Performance Standards 1-8 compliance...',
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
    'Cross-referencing PSN and RPJMN 2025-2029 priorities...',
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
    'GHG reduction: 180,000 tCO2e/year — GCF eligible',
  ],
  sponsor: [
    'Sponsor: 3 completed renewable projects (850 MW total)',
    'Management team avg 15 years in infrastructure finance',
    'IFC equity participation confirmed in prior co-developed project',
    'AUM $2.1B — demonstrates financial capacity for this scale',
  ],
  strategic: [
    'Project listed under PSN 2024 as priority energy infrastructure',
    'Aligned with RPJMN 2025-2029 renewable energy targets',
    'BKPM facilitation letter secured — fast-track processing active',
    'Eligible for government Viability Gap Funding (VGF)',
  ],
}

export const FRAMEWORK_REFS: Record<CriteriaKey, string> = {
  offtake:   'IFC Revenue Risk Framework',
  permits:   'Indonesia Regulatory Readiness Standard',
  financial: "Moody's Project Finance Methodology",
  esg:       'IFC Performance Standards 1-8',
  sponsor:   'DFI Sponsor Credibility Framework',
  strategic: 'RPJMN 2025-2029 Alignment Criteria',
}

export const AI_REASONING: Record<CriteriaKey, string> = {
  offtake:   'Strong revenue certainty from the 20-year PPA structure with PLN. Fixed tariff and minimum offtake guarantee adequately de-risk debt service obligations. Minor gaps in tariff escalation indexation and dispute resolution mechanism slightly reduce the overall score.',
  permits:   'AMDAL clearance and IUP construction permit are current and correctly issued to the project SPV. Grid connection permit (IUPTL) application is pending PLN confirmation — this is the primary risk item. Overall regulatory posture is solid relative to comparable projects at this stage.',
  financial: 'Financial model demonstrates robust bankability metrics: project IRR of 14.2% and DSCR of 1.38x both exceed IFC minimums. Capital structure and stress-test scenarios are well-documented. Debt Service Reserve Account (DSRA) funding plan requires strengthening before investment committee.',
  esg:       'ESMP demonstrates strong alignment with IFC Performance Standards 1 and 6. Community benefit-sharing mechanism is well-documented. Land acquisition plan and FPIC documentation for areas adjacent to indigenous territories require additional elaboration to satisfy PS 5 and PS 7 requirements.',
  sponsor:   'Sponsor demonstrates strong execution credibility through 3 completed renewable projects at significant scale. Prior IFC co-investment and experienced management team are compelling signals for DFI investment committees. Local community equity participation would materially strengthen the profile.',
  strategic: 'PSN listing and RPJMN 2025-2029 alignment are confirmed with supporting documentation. BKPM facilitation letter provides fast-track processing access. Formal VGF eligibility confirmation from DJPPR is pending — this document would fully unlock the strategic alignment scoring points.',
}

export const CHECKLIST_ITEMS: Record<CriteriaKey, ChecklistItem[]> = {
  offtake: [
    { label: 'PPA duration >= 15 years', status: 'pass' },
    { label: 'Creditworthy offtaker (investment grade or sovereign)', status: 'pass' },
    { label: 'Minimum offtake >= 80% of contracted capacity', status: 'pass' },
    { label: 'Force majeure and step-in rights structured', status: 'pass' },
    {
      label: 'Tariff escalation clause (CPI-linked)',
      status: 'warn',
      concern: 'The escalation provision references a discretionary annual review rather than an automatic CPI-indexed formula. DFIs require the adjustment mechanism to be formula-driven to eliminate regulatory discretion risk.',
      evidence: 'Section 8.2 — Tariff Adjustment: "Tariff revisions shall be subject to [[annual review at the sole discretion of the regulating authority]], provided written consent is received from the offtaker no fewer than 90 days prior to the effective date of any adjustment."',
    },
    {
      label: 'Dispute resolution mechanism (SIAC / BANI)',
      status: 'warn',
      concern: 'The clause specifies domestic Indonesian court jurisdiction without referencing neutral arbitration. International DFIs and lenders require SIAC or BANI arbitration for cross-border infrastructure financing.',
      evidence: 'Section 14.1 — Governing Law: "Any dispute arising under or in connection with this Agreement shall be finally resolved by [[the competent courts of the Republic of Indonesia, seated in Jakarta]], each party bearing its own costs."',
    },
  ],
  permits: [
    { label: 'AMDAL environmental clearance — current', status: 'pass' },
    { label: 'IUP construction permit issued', status: 'pass' },
    { label: 'OSS single-window registration confirmed', status: 'pass' },
    {
      label: 'Grid connection permit (IUPTL) from PLN',
      status: 'warn',
      concern: 'The IUPTL application was submitted but the approval letter has not been issued. Without confirmed grid connection rights, power evacuation risk remains open for lenders assessing construction-to-operations transition.',
      evidence: 'PLN Acknowledgment Letter (Exhibit C): "We confirm receipt of IUPTL application ref. PLN/2024/0847. [[Processing is estimated to be completed within 90-120 working days from the date of receipt (12 September 2024).]] Connection capacity reservation is pending approval."',
    },
    {
      label: 'Land acquisition clearance (HGU / HPL)',
      status: 'warn',
      concern: 'Title documentation covers 78% of the project footprint. The remaining 22% is pending BPN conversion — this creates construction sequencing risk and a potential condition precedent for financial close.',
      evidence: 'Land Certificate Inventory, Annex 5: "Total project footprint: 847 hectares. HGB/HGU titles confirmed: 662 ha (78.2%). [[Parcels under active BPN HGU conversion process: 185 ha (21.8%)]] — target clearance Q2 2025."',
    },
    { label: 'BKPM investment license (if foreign ownership)', status: 'pass' },
  ],
  financial: [
    { label: 'Project IRR >= 12%', status: 'pass' },
    { label: 'DSCR >= 1.25x across loan tenor', status: 'pass' },
    { label: 'NPV positive at 10% discount rate', status: 'pass' },
    { label: 'Equity contribution >= 25% of total CAPEX', status: 'pass' },
    { label: 'Base, upside, and downside scenarios modelled', status: 'pass' },
    {
      label: 'DSRA funded at 6-months debt service',
      status: 'warn',
      concern: 'The model provisions a 3-month DSRA at financial close with a step-up to 6 months by Year 3 from excess cash. Most DFIs require the full 6-month reserve to be funded at close — this may require a capital structure adjustment.',
      evidence: 'Financial Model — "Debt Service" Tab, Row 47: "Debt Service Reserve Account: [[initial funding at financial close = 3 months equivalent.]] Step-up mechanism: additional 3 months funded from project excess cash flow, target end of Year 3 of operations."',
    },
  ],
  esg: [
    { label: 'ESMP aligned with IFC PS 1 (Assessment & Management)', status: 'pass' },
    { label: 'IFC PS 6 — No critical habitat encroachment confirmed', status: 'pass' },
    { label: 'Community benefit-sharing mechanism documented', status: 'pass' },
    { label: 'GHG accounting methodology and baseline stated', status: 'pass' },
    {
      label: 'IFC PS 5 — Land acquisition and resettlement plan',
      status: 'warn',
      concern: 'The ESMP references a Resettlement Action Plan but the full RAP document was not submitted. IFC PS 5 requires the RAP to be reviewed, disclosed to affected communities, and accepted before any construction can commence in affected areas.',
      evidence: 'ESMP Section 4.3 — Resettlement: "A Resettlement Action Plan has been prepared covering [[12 households within the direct impact zone of the 132kV transmission corridor]]. The RAP is pending final approval from the provincial land office and will be submitted as a condition precedent to financial close."',
    },
    {
      label: 'FPIC documentation for indigenous territories (PS 7)',
      status: 'warn',
      concern: 'The project boundary overlaps with recognized customary land. IFC PS 7 requires documented Free, Prior and Informed Consent from community representatives before project activities can commence in this zone — a consultation log alone is insufficient.',
      evidence: 'Stakeholder Engagement Log, Entry 23: "Meeting with [[representatives of the Suku Dayak Ngaju community (~340 households)]] on 14 March 2024. Concerns raised regarding access to forest resources and sacred sites. FPIC formal process to be initiated — target completion Q3 2025. Consent documentation not yet executed."',
    },
  ],
  sponsor: [
    { label: '>= 1 comparable infrastructure project completed', status: 'pass' },
    { label: 'Management team: relevant finance credentials', status: 'pass' },
    { label: 'Balance sheet capacity demonstrated', status: 'pass' },
    { label: 'Prior DFI co-investment reference on record', status: 'pass' },
    { label: 'No adverse legal proceedings or sanctions', status: 'pass' },
    {
      label: 'Local partner or community equity stake',
      status: 'warn',
      concern: 'No local community equity participation is provided in the current structure. BKPM and several DFIs increasingly require local economic inclusion as a condition for infrastructure finance approval in sensitive regions of Indonesia.',
      evidence: 'Shareholder Agreement, Schedule 1 — Capitalization Table: "Initial shareholding: [[PT International Energy Holdings: 65.0%, PT Mitra Nusantara Infrastruktur: 35.0%.]] No community equity tranche or cooperative participation mechanism is included in the current share structure."',
    },
  ],
  strategic: [
    { label: 'PSN (Proyek Strategis Nasional) listing confirmed', status: 'pass' },
    { label: 'RPJMN 2025-2029 renewable energy alignment', status: 'pass' },
    { label: 'BKPM facilitation letter secured', status: 'pass' },
    { label: 'Just Energy Transition (JET-P) alignment', status: 'pass' },
    {
      label: 'VGF eligibility confirmed by DJPPR',
      status: 'warn',
      concern: 'The VGF pre-qualification letter from DJPPR has not yet been issued. This letter is a formal prerequisite for including VGF support in the financial model and demonstrating government credit enhancement to DFI investment committees.',
      evidence: 'Ministry Correspondence, Ref DJPPR/VGF/2025/0112: "Application for VGF Pre-Qualification received 20 January 2025. [[Estimated processing timeline: 90-180 days from receipt date.]] Status: pending initial DJPPR committee screening. Project sponsor will be notified upon completion of the screening stage."',
    },
    {
      label: 'Provincial government endorsement letter',
      status: 'warn',
      concern: "No formal endorsement letter from the Governor's office is on file. DFIs use this letter as evidence of local political alignment and risk mitigation — informal support or meeting records are not considered equivalent.",
      evidence: "Government Engagement Register, Entry 8: \"Meeting with Bappeda (Provincial Development Planning Agency) on 8 February 2025. Agency expressed [[verbal support for project alignment with provincial renewable energy masterplan]]. Formal endorsement letter requested — response from Governor's office pending as of document preparation date.\"",
    },
  ],
}

export const FEEDBACK_RESPONSES: Record<CriteriaKey, string> = {
  offtake: "Understood — reviewing the updated context you've provided. The CPI-linked escalation formula appears to be present in Addendum 3B of the PPA, which was not captured in the initial analysis scope. Based on your clarification, the automatic adjustment mechanism at CPI x 0.85 satisfies IFC Revenue Risk Framework requirements. I'm revising the tariff escalation checklist item to 'pass' and adjusting the document score upward by 4 points. For the dispute resolution clause, if the contract amendment you referenced confirms BANI arbitration, that item will also clear. Recommend including Addendum 3B and any contract amendments explicitly in the final data room package so DFI reviewers can immediately locate these provisions.",
  permits: "Noted — re-evaluating the grid connection status based on the additional context provided. If the PLN processing reference confirms the IUPTL is within the standard 90-day window with no objections raised, the risk profile for this item shifts from 'blocking' to 'monitored.' I've updated the severity accordingly. For the land acquisition gap, the BPN expedited processing pathway you've described is a positive signal — documenting this as a condition precedent to first drawdown rather than financial close would be a structurally clean resolution that most DFI legal teams accept. Recommend attaching the PLN processing reference letter and BPN expedited processing confirmation to the data room.",
  financial: "Context received — re-analyzing the DSRA structure with the updated information. The side letter from the arranging bank confirming upfront 6-month DSRA funding at financial close changes this assessment materially. I'm updating the DSRA checklist item status to 'pass' and revising the document score by +3 points. The financial model should be updated to reflect this commitment explicitly in the sources and uses table at close, and the side letter should be included as a formal exhibit in the financing agreements. No other items are affected by this update.",
  esg: "Thank you for the additional ESMP context. The three-stage FPIC engagement process you've described with the Suku Dayak Ngaju community goes beyond the initial submission and demonstrates more substantive compliance with IFC PS 7 procedures. The primary remaining requirement is formal written FPIC consent with authorized community representative signatures — once this document is obtained and disclosed, the PS 7 item should be cleared by DFI environmental and social teams. For the RAP, if the provincial land office approval is expected before financial close as a CP, that resolves the PS 5 gap. I've updated both items to reflect this progress — status changed to 'in progress, close to resolution.'",
  sponsor: "Understood. The community equity framework you've referenced — a 5% stake allocated to a local cooperative via a notarized trust structure — is a meaningful development that directly addresses the key gap identified. This structure, once legally documented in the shareholder agreement, would satisfy BKPM's local participation expectations and aligns with IFC's approach to community benefit-sharing for projects in sensitive regions. I've updated the local equity checklist item status to reflect this pending documentation. Recommend including the trust structure term sheet or MOU in the next data room update so investors can assess the mechanism.",
  strategic: "Noted — reviewing the VGF status with the updated information. The tracking number DJPPR/VGF/2025/0112 and the processing timeline you've described confirm the application is in active review at the correct stage. Given the PSN listing, BKPM facilitation letter, and JET-P alignment already confirmed, the VGF approval probability is high from a political risk standpoint. I've revised the risk rating for this item from 'outstanding' to 'in progress — expected to resolve.' For the provincial endorsement, if the Bappeda follow-up meeting you mentioned results in a formal letter from the Governor's office, that item will clear immediately. Recommend escalating the endorsement request through BKPM's facilitation channel.",
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
    description: 'Integrated carbon-neutral tourism corridor: Ubud-Kintamani EV transit, eco-resort cluster, carbon offset registry.',
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

  return {
    criteriaKey: detectedKey,
    confidence,
    docScore,
    insights: INSIGHTS[detectedKey],
    extractedInfo,
    reasoning: AI_REASONING[detectedKey],
    checklistItems: CHECKLIST_ITEMS[detectedKey],
  }
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

// ─── Gap Scan ────────────────────────────────────────────────────────────────

export type GapReport = {
  priority: 'Critical' | 'High' | 'Medium'
  pointImpact: number
  actions: string[]
  capitalNote: string
}

export const GAP_SCAN_REPORTS: Record<CriteriaKey, GapReport> = {
  offtake: {
    priority: 'Critical',
    pointImpact: 25,
    actions: [
      'Secure a bankable offtake agreement with a creditworthy counterparty (PLN, PJBL, or export buyer)',
      'Include minimum price floor, volume guarantee (≥80% of contracted capacity), and force-majeure carve-outs',
      'Engage IFC/ADB as anchor lenders — they require an executed PPA before proceeding to credit committee',
    ],
    capitalNote: 'Without an offtake, no DFI will proceed to credit committee — this single document gates the entire institutional capital stack.',
  },
  permits: {
    priority: 'Critical',
    pointImpact: 20,
    actions: [
      'Obtain AMDAL environmental clearance and IUP construction permit through OSS single-window platform',
      'Confirm grid connection permit (IUPTL) with PLN — this is the most common blocking condition for renewables',
      'Consolidate all permits in the SPV entity name and verify current validity dates before investor due diligence',
    ],
    capitalNote: 'Unresolved permit gaps trigger automatic red flags in DFI legal reviews and can delay financial close by 6–12 months.',
  },
  financial: {
    priority: 'High',
    pointImpact: 20,
    actions: [
      'Build a fully integrated financial model with IRR ≥12%, DSCR ≥1.25x, and NPV positive at 10% discount rate',
      'Include base, upside, and downside scenarios with explicit sensitivity tables on tariff, construction cost, and interest rate',
      'Fund a 6-month Debt Service Reserve Account (DSRA) at financial close — IFC and ADB require this as a hard condition',
    ],
    capitalNote: "Investment committees cannot produce a credit paper without a bankable financial model — it is the primary risk-quantification tool for every DFI.",
  },
  esg: {
    priority: 'High',
    pointImpact: 15,
    actions: [
      'Prepare an Environmental and Social Management Plan (ESMP) aligned with IFC Performance Standards 1–8',
      'Complete a community benefit-sharing mechanism and FPIC documentation for any indigenous territory overlap',
      'Commission GHG accounting to IFC methodology to unlock GCF climate finance eligibility (typically $50M+ tranches)',
    ],
    capitalNote: 'GCF and over 80% of DFI mandates require verified ESG compliance — without it, the entire climate-aligned capital tier is inaccessible.',
  },
  sponsor: {
    priority: 'Medium',
    pointImpact: 10,
    actions: [
      'Prepare a sponsor track record dossier documenting at least one comparable completed infrastructure project with financial close confirmation',
      'Include management team CVs showing relevant infrastructure finance or project development credentials',
      'Provide balance sheet documentation demonstrating equity contribution capacity for this project scale',
    ],
    capitalNote: 'Perceived execution risk from a weak sponsor profile is the second most common reason DFI investment committees decline to issue a term sheet.',
  },
  strategic: {
    priority: 'Medium',
    pointImpact: 10,
    actions: [
      'Obtain a BKPM facilitation letter to activate PSN fast-track processing and demonstrate national priority status',
      'Document RPJMN 2025–2029 alignment with specific chapter and article references in the information memorandum',
      'Apply for VGF pre-qualification from DJPPR — the letter unlocks government credit enhancement in the financial model',
    ],
    capitalNote: 'PSN listing and VGF eligibility are key signals to government-linked DFIs (INA, SMI) and can unlock up to 15% blended finance de-risking.',
  },
}

export const GAP_SCAN_STAGES = [
  'Parsing uploaded document index…',
  'Evaluating offtake agreement coverage…',
  'Cross-referencing permit status…',
  'Stress-testing financial model completeness…',
  'Benchmarking ESG framework alignment…',
  'Assessing sponsor track record depth…',
  'Mapping strategic priority alignment…',
  'Computing capital market impact…',
  'Generating priority action matrix…',
  'Finalising gap report…',
]

export function scanVerdict(score: number, missingCount: number): string {
  if (missingCount === 0) {
    return `${score}/100 — all six bankability criteria are substantiated. This project is positioned for accelerated institutional diligence and is eligible for term sheet discussions with DFIs, infrastructure PE, and family offices.`
  }
  if (missingCount <= 2) {
    const band = score >= 70 ? 'Near Bankable' : 'Development'
    return `${score}/100 (${band}) — ${missingCount} gap${missingCount > 1 ? 's' : ''} remain. Closing the Critical and High priority items above would lift this project into the Investment Ready band and unlock the full institutional capital stack within a single diligence cycle.`
  }
  return `${score}/100 — ${missingCount} material gaps identified across multiple criteria. Prioritise Critical items first; resolving offtake and permits alone adds up to 45 points and crosses the 70-point investor visibility threshold on VELA.`
}

// ─── Stream helper ────────────────────────────────────────────────────────────

export async function streamWords(
  text: string,
  onChunk: (partial: string) => void,
  delayMs = 18,
) {
  const words = text.split(' ')
  let built = ''
  for (const word of words) {
    built += (built ? ' ' : '') + word
    onChunk(built)
    await new Promise<void>((r) => setTimeout(r, delayMs))
  }
}

// ─── AI Advisor ───────────────────────────────────────────────────────────────

const CRITERIA_ORDER: CriteriaKey[] = ['offtake', 'permits', 'financial', 'esg', 'sponsor', 'strategic']

const CRITERIA_LABEL_MAP: Record<CriteriaKey, string> = {
  offtake: 'Offtake Agreement',
  permits: 'Permits & Licensing',
  financial: 'Financial Model',
  esg: 'ESG Compliance',
  sponsor: 'Sponsor Strength',
  strategic: 'Strategic Alignment',
}

const BASE_PTS: Record<CriteriaKey, number> = {
  offtake: 25, permits: 20, financial: 20, esg: 15, sponsor: 10, strategic: 10,
}

function getMissing(p: Project): CriteriaKey[] {
  return CRITERIA_ORDER.filter(k => !p.docs[k])
}

function getBandLabel(score: number): string {
  if (score >= 85) return 'Investment Ready'
  if (score >= 70) return 'Near Bankable'
  if (score >= 50) return 'Development'
  return 'Early Stage'
}

function getNextBand(score: number): { label: string; threshold: number } | null {
  if (score >= 85) return null
  if (score >= 70) return { label: 'Investment Ready', threshold: 85 }
  return { label: 'Near Bankable', threshold: 70 }
}

export type AdvisorPromptSlug = 'blocking' | 'fastest' | 'tier'

export const ADVISOR_RESPONSES: Record<AdvisorPromptSlug, (p: Project) => string> = {
  blocking(p) {
    const missing = getMissing(p)
    if (missing.length === 0) {
      return `${p.title} has no outstanding bankability gaps — all six criteria are documented. The next step is preparing a data room and initiating a roadshow with matched capital providers on VELA.`
    }
    const top = missing[0]
    const label = CRITERIA_LABEL_MAP[top]
    const pts = BASE_PTS[top]
    return `The most critical blocker for ${p.title} is the missing ${label} (${pts} points, ${top === 'offtake' || top === 'permits' ? 'Critical' : 'High'} priority). Without it, investment committees cannot proceed to credit review — institutional DFIs require this documentation before any term sheet discussion can begin. Resolve this first; it unlocks the largest single score uplift available.`
  },

  fastest(p) {
    const missing = getMissing(p)
    if (missing.length === 0) {
      return `${p.title} has closed all bankability gaps. No further document gaps to resolve — focus on investor outreach and data room preparation.`
    }
    // Fastest = lowest weight missing criterion
    const sorted = [...missing].sort((a, b) => BASE_PTS[a] - BASE_PTS[b])
    const fastest = sorted[0]
    const label = CRITERIA_LABEL_MAP[fastest]
    const pts = BASE_PTS[fastest]
    return `The fastest gap to close for ${p.title} is ${label} (+${pts} points). This typically takes 4–6 weeks and primarily requires internal documentation rather than third-party validation or regulatory approval. It signals operational readiness to co-investors and strengthens the sponsor credibility narrative without requiring a long external process.`
  },

  tier(p) {
    const missing = getMissing(p)
    const next = getNextBand(p.score)
    if (!next) {
      return `${p.title} is already at Investment Ready (${p.score}/100) — the highest VELA tier. Projects at this level are eligible for term sheet discussions and can expect DFI engagement within 30–60 days of data room opening.`
    }
    const gap = next.threshold - p.score
    if (missing.length === 0) {
      return `${p.title} is at ${p.score}/100 and needs ${gap} more points to reach ${next.label}. All criteria are documented, so score improvement requires upgrading existing document quality rather than adding new submissions.`
    }
    const top1 = missing[0]
    const top2 = missing[1]
    const pts1 = BASE_PTS[top1]
    const label1 = CRITERIA_LABEL_MAP[top1]
    const currentBand = getBandLabel(p.score)
    if (top2) {
      const pts2 = BASE_PTS[top2]
      const label2 = CRITERIA_LABEL_MAP[top2]
      return `To reach ${next.label}, ${p.title} needs ${gap} more points from ${currentBand} (${p.score}/100). The most efficient path is closing ${label1} (+${pts1} pts) followed by ${label2} (+${pts2} pts). Closing both adds ${pts1 + pts2} points and moves the project from ${currentBand} to ${next.label} within one diligence preparation cycle.`
    }
    return `To reach ${next.label}, ${p.title} needs ${gap} more points. Closing ${label1} (+${pts1} pts) is the single highest-impact action available — it alone covers ${Math.round((pts1 / gap) * 100)}% of the gap to the next tier.`
  },
}

export const ADVISOR_QUICK_PROMPTS: { slug: AdvisorPromptSlug; label: string }[] = [
  { slug: 'blocking', label: "What's blocking investor access?" },
  { slug: 'fastest', label: 'Which gap closes the fastest?' },
  { slug: 'tier', label: 'How do I reach the next tier?' },
]

// ─── Per-criterion AI detail (for project detail page) ────────────────────────

export type CriterionAIDetail = {
  status: 'pass' | 'warn' | 'fail'
  concern: string
  evidence?: string  // supports [[highlighted phrase]] markers
}

export const CRITERION_AI_DETAILS: Record<CriteriaKey, { present: CriterionAIDetail; missing: CriterionAIDetail }> = {
  offtake: {
    present: {
      status: 'warn',
      concern: 'Offtake agreement is present but contains a non-standard escalation clause. IFC and ADB require a fixed or CPI-indexed tariff floor — discretionary review language introduces refinancing risk at tenor.',
      evidence: 'Section 8.2: "Tariff revisions shall be subject to [[annual review at the sole discretion of the regulating authority]], with no guaranteed minimum floor price established for the contract term."',
    },
    missing: {
      status: 'fail',
      concern: 'No offtake agreement has been submitted. At 25% weight, this single document gates access to all DFI debt — IFC, ADB, and bilateral lenders require an executed or near-final PPA before any credit committee review can proceed.',
    },
  },
  permits: {
    present: {
      status: 'pass',
      concern: 'Environmental and operational permits appear complete and consistent with OSS online verification. Licensing chain confirmed across provincial AMDAL and central government ESDM approvals.',
      evidence: 'Annex B: "[[AMDAL approval reference No. SK.420/2024 issued by KLHK]] — valid through 2034, covering the full project footprint of 820 hectares as defined in the technical specification."',
    },
    missing: {
      status: 'fail',
      concern: 'No permit documentation submitted. Without regulatory clearance, international capital providers cannot commence environmental and social due diligence — a mandatory prerequisite under IFC Performance Standards and ADB SPS.',
    },
  },
  financial: {
    present: {
      status: 'warn',
      concern: 'A financial model has been submitted, but key debt-sizing metrics are not clearly articulated. IFC and Moody\'s require explicit DSCR projections under a stressed interest rate scenario — currently absent.',
      evidence: 'Sheet "Financing": "[[Base case IRR of 14.2% assumes flat LIBOR + 350bps debt cost]] — no sensitivity analysis for a +200bps rate shock has been provided in the current model version."',
    },
    missing: {
      status: 'fail',
      concern: 'No financial model submitted. A bankable model (IRR, NPV, DSCR, debt sizing, sensitivity analysis) is mandatory for investment committee review by any DFI or institutional co-lender.',
    },
  },
  esg: {
    present: {
      status: 'pass',
      concern: 'ESG framework aligns with IFC Performance Standards PS1 and PS6. ESMP is current and covers community engagement, biodiversity screening, and grievance mechanism documentation.',
      evidence: 'Section 3.1: "[[Community consultation conducted across 14 villages in Q3 2024 per IFC PS1 requirements]], with grievance log maintained and available for investor review upon request."',
    },
    missing: {
      status: 'fail',
      concern: 'No ESG or E&S documentation submitted. Climate-aligned DFIs (GCF, ADB, IFC) mandate an ESMP before any loan appraisal — absence disqualifies the project from green finance facilities and multilateral co-lending.',
    },
  },
  sponsor: {
    present: {
      status: 'pass',
      concern: 'Sponsor track record documentation is present and demonstrates prior project completion in the same sector, which substantially reduces perceived execution risk for co-investors and lenders.',
    },
    missing: {
      status: 'warn',
      concern: 'No sponsor track record documentation submitted. Lenders use this to assess execution capability — without it, projects are held at a higher risk premium or require a sponsor guarantee from a creditworthy guarantor.',
    },
  },
  strategic: {
    present: {
      status: 'pass',
      concern: 'Strategic alignment documentation confirms inclusion in the PSN pipeline with RPJMN cross-reference. This activates BKPM facilitation and government co-financing pathways.',
      evidence: 'Cover letter: "[[Project reference No. PSN-2024-RE-047 confirmed by BKPM Decree No. 12/2024]], granting priority facilitation status under the National Strategic Project programme."',
    },
    missing: {
      status: 'warn',
      concern: 'Strategic alignment with national priorities has not been documented. Formal PSN or RPJMN inclusion evidence is needed to access BKPM facilitation, government guarantees, and the viability gap fund (VGF).',
    },
  },
}
