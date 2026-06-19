import type { Project } from './types'
import { CRITERIA_ADVICE, CRITERIA_DESC, CRITERIA_LABELS, CRITERIA_WEIGHTS } from './utils'

function makeCriteria(scores: Record<string, number>, docs: Record<string, boolean>) {
  const keys = ['offtake', 'permits', 'financial', 'esg', 'sponsor', 'strategic'] as const
  return keys.map((key) => ({
    key,
    label: CRITERIA_LABELS[key],
    weight: CRITERIA_WEIGHTS[key],
    score: docs[key] ? scores[key] : 0,
    hasDoc: docs[key],
    gapPoints: docs[key] ? 0 : Math.round(CRITERIA_WEIGHTS[key] * 100),
    advice: docs[key] ? 'Already complete' : CRITERIA_ADVICE[key],
    description: CRITERIA_DESC[key],
  }))
}

export const PROJECTS: Project[] = [
  {
    id: 'north-java-solar-farm',
    title: 'North Java Solar Farm',
    sector: 'Renewable Energy',
    province: 'Java',
    capex: 420,
    score: 85,
    tier: 'investment-ready',
    description: '150MW utility-scale solar PV project with 25-year PPA signed with PLN. Environmental permits cleared. IFC-aligned ESG framework in place.',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 90, permits: 85, financial: 88, esg: 80, sponsor: 82, strategic: 78 },
      { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'trans-sumatra-toll-road',
    title: 'Trans-Sumatra Toll Road Extension',
    sector: 'Infrastructure',
    province: 'Sumatra',
    capex: 1850,
    score: 85,
    tier: 'investment-ready',
    description: '340km toll road extension connecting Medan to Palembang. PSN-listed. Government availability payment guarantee in place.',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 88, permits: 87, financial: 85, esg: 82, sponsor: 90, strategic: 95 },
      { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'sulawesi-deep-sea-port',
    title: 'Sulawesi Deep Sea Port',
    sector: 'Infrastructure',
    province: 'Sulawesi',
    capex: 1200,
    score: 85,
    tier: 'investment-ready',
    description: 'New 30-berth deep sea port in Makassar with 50-year concession agreement. Throughput contract signed with three major shipping lines.',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 85, permits: 88, financial: 86, esg: 78, sponsor: 85, strategic: 90 },
      { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'east-java-geothermal-plant',
    title: 'East Java Geothermal Plant 2×60MW',
    sector: 'Renewable Energy',
    province: 'Java',
    capex: 540,
    score: 85,
    tier: 'investment-ready',
    description: '120MW geothermal power plant in Ijen Caldera. 30-year PPA with PLN. ESIA completed and approved by KLHK.',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 92, permits: 80, financial: 87, esg: 85, sponsor: 80, strategic: 82 },
      { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'lombok-airport-expansion',
    title: 'Lombok Airport Expansion',
    sector: 'Infrastructure',
    province: 'Bali',
    capex: 670,
    score: 85,
    tier: 'investment-ready',
    description: 'Expansion of Lombok International Airport to 10M passengers/year. Concession agreement with AP1. Tourism demand study completed.',
    docs: { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 86, permits: 84, financial: 88, esg: 80, sponsor: 88, strategic: 85 },
      { offtake: true, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'bali-eco-resort-marine-park',
    title: 'Bali Eco-Resort & Marine Park',
    sector: 'Tourism',
    province: 'Bali',
    capex: 280,
    score: 79,
    tier: 'near-bankable',
    description: '5-star eco-resort with integrated marine conservation zone. Environmental impact assessment in progress. Land rights secured.',
    docs: { offtake: false, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 82, financial: 85, esg: 90, sponsor: 78, strategic: 75 },
      { offtake: false, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'kalimantan-palm-oil-hub',
    title: 'Kalimantan Palm Oil Processing Hub',
    sector: 'Agriculture',
    province: 'Kalimantan',
    capex: 340,
    score: 79,
    tier: 'near-bankable',
    description: 'Integrated palm oil processing and biodiesel facility. RSPO certification in progress. Offtake negotiation with Wilmar ongoing.',
    docs: { offtake: false, permits: true, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 80, financial: 82, esg: 78, sponsor: 82, strategic: 80 },
      { offtake: false, permits: true, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'west-java-clean-water-spam',
    title: 'West Java Clean Water SPAM',
    sector: 'Water & Sanitation',
    province: 'Java',
    capex: 165,
    score: 74,
    tier: 'near-bankable',
    description: 'Regional piped water system serving 500,000 households in Bekasi–Karawang corridor. PDAM offtake in final negotiation.',
    docs: { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 82, financial: 80, esg: 0, sponsor: 75, strategic: 85 },
      { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'sulawesi-fisheries-port',
    title: 'Sulawesi Integrated Fisheries Port',
    sector: 'Agriculture',
    province: 'Sulawesi',
    capex: 380,
    score: 74,
    tier: 'near-bankable',
    description: 'Integrated fishing port with cold chain infrastructure in Bitung. Supported by KKP. Financial model in final review.',
    docs: { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 80, financial: 78, esg: 0, sponsor: 80, strategic: 88 },
      { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'bali-smart-tourism-platform',
    title: 'Bali Smart Tourism Digital Platform',
    sector: 'Digital',
    province: 'Bali',
    capex: 48,
    score: 71,
    tier: 'near-bankable',
    description: 'AI-powered tourism management platform integrating 2,000+ accommodations, ticketing, and visitor flow analytics for Bali Tourism Board.',
    docs: { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 78, financial: 80, esg: 0, sponsor: 82, strategic: 85 },
      { offtake: false, permits: true, financial: true, esg: false, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'sumatra-green-hydrogen',
    title: 'Sumatra Green Hydrogen Plant',
    sector: 'Renewable Energy',
    province: 'Sumatra',
    capex: 920,
    score: 68,
    tier: 'development',
    description: '100MW electrolyser powered by hydroelectric source. Pre-feasibility completed. Offtake and permits still in early stage.',
    docs: { offtake: false, permits: false, financial: true, esg: true, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 0, financial: 75, esg: 78, sponsor: 80, strategic: 85 },
      { offtake: false, permits: false, financial: true, esg: true, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'kalimantan-forest-carbon',
    title: 'Kalimantan Forest Carbon Credit',
    sector: 'Agriculture',
    province: 'Kalimantan',
    capex: 210,
    score: 62,
    tier: 'development',
    description: '500,000 ha REDD+ conservation project in Central Kalimantan. Verra VCS methodology under validation. Land boundary disputes pending.',
    docs: { offtake: false, permits: false, financial: true, esg: true, sponsor: false, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 0, financial: 72, esg: 82, sponsor: 0, strategic: 80 },
      { offtake: false, permits: false, financial: true, esg: true, sponsor: false, strategic: true }
    ),
  },
  {
    id: 'papua-aquaculture',
    title: 'Papua Aquaculture Development',
    sector: 'Agriculture',
    province: 'Papua',
    capex: 95,
    score: 59,
    tier: 'development',
    description: 'Integrated seaweed and shrimp aquaculture in Bintuni Bay. Community partnership model. Environmental study in progress.',
    docs: { offtake: false, permits: false, financial: true, esg: false, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 0, financial: 70, esg: 0, sponsor: 75, strategic: 80 },
      { offtake: false, permits: false, financial: true, esg: false, sponsor: true, strategic: true }
    ),
  },
  {
    id: 'north-sumatra-ev-battery',
    title: 'North Sumatra EV Battery Factory',
    sector: 'Digital',
    province: 'Sumatra',
    capex: 1100,
    score: 45,
    tier: 'early-stage',
    description: 'Lithium-iron-phosphate battery cell manufacturing in Batam Free Trade Zone. MoU with Chinese OEM signed. Feasibility study initiated.',
    docs: { offtake: false, permits: false, financial: false, esg: false, sponsor: true, strategic: true },
    criteria: makeCriteria(
      { offtake: 0, permits: 0, financial: 0, esg: 0, sponsor: 72, strategic: 80 },
      { offtake: false, permits: false, financial: false, esg: false, sponsor: true, strategic: true }
    ),
  },
]

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id)
}
