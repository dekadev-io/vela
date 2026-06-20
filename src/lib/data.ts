import { CRITERIA, calcBankability, type CriterionKey, type DocStatus } from "./scoring";

export type Sector = "Renewable Energy" | "Infrastructure" | "Tourism" | "Agriculture" | "Water & Sanitation" | "Digital";
export type Province = "Java" | "Sumatra" | "Bali" | "Kalimantan" | "Sulawesi" | "Papua";

export type Project = {
  id: string;
  title: string;
  sector: Sector;
  province: Province;
  investmentUsdM: number;
  description: string;
  developer: string;
  docs: DocStatus;
  score: number;
};

// Reverse-engineer doc status from target score
function docsForTarget(target: number): DocStatus {
  // Try combinations from full to empty by criterion weight desc
  const order: CriterionKey[] = ["offtake", "permits", "financial", "esg", "sponsor", "strategic"];
  let best: DocStatus = { offtake: false, permits: false, financial: false, esg: false, sponsor: false, strategic: false };
  let bestDiff = Infinity;
  // 64 combinations
  for (let mask = 0; mask < 64; mask++) {
    const d: DocStatus = { offtake: false, permits: false, financial: false, esg: false, sponsor: false, strategic: false };
    order.forEach((k, i) => { d[k] = Boolean(mask & (1 << i)); });
    const s = calcBankability(d);
    const diff = Math.abs(s - target);
    if (diff < bestDiff) { bestDiff = diff; best = d; }
  }
  return best;
}

const seed: Omit<Project, "docs" | "score" | "id" | "developer" | "description">[] = [
  { title: "North Java Solar Farm", sector: "Renewable Energy", province: "Java", investmentUsdM: 420 },
  { title: "Trans-Sumatra Toll Road Extension", sector: "Infrastructure", province: "Sumatra", investmentUsdM: 1850 },
  { title: "Bali Eco-Resort & Marine Park", sector: "Tourism", province: "Bali", investmentUsdM: 280 },
  { title: "Kalimantan Palm Oil Processing Hub", sector: "Agriculture", province: "Kalimantan", investmentUsdM: 340 },
  { title: "Sulawesi Deep Sea Port", sector: "Infrastructure", province: "Sulawesi", investmentUsdM: 1200 },
  { title: "West Java Clean Water SPAM", sector: "Water & Sanitation", province: "Java", investmentUsdM: 165 },
  { title: "Sumatra Green Hydrogen Plant", sector: "Renewable Energy", province: "Sumatra", investmentUsdM: 920 },
  { title: "Papua Aquaculture Development", sector: "Agriculture", province: "Papua", investmentUsdM: 95 },
  { title: "Bali Smart Tourism Digital Platform", sector: "Digital", province: "Bali", investmentUsdM: 48 },
  { title: "East Java Geothermal Plant 2x60MW", sector: "Renewable Energy", province: "Java", investmentUsdM: 540 },
  { title: "Kalimantan Forest Carbon Credit", sector: "Agriculture", province: "Kalimantan", investmentUsdM: 210 },
  { title: "Lombok Airport Expansion", sector: "Infrastructure", province: "Bali", investmentUsdM: 670 },
  { title: "North Sumatra EV Battery Factory", sector: "Digital", province: "Sumatra", investmentUsdM: 1100 },
  { title: "Sulawesi Integrated Fisheries Port", sector: "Agriculture", province: "Sulawesi", investmentUsdM: 380 },
];

const targetScores = [91, 87, 82, 79, 88, 75, 68, 58, 71, 85, 62, 89, 44, 73];

const developers = ["PT Surya Nusantara", "PT Bumi Infrastruktur", "Bali Eco Holdings", "PT Agro Kalimantan", "PT Pelabuhan Timur", "PT Tirta Jawa", "Hidrogen Indonesia Tbk", "PT Papua Marina", "PT Digital Bali", "Geo Energi Nusantara", "Hutan Lestari Tbk", "PT Lombok Aviasi", "PT Baterai Sumatra", "PT Perikanan Sulawesi"];

const descriptions = [
  "500MW utility-scale solar PV with battery storage feeding the JAMALI grid with PLN PPA in negotiation.",
  "320km toll road extension connecting key economic corridors across Sumatra with availability payment scheme.",
  "Premium eco-tourism destination with marine conservation zone and 220 luxury villas targeting carbon-neutral operations.",
  "Integrated CPO refinery with 1.2M tons/year capacity, biogas capture, and RSPO-certified plantation supply.",
  "Deepwater port with 18m draft, container & bulk terminals, positioned on the new eastern shipping corridor.",
  "Regional drinking water system serving 1.4M residents with 25-year concession structure.",
  "Green hydrogen production using geothermal-powered electrolysis with offtake LOIs from Japanese & Korean buyers.",
  "Modern shrimp & seaweed aquaculture park with cold-chain export logistics, early-stage feasibility.",
  "Tourism-tech super-app with bookings, identity, and payments integrated with Bappeda Bali.",
  "2x60MW binary geothermal plant with confirmed resource and 30-year PLN PPA.",
  "1.2M ha REDD+ project under Indonesia's FOLU Net Sink 2030 framework, awaiting verification.",
  "Runway extension to 3,300m and new international terminal supporting 7M annual passengers.",
  "8GWh lithium-iron-phosphate cell factory anchored by ASEAN OEM offtake — early-stage permitting.",
  "Integrated fisheries hub with cold storage, processing, and export-grade quay for 1,200 vessels.",
];

export const PROJECTS: Project[] = seed.map((p, i) => {
  const docs = docsForTarget(targetScores[i]);
  const score = calcBankability(docs);
  return {
    ...p,
    id: String(i + 1),
    docs,
    score,
    developer: developers[i],
    description: descriptions[i],
  };
});

export const SECTORS: Sector[] = ["Renewable Energy", "Infrastructure", "Tourism", "Agriculture", "Water & Sanitation", "Digital"];
export const PROVINCES: Province[] = ["Java", "Sumatra", "Bali", "Kalimantan", "Sulawesi", "Papua"];

// Data Room Requests
export type RequestStatus = "pending" | "approved" | "rejected";
export type DataRoomRequest = {
  id: string;
  projectId: string;
  projectTitle: string;
  investorName: string;
  organization: string;
  mndaSigned: boolean;
  status: RequestStatus;
  date: string;
};

export const SEED_REQUESTS: DataRoomRequest[] = [
  { id: "r1", projectId: "1", projectTitle: "North Java Solar Farm", investorName: "Sarah Tan", organization: "Macquarie Asset Management", mndaSigned: true, status: "approved", date: "2025-04-12" },
  { id: "r2", projectId: "5", projectTitle: "Sulawesi Deep Sea Port", investorName: "James Liu", organization: "GIC Private Limited", mndaSigned: true, status: "pending", date: "2025-04-21" },
  { id: "r3", projectId: "10", projectTitle: "East Java Geothermal Plant 2x60MW", investorName: "Anders Holm", organization: "Copenhagen Infrastructure Partners", mndaSigned: true, status: "approved", date: "2025-04-08" },
  { id: "r4", projectId: "12", projectTitle: "Lombok Airport Expansion", investorName: "Marie Dubois", organization: "CDPQ", mndaSigned: false, status: "pending", date: "2025-04-25" },
  { id: "r5", projectId: "7", projectTitle: "Sumatra Green Hydrogen Plant", investorName: "Rajesh Kumar", organization: "IFC", mndaSigned: true, status: "rejected", date: "2025-03-30" },
];

export function aiSummary(p: Project): string {
  const band = p.score >= 85 ? "investment-ready" : p.score >= 70 ? "near-bankable" : p.score >= 50 ? "development-stage" : "early-stage";
  const missing = CRITERIA.filter(c => !p.docs[c.key]);
  if (missing.length === 0) {
    return `${p.title} is fully documented and ranks among Indonesia's most ${band} opportunities. All six bankability criteria are substantiated with primary documentation, supporting an accelerated diligence timeline.`;
  }
  const top = missing.sort((a, b) => b.weight - a.weight)[0];
  return `${p.title} is currently ${band} with a bankability score of ${p.score}/100. The most material gap is ${top.label.toLowerCase()} (${top.weight}% weight). Closing this would lift the project meaningfully toward the Investment Ready band and unlock institutional capital.`;
}

export function aiRecommendations(p: Project): string[] {
  const missing = CRITERIA.filter(c => !p.docs[c.key]).sort((a, b) => b.weight - a.weight);
  const recs = missing.slice(0, 4).map(c => {
    const verbs: Record<CriterionKey, string> = {
      offtake: `Secure offtake agreement — highest impact at ${c.weight}% weight`,
      permits: `Complete environmental permits to demonstrate regulatory readiness (${c.weight}% weight)`,
      financial: `Finalize bankable financial model with sensitivity analysis (${c.weight}% weight)`,
      esg: `Publish ESG/E&S impact assessment aligned with IFC Performance Standards (${c.weight}% weight)`,
      sponsor: `Strengthen sponsor profile with track record dossier (${c.weight}% weight)`,
      strategic: `Document alignment with national priorities (PSN/RPJMN) (${c.weight}% weight)`,
    };
    return verbs[c.key];
  });
  if (recs.length === 0) recs.push("Prepare data room and initiate roadshow with target institutional investors.");
  return recs;
}
