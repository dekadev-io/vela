import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import type { ScoreCriteria } from '@/lib/utils'

interface ProjectWithCriteria {
  id: string
  score: number
  criteria: ScoreCriteria[]
}

interface GapAnalysisSummaryProps {
  project: ProjectWithCriteria
  limit?: number
  className?: string
  showLink?: boolean
}

export function GapAnalysisSummary({
  project,
  limit = 3,
  className,
  showLink = true,
}: GapAnalysisSummaryProps) {
  const gaps = project.criteria
    .filter((c) => !c.hasDoc)
    .sort((a, b) => b.gapPoints - a.gapPoints)
    .slice(0, limit)

  if (gaps.length === 0) {
    return (
      <div className={cn('rounded-xl border border-success/20 bg-success/8 p-4', className)}>
        <div className="flex items-center gap-2 text-success text-sm font-medium">
          <CheckCircle2 size={15} />
          Fully documented — Investment Ready
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          All six criteria are met. Eligible for DFI and PE term sheets.
        </p>
      </div>
    )
  }

  const totalGapPoints = gaps.reduce((s, g) => s + g.gapPoints, 0)

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-xs overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Top actions</p>
        <span className="text-xs font-medium text-accent">+{totalGapPoints} pts available</span>
      </div>

      <div className="divide-y divide-border">
        {gaps.map((g) => (
          <div key={g.key} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-muted-foreground">{g.label}</span>
            <span className="text-xs font-semibold text-accent shrink-0">+{g.gapPoints} pts</span>
          </div>
        ))}
      </div>

      {showLink && (
        <div className="px-4 py-3 border-t border-border">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View full roadmap <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}
