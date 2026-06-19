'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { cn, getScoreColor } from '@/lib/utils'
import type { ScoreCriteria } from '@/lib/types'

interface ScoreBarProps {
  criteria: ScoreCriteria
  className?: string
}

export function ScoreBar({ criteria, className }: ScoreBarProps) {
  const color = criteria.hasDoc ? getScoreColor(criteria.score) : 'var(--danger)'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {criteria.hasDoc ? (
            <CheckCircle2 size={14} className="text-success shrink-0" />
          ) : (
            <XCircle size={14} className="text-danger shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground truncate">{criteria.label}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {Math.round(criteria.weight * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {criteria.hasDoc ? (
            <span className="text-sm font-semibold tabular-nums" style={{ color }}>
              {criteria.score}
            </span>
          ) : (
            <span className="text-xs text-danger font-semibold">
              +{criteria.gapPoints} pts
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden ring-1 ring-border/60">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${criteria.hasDoc ? criteria.score : 0}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}
