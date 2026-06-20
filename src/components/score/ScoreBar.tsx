import { CheckCircle2, Circle } from 'lucide-react'
import { cn, getScoreColor } from '@/lib/utils'
import type { ScoreCriteria } from '@/lib/utils'

interface ScoreBarProps {
  criteria: ScoreCriteria
  className?: string
}

export function ScoreBar({ criteria, className }: ScoreBarProps) {
  const color = criteria.hasDoc ? getScoreColor(criteria.score) : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2">
        {criteria.hasDoc ? (
          <CheckCircle2 size={13} className="text-success shrink-0" />
        ) : (
          <Circle size={13} className="text-border shrink-0" />
        )}
        <span className={cn('text-sm flex-1 truncate', criteria.hasDoc ? 'text-foreground' : 'text-muted-foreground')}>
          {criteria.label}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {Math.round(criteria.weight * 100)}%
        </span>
        {criteria.hasDoc ? (
          <span className="text-sm font-semibold tabular-nums shrink-0 w-7 text-right" style={{ color }}>
            {criteria.score}
          </span>
        ) : (
          <span className="text-xs font-medium text-accent shrink-0 w-14 text-right">
            +{criteria.gapPoints} pts
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${criteria.hasDoc ? criteria.score : 0}%`,
            background: color ?? 'transparent',
          }}
        />
      </div>
    </div>
  )
}
