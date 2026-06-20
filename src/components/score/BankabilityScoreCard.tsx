import { ScoreRing } from './ScoreRing'
import { ScoreBar } from './ScoreBar'
import { TierBadge } from './TierBadge'
import { cn, getScoreColor } from '@/lib/utils'
import type { ScoreCriteria } from '@/lib/utils'

interface ProjectWithCriteria {
  id: string
  score: number
  criteria: ScoreCriteria[]
}

interface BankabilityScoreCardProps {
  project: ProjectWithCriteria
  className?: string
}

export function BankabilityScoreCard({ project, className }: BankabilityScoreCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-xs overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Bankability Score</p>
          <TierBadge score={project.score} large />
        </div>
        <ScoreRing score={project.score} size={88} />
      </div>

      <div className="px-5 pb-4">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.score}%`, background: getScoreColor(project.score) }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>0</span>
          <span className="text-primary text-[9px]">70 ★</span>
          <span className="text-success text-[9px]">85 ★</span>
          <span>100</span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="px-5 py-4 space-y-3">
        {project.criteria.map((c) => (
          <ScoreBar key={c.key} criteria={c} />
        ))}
      </div>
    </div>
  )
}
