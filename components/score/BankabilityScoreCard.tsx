'use client'

import { ScoreRing } from './ScoreRing'
import { ScoreBar } from './ScoreBar'
import { TierBadge } from './TierBadge'
import { cn, getScoreColor } from '@/lib/utils'
import type { Project } from '@/lib/types'

interface BankabilityScoreCardProps {
  project: Project
  className?: string
}

export function BankabilityScoreCard({ project, className }: BankabilityScoreCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Bankability Score
          </p>
          <TierBadge score={project.score} large className="mt-1.5" />
        </div>
        <ScoreRing score={project.score} size={96} />
      </div>

      <div className="h-px bg-border/50" />

      <div className="space-y-3">
        {project.criteria.map((c) => (
          <ScoreBar key={c.key} criteria={c} />
        ))}
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(88% .04 300)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${project.score}%`, background: getScoreColor(project.score) }}
        />
      </div>
    </div>
  )
}
