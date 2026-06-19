export type Sector =
  | 'Renewable Energy'
  | 'Infrastructure'
  | 'Tourism'
  | 'Agriculture'
  | 'Water & Sanitation'
  | 'Digital'

export type Province =
  | 'Java'
  | 'Sumatra'
  | 'Bali'
  | 'Kalimantan'
  | 'Sulawesi'
  | 'Papua'

export type BankabilityTier =
  | 'investment-ready'
  | 'near-bankable'
  | 'development'
  | 'early-stage'

export type CriteriaKey =
  | 'offtake'
  | 'permits'
  | 'financial'
  | 'esg'
  | 'sponsor'
  | 'strategic'

export interface ScoreCriteria {
  key: CriteriaKey
  label: string
  weight: number
  score: number
  hasDoc: boolean
  gapPoints: number
  advice: string
}

export interface Project {
  id: string
  title: string
  sector: Sector
  province: Province
  capex: number
  description: string
  score: number
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

export type UploadFormValues = {
  title: string
  sector: Sector
  province: Province
  capex: string
  description: string
  docs: Record<CriteriaKey, boolean>
}
