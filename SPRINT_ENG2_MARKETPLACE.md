# Engineer 2 — Marketplace & AI Output
> Pitch sprint scope. Next.js frontend, placeholder/mock data, flows must work end-to-end.

---

## Ownership

| Page | Route |
|------|-------|
| Investment Marketplace | `/projects` |
| Project Detail | `/projects/[id]` |
| Investor Data Room Request | `/projects/[id]` (modal flow) |
| National Pipeline Dashboard | `/dashboard` |
| BKPM Admin + Portfolio Deck | `/admin` |
| Deck Output | `/admin/deck` |

---

## Dependency on Eng 1

Consume these from `lib/types.ts` and `lib/mock-data.ts` — **Eng 1 writes these first, do not duplicate**.

Import these components into `/projects/[id]`:

```typescript
import { BankabilityScoreCard, GapAnalysisSummary } from '@/components/score'
```

Both accept `{ project: Project }`. Do not build your own score UI — use Eng 1's exports.

---

## Page 1 — `/projects` : Investment Marketplace

**Purpose:** Investor browses and filters the national pipeline. The primary discovery surface.

### Layout

```
┌────────────────────────────────────────────────────┐
│ [Nav]                                              │
│                                                    │
│ Investment Pipeline                                │
│ Filter, compare, and shortlist 14 bankable projects│
│                                                    │
│ [Sector ▾] [Province ▾] [Bankability Band ▾] [🔍] │
│                                                    │
│ Showing 14 of 14 projects                          │
│                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ RENEW.   │ │ INFRA    │ │ TOURISM  │            │
│ │ N.Java   │ │ Sumatra  │ │ Bali     │            │
│ │ Solar..  │ │ Toll Rd  │ │ Eco-Res  │            │
│ │ 85/100   │ │ 85/100   │ │ 79/100   │            │
│ │[Inv.Rdy] │ │[Inv.Rdy] │ │[NearBank]│            │
│ │ $420M    │ │ $1,850M  │ │ $280M    │            │
│ └──────────┘ └──────────┘ └──────────┘            │
│  ... grid continues                                │
└────────────────────────────────────────────────────┘
```

### Behaviour

- Filter dropdowns are client-side — no API. Filter state in `useState`.
- All 3 filters compose: AND logic (sector AND province AND tier)
- "Showing N of 14 projects" count updates live
- Empty state: `rounded-xl border border-dashed` with "No projects match your filters"
- Each project card links to `/projects/[id]`
- Default sort: score descending

### Project Card

```
┌────────────────────────────────────┐
│ [Sector Tag]        [Tier Badge]   │
│                                    │
│ Project Title (line-clamp-2)       │
│                                    │
│ ─────────────────────────────────  │
│ 📍 Province              $420M    │
└────────────────────────────────────┘
```

- Sector tag: `bg-primary/15 ring-1 ring-primary/30 text-[11px] uppercase tracking-wider`
- Tier badge: import `TierBadge` from `components/score` (Eng 1's component) or replicate the 4-color logic from DESIGN.md
- Card hover: `hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5`
- Province: MapPin icon + province name

### Filter Options

| Filter | Options |
|--------|---------|
| Sector | All · Renewable Energy · Infrastructure · Tourism · Agriculture · Water & Sanitation · Digital |
| Province | All · Java · Sumatra · Bali · Kalimantan · Sulawesi · Papua |
| Bankability Band | All · Investment Ready (85+) · Near Bankable (70–84) · Development (50–69) · Early Stage (<50) |

---

## Page 2 — `/projects/[id]` : Project Detail

**Purpose:** Single project view for investors. Combines Eng 2's UI shell with Eng 1's score components.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [Nav]                                                │
│                                                      │
│ ← Back to Marketplace                               │
│                                                      │
│ [Sector Tag]  [Province]  [CAPEX]                   │
│ Project Title                                        │
│ Description text...                                  │
│                                                      │
│ ┌────────────────────┐  ┌───────────────────────┐   │
│ │ BankabilityScore   │  │ GapAnalysisSummary     │   │
│ │ Card               │  │ (top 3 gaps)           │   │
│ │ (Eng 1 component)  │  │ (Eng 1 component)      │   │
│ └────────────────────┘  └───────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │  Data Room                                       │ │
│ │  This project's documents are available under    │ │
│ │  NDA to verified investors.                      │ │
│ │                                                  │ │
│ │  [Request Data Room Access]                      │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Behaviour

- Load project from `PROJECTS` by `id` param (from `lib/mock-data.ts`)
- `<BankabilityScoreCard project={project} />` — Eng 1's component, drop in directly
- `<GapAnalysisSummary project={project} limit={3} />` — Eng 1's component, drop in directly
- "Request Data Room Access" button opens the KYC modal (see below)

---

## Flow 2a — Data Room Request Modal

Triggered by "Request Data Room Access" on `/projects/[id]`.

### Modal steps

**Step 1 — KYC Form**
```
┌─────────────────────────────────────┐
│ Request Data Room Access            │
│                                     │
│ Full name       [____________]      │
│ Firm / Fund     [____________]      │
│ Email           [____________]      │
│ Investment      [____________]      │
│ mandate         (e.g. "ESG infra    │
│                  $50M–$500M")       │
│                                     │
│ [Cancel]        [Submit Request]    │
└─────────────────────────────────────┘
```

**Step 2 — Pending state** (shown after submit, same modal)
```
┌─────────────────────────────────────┐
│ ✓ Request Submitted                 │
│                                     │
│ The project developer will review   │
│ your request. You'll receive access │
│ once approved.                      │
│                                     │
│ Mandate on file:                    │
│ "ESG infra $50M–$500M"             │
│                                     │
│ [Close]                             │
└─────────────────────────────────────┘
```

### Behaviour

- Client-side only — store request in `useState` or `localStorage` for demo continuity
- Form validation: all fields required
- No real email sent — just state transition
- After "Close": button on project detail changes to `[Access Requested — Pending]` (disabled, amber)

---

## Page 3 — `/dashboard` : National Pipeline Dashboard

**Purpose:** High-level pipeline overview. Used by both BKPM and investors.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [Nav]                                                │
│                                                      │
│ National Pipeline                                    │
│ Indonesia Investment Intelligence                    │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │ 14       │ │ $8.22B   │ │ 38       │ │ 5       │ │
│ │ Projects │ │ CAPEX    │ │ Provinces│ │ Inv.Rdy │ │
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                                                      │
│ Bankability Distribution          Avg Score/Sector  │
│ ┌──────────────────────┐  ┌──────────────────────┐  │
│ │ ●  5  Inv. Ready     │  │ Infrastructure  ████ │  │
│ │ ● 5  Near Bankable   │  │ Renewable       ███  │  │
│ │ ●  3  Development    │  │ Tourism         ██   │  │
│ │ ●  1  Early Stage    │  │ Agriculture     ██   │  │
│ └──────────────────────┘  │ Digital         █    │  │
│                           │ Water & San.    ██   │  │
│                           └──────────────────────┘  │
│                                                      │
│ Top 10 Projects by Score                            │
│ ┌──────────────────────────────────────────────────┐ │
│ │ # │ Project      │ Sector │ Province │Score│ Band│ │
│ │ 1 │ N.Java Solar │ Renew. │ Java     │ 85  │ ✅  │ │
│ │ 2 │ Trans-Sumatra│ Infra  │ Sumatra  │ 85  │ ✅  │ │
│ │   │ ...          │        │          │     │     │ │
│ └──────────────────────────────────────────────────┘ │
│                                [View all projects →] │
└──────────────────────────────────────────────────────┘
```

### Behaviour

- All data computed from `PROJECTS` in `lib/mock-data.ts` — no API
- Sector chart: compute average score per sector client-side, render as CSS width bars (no chart lib needed for demo)
- Distribution counts: `PROJECTS.filter(p => p.tier === 'investment-ready').length` etc.
- Top 10 table: `PROJECTS.sort((a,b) => b.score - a.score).slice(0, 10)`
- "View all" links to `/projects`

### Stat Cards

| Stat | Value | Source |
|------|-------|--------|
| Projects | 14 | `PROJECTS.length` |
| CAPEX | $8.22B | `sum(PROJECTS.map(p => p.capex))` |
| Provinces | 38 | hardcoded (national target) |
| Investment Ready | 5 | `PROJECTS.filter(p => p.tier === 'investment-ready').length` |

---

## Page 4 — `/admin` : BKPM Admin View

**Purpose:** BKPM operator sees the full pipeline and generates a portfolio deck for roadshows.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [Nav]   BKPM Admin                                   │
│                                                      │
│ Pipeline Overview                                    │
│                                                      │
│ [Sector ▾] [Province ▾] [Band ▾]   [Export CSV]     │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Project         │Sector│Province│Score│  Band    │ │
│ │ ─────────────── │──────│────────│─────│──────────│ │
│ │ N.Java Solar    │Renew.│Java    │  85 │[Inv.Rdy] │ │
│ │ Trans-Sumatra   │Infra │Sumatra │  85 │[Inv.Rdy] │ │
│ │ Sulawesi Port   │Infra │Sulawesi│  85 │[Inv.Rdy] │ │
│ │ ...14 rows      │      │        │     │          │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │  Generate Portfolio Deck                         │ │
│ │  Select projects for IIPC roadshow deck          │ │
│ │                                                  │ │
│ │  ● Top 10 by score (default)                     │ │
│ │  ○ Top 10 by sector                              │ │
│ │  ○ Investment Ready only                         │ │
│ │                                                  │ │
│ │  Language: [English ▾]                           │ │
│ │                                                  │ │
│ │  [Generate Deck →]                               │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Behaviour

- Pipeline table is filterable (same client-side logic as `/projects`)
- "Export CSV" — generate and download a CSV of currently filtered projects using `Blob` + `URL.createObjectURL`
- Deck generator: selection radio updates `deckProjects` state (slice of `PROJECTS`)
- "Generate Deck" navigates to `/admin/deck?mode=top10` (or passes state via router)

---

## Page 5 — `/admin/deck` : Portfolio Deck Output

**Purpose:** The one-click deck IIPC uses at international roadshows. Each project gets a card. Printable.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [Nav]                     [← Back] [🖨 Print / Save] │
│                                                      │
│ Indonesia Investment Portfolio                       │
│ Top 10 Bankable Projects · 2026                      │
│ Prepared for IIPC International Roadshow             │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 01  North Java Solar Farm         [Inv. Ready]   │ │
│ │     Renewable Energy · Java · $420M              │ │
│ │     Score: 85/100  ████████████████████          │ │
│ │     Description summary (2 lines)                │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 02  Trans-Sumatra Toll Road Ext.  [Inv. Ready]   │ │
│ │     ...                                          │ │
│ └──────────────────────────────────────────────────┘ │
│  ... 10 project cards total                          │
│                                                      │
│ Powered by VELA · Indonesia Investment Intelligence  │
└──────────────────────────────────────────────────────┘
```

### Behaviour

- Renders the selected projects (from `/admin` state or query param)
- "Print / Save" calls `window.print()` — style with `@media print` to hide nav/buttons
- Each project card is self-contained, consistent height
- Score bar uses inline style `width: ${score}%` + score color from `getScoreColor(score)`

### Print styles

```css
@media print {
  nav, .no-print { display: none; }
  .deck-card { page-break-inside: avoid; }
}
```

### Optional AI teaser *(if time allows)*

Add a "AI Summary" line per project card using Claude API:

```typescript
// app/api/teaser/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  const { title, sector, province, capex, score, description } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Write a 2-sentence investment teaser for this project for an international investor roadshow. Be specific, data-driven, professional.

Project: ${title}
Sector: ${sector}, Province: ${province}
CAPEX: $${capex}M · Bankability Score: ${score}/100
${description}

Return only the 2 sentences, no intro.`
    }]
  })

  return Response.json({ teaser: message.content[0].text })
}
```

Generate teasers for all 10 deck projects in parallel using `Promise.all` before rendering the deck page.

---

## Component Library (`components/marketplace/`)

| Component | Description |
|-----------|-------------|
| `ProjectCard` | Card for `/projects` grid — sector tag, tier badge, score, province, CAPEX |
| `FilterBar` | 3 dropdowns (sector, province, band) + project count label |
| `DataRoomModal` | 2-step modal: KYC form → pending confirmation |
| `StatCard` | Number + label card for dashboard/admin |
| `SectorChart` | Horizontal bar chart (CSS only, no lib) — label + `width: X%` bar |
| `PipelineTable` | Sortable table: project name, sector, province, score badge, CAPEX |
| `DeckCard` | Single project card for portfolio deck output |

---

## Demo Flow (Eng 2's portion)

**Investor flow:**
1. Open `/projects` → 14 projects shown in grid
2. Filter: Sector = "Renewable Energy" → grid narrows to 3 projects
3. Click "North Java Solar Farm" → `/projects/[id]` detail page
4. See `BankabilityScoreCard` (Eng 1 component) + `GapAnalysisSummary`
5. Click "Request Data Room Access" → KYC modal → fill form → "Request Submitted"
6. Button changes to "Access Requested — Pending"

**BKPM flow:**
1. Open `/dashboard` → national stats + top 10 table
2. Navigate to `/admin` → full pipeline table
3. Set "Top 10 by score" + Language "English" → "Generate Deck"
4. `/admin/deck` — 10 project cards rendered
5. Click "Print / Save" → browser print dialog

---

## Integration Checklist

Before demo rehearsal, confirm with Eng 1:

- [ ] `lib/types.ts` and `lib/mock-data.ts` are written and exported
- [ ] `BankabilityScoreCard` renders correctly with any `Project` from mock data
- [ ] `GapAnalysisSummary` renders correctly with `limit={3}`
- [ ] `TierBadge` (or equivalent) exported for reuse in `ProjectCard`
- [ ] Score color function `getScoreColor(score)` exported from `lib/utils.ts`
