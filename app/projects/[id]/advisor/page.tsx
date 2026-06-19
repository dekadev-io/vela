'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronRight, TrendingUp, Info } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TierBadge } from '@/components/score/TierBadge'
import { ScoreRing } from '@/components/score/ScoreRing'
import { getScoreColor, getTierMeta, computeScoreFromDocs } from '@/lib/utils'
import { getProjectById } from '@/lib/mock-data'
import { notFound } from 'next/navigation'
import { toast } from 'sonner'
import { CRITERIA_DESC } from '@/lib/utils'
import type { CriteriaKey, ScoreCriteria } from '@/lib/types'

export default function AdvisorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = getProjectById(id)
  if (!project) notFound()

  // Local state so marking complete updates score live
  const [completedKeys, setCompletedKeys] = useState<Set<CriteriaKey>>(
    new Set(
      (Object.keys(project.docs) as CriteriaKey[]).filter((k) => project.docs[k])
    )
  )
  const [expandedKey, setExpandedKey] = useState<CriteriaKey | null>(null)

  const liveDocs = Object.fromEntries(
    (Object.keys(project.docs) as CriteriaKey[]).map((k) => [k, completedKeys.has(k)])
  ) as Record<CriteriaKey, boolean>

  const liveScore = computeScoreFromDocs(liveDocs)
  const liveTier = getTierMeta(liveScore)

  const gaps: ScoreCriteria[] = project.criteria
    .map((c) => ({ ...c, hasDoc: completedKeys.has(c.key) }))
    .filter((c) => !c.hasDoc)
    .sort((a, b) => b.gapPoints - a.gapPoints)

  const allDone = gaps.length === 0

  function markComplete(key: CriteriaKey, gapPoints: number) {
    const next = new Set(completedKeys)
    next.add(key)
    setCompletedKeys(next)

    const newScore = computeScoreFromDocs(
      Object.fromEntries(
        (Object.keys(liveDocs) as CriteriaKey[]).map((k) => [k, next.has(k)])
      ) as Record<CriteriaKey, boolean>
    )

    toast.success(`+${gapPoints} pts unlocked`, {
      description: newScore >= 70 && liveScore < 70
        ? '🎉 You\'re now visible to investors!'
        : `Score updated to ${newScore}/100`,
    })

    if (newScore >= 70 && liveScore < 70) {
      setTimeout(() => {
        toast.success('Visible to Investors', {
          description: 'Matched capital providers (IFC, ADB, GCF) can now discover your project.',
          duration: 6000,
        })
      }, 800)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/projects/${project.id}/score`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Back to score
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">Gap Analysis</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Improvement Roadmap</h1>
        <p className="mt-1 text-muted-foreground">{project.title}</p>
      </div>

      {/* Live score + target row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-col items-center gap-2">
          <ScoreRing score={liveScore} size={96} />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Score</span>
        </div>
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl font-extrabold text-primary">70</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Investor Visibility</span>
          {liveScore >= 70 ? (
            <span className="text-xs text-success font-semibold">✓ Reached</span>
          ) : (
            <span className="text-xs text-muted-foreground">Need +{70 - liveScore} pts</span>
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-success/30 bg-success/5 p-5 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl font-extrabold text-success">85</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Investment Ready</span>
          {liveScore >= 85 ? (
            <span className="text-xs text-success font-semibold">✓ Reached</span>
          ) : (
            <span className="text-xs text-muted-foreground">Need +{85 - liveScore} pts</span>
          )}
        </div>
      </div>

      {/* Current tier */}
      <div className="flex items-center gap-3 mb-6">
        <TierBadge score={liveScore} large />
        {liveTier.nextLabel && (
          <>
            <ChevronRight size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {liveTier.nextThreshold! - liveScore} pts to {liveTier.nextLabel}
            </span>
          </>
        )}
      </div>

      {/* Gap items */}
      {allDone ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
          <CheckCircle2 size={40} className="text-success mx-auto mb-3" />
          <h3 className="text-xl font-bold text-success">All Gaps Closed!</h3>
          <p className="mt-2 text-muted-foreground">
            Your project is fully documented and investment-ready.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/projects" className={cn(buttonVariants())}>
              Browse Marketplace
            </Link>
            <Link href={`/projects/${project.id}/score`} className={cn(buttonVariants({ variant: 'outline' }))}>
              View Final Score
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Actions ({gaps.length} remaining)
            </h2>
            <span className="text-xs font-bold text-accent">
              +{gaps.reduce((s, g) => s + g.gapPoints, 0)} pts available
            </span>
          </div>

          {gaps.map((gap, i) => (
            <div
              key={gap.key}
              className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold">{gap.label}</h3>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `color-mix(in oklch, ${getScoreColor(gap.gapPoints * 4)} 15%, transparent)`,
                            color: getScoreColor(gap.gapPoints * 4),
                          }}
                        >
                          +{gap.gapPoints} pts
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{CRITERIA_DESC[gap.key]}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markComplete(gap.key, gap.gapPoints)}
                    className="shrink-0"
                  >
                    Mark complete
                  </Button>
                </div>

                {/* Expandable advice */}
                <button
                  type="button"
                  onClick={() => setExpandedKey(expandedKey === gap.key ? null : gap.key)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Info size={12} />
                  {expandedKey === gap.key ? 'Hide advice' : 'Why this matters'}
                </button>
                {expandedKey === gap.key && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">
                    {gap.advice}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Investor visibility callout */}
      {!allDone && liveScore < 70 && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/8 p-5">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">What happens at score 70?</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Your project becomes discoverable to matched capital providers — IFC, ADB, GCF, and
                family offices — without any outreach needed. The score is your signal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
