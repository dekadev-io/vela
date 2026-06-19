# Engineer 1 — AI Bankability Score & Gap Analysis
> Pitch sprint scope. Next.js frontend, placeholder/mock data, flows must work end-to-end.

---

## Ownership

| Page | Route |
|------|-------|
| Project Upload & Live Scorer | `/upload` |
| Bankability Score Breakdown | `/projects/[id]/score` |
| Gap Analysis & Advisor | `/projects/[id]/advisor` |
| Shared components | `components/score/` |
| Shared data contract | `lib/types.ts` · `lib/mock-data.ts` *(coordinate with Eng 2 first)* |

---

## Shared Contract

Write these first — Eng 2 depends on them.

### `lib/types.ts`

```typescript
export type Sector = 'Renewable Energy' | 'Infrastructure' | 'Tourism' | 'Agriculture' | 'Water & Sanitation' | 'Digital'
export type Province = 'Java' | 'Sumatra' | 'Bali' | 'Kalimantan' | 'Sulawesi' | 'Papua'
export type BankabilityTier = 'investment-ready' | 'near-bankable' | 'development' | 'early-stage'
export type CriteriaKey = 'offtake' | 'permits' | 'financial' | 'esg' | 'sponsor' | 'strategic'

export interface ScoreCriteria {
  key: CriteriaKey
  label: string
  weight: number       // 0.25 | 0.20 | 0.20 | 0.15 | 0.10 | 0.10
  score: number        // 0–100 per criterion
  hasDoc: boolean
  gapPoints: number    // points unlocked if this doc is added
  advice: string       // e.g. "Secure offtake agreement → +12 pts"
}

export interface Project {
  id: string
  title: string
  sector: Sector
  province: Province
  capex: number        // USD millions
  description: string
  score: number        // composite 0–100
  tier: BankabilityTier
  criteria: ScoreCriteria[]
  docs: Record<CriteriaKey, boolean>
}

export interface DataRoomRequest {
  investorName: string
  firm: string
  email: string
  mandate: string
  projectId: string
  status: 'pending' | 'approved' | 'rejected'
}
```

### `lib/mock-data.ts`

Seed all 14 projects from the prototype. Each must have a full `criteria[]` array. Example:

```typescript
export const PROJECTS: Project[] = [
  {
    id: 'north-java-solar-farm',
    title: 'North Java Solar Farm',
    sector: 'Renewable Energy',
    province: 'Java',
    capex: 420,
    score: 85,
    tier: 'investment-ready',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    description: '...',
    criteria: [
      { key: 'offtake',    label: 'Offtake Agreement',  weight: 0.25, score: 90, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
      { key: 'permits',    label: 'Permits & Licensing', weight: 0.20, score: 85, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
      { key: 'financial',  label: 'Financial Model',     weight: 0.20, score: 88, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
      { key: 'esg',        label: 'ESG Compliance',      weight: 0.15, score: 80, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
      { key: 'sponsor',    label: 'Sponsor Strength',    weight: 0.10, score: 82, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
      { key: 'strategic',  label: 'Strategic Alignment', weight: 0.10, score: 78, hasDoc: true,  gapPoints: 0,  advice: 'Already complete' },
    ],
  },
  // ... remaining 13 projects
  // For low-score projects, set hasDoc: false and gapPoints > 0 on missing criteria
]
```

Score computation helper — derive `score` from `criteria`:

```typescript
export function computeScore(criteria: ScoreCriteria[]): number {
  return Math.round(criteria.reduce((sum, c) => sum + c.score * c.weight, 0))
}

export function getTier(score: number): BankabilityTier {
  if (score >= 85) return 'investment-ready'
  if (score >= 70) return 'near-bankable'
  if (score >= 50) return 'development'
  return 'early-stage'
}
```

---

## Exported Components *(Eng 2 will import these)*

Both must be exported from `components/score/index.ts`.

```typescript
// Eng 2 drops these into /projects/[id]
export function BankabilityScoreCard({ project }: { project: Project }): JSX.Element
export function GapAnalysisSummary({ project, limit }: { project: Project; limit?: number }): JSX.Element
```

`BankabilityScoreCard` — compact card showing composite score, tier badge, and mini progress bar per criterion. Used inside Eng 2's project detail page.

`GapAnalysisSummary` — top N gap items (default 3) showing criterion name + points to unlock. Also used inside Eng 2's project detail page as a teaser.

---

## Page 1 — `/upload` : Project Upload & Live Scorer

**Purpose:** Developer submits a project and immediately sees their bankability score computed in real-time.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Nav]                                              │
├───────────────────┬─────────────────────────────────┤
│  Project Info     │  Live Bankability Score         │
│  ─────────────    │  ─────────────────────────      │
│  Title            │   [Score Ring / Number]         │
│  Sector           │   e.g. 48 / 100                 │
│  Province         │   "Early Stage"                 │
│  CAPEX (USD M)    │                                 │
│  Description      │  Criterion Bars                 │
│                   │  ● Offtake      ──── 0 pts      │
│  Documents        │  ● Permits      ──── 0 pts      │
│  ─────────────    │  ● Financial    ──── 0 pts      │
│  ☐ Offtake Agr.  │  ● ESG          ──── 0 pts      │
│  ☐ Permits       │  ● Sponsor      ──── 0 pts      │
│  ☐ Financial     │  ● Strategic    ──── 0 pts      │
│  ☐ ESG           │                                 │
│  ☐ Sponsor       │  Top gap action:                │
│  ☐ Strategic     │  "Add Offtake → +25 pts"        │
│                   │                                 │
│  [Submit Project] │                                 │
└───────────────────┴─────────────────────────────────┘
```

### Behaviour

- Checklist toggles update score instantly (client-side, no API call needed)
- Score ring / large number animates on change (`transition-all`)
- Tier badge (color-coded) updates with score
- "Top gap action" shows the highest-`gapPoints` unchecked criterion
- On submit: navigate to `/projects/[id]/score` for the newly created project (add to mock data in state or local storage for demo)

### Form fields

| Field | Type | Validation |
|-------|------|-----------|
| Title | text input | required |
| Sector | select (6 options) | required |
| Province | select (6 options) | required |
| CAPEX | number input (USD M) | required, > 0 |
| Description | textarea | optional |
| Criteria docs | 6 checkboxes | none |

### Score formula (client-side)

Each checked criterion contributes its full weight × 100. Unchecked = 0.

```typescript
// Simplified for demo — checked = full score, unchecked = 0
const BASE_SCORES: Record<CriteriaKey, number> = {
  offtake: 25, permits: 20, financial: 20, esg: 15, sponsor: 10, strategic: 10
}
const score = Object.entries(docs)
  .filter(([_, checked]) => checked)
  .reduce((sum, [key]) => sum + BASE_SCORES[key as CriteriaKey], 0)
```

---

## Page 2 — `/projects/[id]/score` : Bankability Score Breakdown

**Purpose:** Full per-criterion breakdown for a single project. The primary scoring result screen.

### Layout

```
┌────────────────────────────────────────────────────┐
│ [Nav]                                              │
│                                                    │
│ ← Back to project   North Java Solar Farm          │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  85 / 100          [Investment Ready Badge]  │  │
│  │  ████████████████████████░░  Progress bar    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Criterion Breakdown                               │
│  ┌────────────────────────────────────────────┐    │
│  │ Offtake Agreement    25%   90/100   ✅     │    │
│  │ ████████████████████████░            bar   │    │
│  ├────────────────────────────────────────────┤    │
│  │ Permits & Licensing  20%   85/100   ✅     │    │
│  │ ████████████████████░                bar   │    │
│  ├────────────────────────────────────────────┤    │
│  │  ... remaining 4 criteria                  │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  [View Gap Analysis →]                             │
└────────────────────────────────────────────────────┘
```

### Behaviour

- Load project from `PROJECTS` by `id` param
- Each criterion row: label, weight %, criterion score, hasDoc check/cross, mini progress bar
- Bar color: green if `hasDoc`, amber/red if not
- CTA at bottom navigates to `/projects/[id]/advisor`
- If no gaps exist (all 6 docs present): show "Fully documented — Investment Ready" state instead of CTA

---

## Page 3 — `/projects/[id]/advisor` : Gap Analysis & Improvement Advisor

**Purpose:** Show exactly what's missing and what to do next to raise the score. The most important screen for the developer pitch demo.

### Layout

```
┌────────────────────────────────────────────────────┐
│ [Nav]                                              │
│                                                    │
│ ← Back to score     Gap Analysis                  │
│                     North Java Solar Farm          │
│                                                    │
│  Current Score: 48/100   Target: 70 (Near Bankable)│
│  ──────────────────────────────────────────────   │
│  You need +22 pts to become visible to investors   │
│                                                    │
│  Improvement Roadmap                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ 1. Offtake Agreement                    +25  │  │
│  │    Long-term buyer commitment                │  │
│  │    "Securing this agreement will make your   │  │
│  │     project visible to 12 matched investors" │  │
│  │    [Mark as complete]                        │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 2. Financial Model                      +20  │  │
│  │    Returns and capital structure             │  │
│  │    [Mark as complete]                        │  │
│  ├──────────────────────────────────────────────┤  │
│  │  ... remaining gap items sorted by gapPoints │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  What happens at 70?                         │  │
│  │  Your project becomes discoverable to        │  │
│  │  matched capital providers (IFC, ADB, GCF,  │  │
│  │  family offices) — no outreach needed.       │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Behaviour

- Gap items sorted by `gapPoints` descending
- Only show criteria where `hasDoc === false`
- "Mark as complete" toggles the criterion locally, re-runs score computation, and updates the "You need +N pts" counter live
- If score crosses 70 after marking: show a success toast + "You're now visible to investors — go to marketplace" CTA
- If all gaps closed: show fully-complete celebration state

### Advisor copy (static per criterion)

| Criterion | Static advisory text |
|-----------|---------------------|
| Offtake | "Securing a long-term offtake agreement is the single highest-impact action. It signals revenue certainty to DFIs and reduces perceived risk significantly." |
| Permits | "Regulatory clearance removes the #1 blocker for international capital. OSS-verified permits trigger automatic score uplift." |
| Financial | "A complete financial model (IRR, DSCR, NPV) is required by IFC and ADB before any investment committee review." |
| ESG | "GCF and multilateral mandates require ESMP compliance. This unlocks access to the largest pool of climate-aligned capital." |
| Sponsor | "Sponsor track record documentation (past projects, AUM, team CVs) directly affects perceived execution risk." |
| Strategic | "PSN / RPJMN alignment documentation activates BKPM priority support and government co-financing pathways." |

---

## Component Library (`components/score/`)

| Component | Description |
|-----------|-------------|
| `ScoreRing` | Large circular score display with animated number and tier colour |
| `ScoreBar` | Single criterion row: label, weight, score, hasDoc icon, progress bar |
| `TierBadge` | Rounded pill with tier label + colour (matches DESIGN.md tokens) |
| `BankabilityScoreCard` | Compact card: score ring + top 3 criteria bars. **Exported for Eng 2.** |
| `GapAnalysisSummary` | Top N gap actions with points. **Exported for Eng 2.** |
| `GapItem` | Single improvement row: criterion, points, advice, mark-complete toggle |
| `AdvisorCallout` | Info box explaining what happens at score threshold (70 / 85) |

---

## Optional AI Integration *(only if time allows)*

Wire `POST /api/score` using Claude API:

```typescript
// app/api/score/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  const { projectTitle, description, docsProvided } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a project finance expert. Score this investment project on 6 bankability criteria (0-100 each).
      
Project: ${projectTitle}
Description: ${description}
Documents provided: ${docsProvided.join(', ')}

Return JSON only:
{
  "criteria": [
    { "key": "offtake", "score": 0-100, "advice": "one sentence" },
    { "key": "permits", "score": 0-100, "advice": "one sentence" },
    { "key": "financial", "score": 0-100, "advice": "one sentence" },
    { "key": "esg", "score": 0-100, "advice": "one sentence" },
    { "key": "sponsor", "score": 0-100, "advice": "one sentence" },
    { "key": "strategic", "score": 0-100, "advice": "one sentence" }
  ]
}`
    }]
  })

  return Response.json(JSON.parse(message.content[0].text))
}
```

Replace client-side score computation in `/upload` with a call to this endpoint on submit.

---

## Demo Flow (Eng 1's portion)

1. Open `/upload` → fill in a low-scoring project (no docs checked) → score shows 0/100 Early Stage
2. Toggle "Offtake Agreement" → score jumps to 25 → toggle "Permits" → 45 → toggle "Financial" → 65
3. Hit Submit → lands on `/projects/[id]/score` → full breakdown visible
4. Click "View Gap Analysis" → `/projects/[id]/advisor` → roadmap shows remaining 3 items
5. Mark "ESG" complete → score crosses 70 → toast fires: "You're now visible to investors"
