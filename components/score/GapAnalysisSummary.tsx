'use client'

import { ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'
import Link from 'next/link'

interface GapAnalysisSummaryProps {
  project: Project
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
      <div className={cn('rounded-2xl border border-success/30 bg-success/10 p-5', className)}>
        <div className="flex items-center gap-2 text-success font-semibold">
          <TrendingUp size={16} />
          Fully documented — Investment Ready
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          All six bankability criteria are substantiated. Ready for investor term sheet.
        </p>
      </div>
    )
  }

  const totalGapPoints = gaps.reduce((s, g) => s + g.gapPoints, 0)

  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card/60 p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
          Top Improvement Actions
        </p>
        <span className="text-xs font-semibold text-accent">+{totalGapPoints} pts available</span>
      </div>

      <div className="space-y-2">
        {gaps.map((g) => (
          <div
            key={g.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2"
          >
            <span className="text-sm text-foreground">{g.label}</span>
            <span className="text-xs font-bold text-accent shrink-0">+{g.gapPoints} pts</span>
          </div>
        ))}
      </div>

      {showLink && (
        <Link
          href={`/projects/${project.id}/advisor`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View full roadmap <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
