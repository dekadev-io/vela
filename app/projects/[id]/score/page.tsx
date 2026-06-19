'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScoreRing } from '@/components/score/ScoreRing'
import { TierBadge } from '@/components/score/TierBadge'
import { ScoreBar } from '@/components/score/ScoreBar'
import { getScoreColor, getTierMeta } from '@/lib/utils'
import { getProjectById } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

export default function ScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = getProjectById(id)

  if (!project) notFound()

  const tier = getTierMeta(project.score)
  const gaps = project.criteria.filter((c) => !c.hasDoc)
  const allComplete = gaps.length === 0

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Marketplace
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground truncate">{project.title}</span>
      </div>

      {/* Hero score card */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreRing score={project.score} size={140} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Bankability Score
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{project.title}</h1>
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <TierBadge score={project.score} large />
              <span className="text-sm text-muted-foreground">{project.sector} · {project.province}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg">{project.description}</p>

            {tier.nextThreshold && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold">
                +{tier.nextThreshold - project.score} pts to {tier.nextLabel}
              </div>
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Overall bankability</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: getScoreColor(project.score) }}>
              {project.score} / 100
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary/80 overflow-hidden ring-1 ring-border/60">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${project.score}%`, background: getScoreColor(project.score) }}
            />
          </div>
          {/* Tier markers */}
          <div className="relative mt-1 flex text-[9px] text-muted-foreground">
            <span style={{ left: '50%' }} className="absolute -translate-x-1/2">50</span>
            <span style={{ left: '70%' }} className="absolute -translate-x-1/2">70 ★</span>
            <span style={{ left: '85%' }} className="absolute -translate-x-1/2">85 ★</span>
          </div>
        </div>
      </div>

      {/* Criterion breakdown */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
          Criterion Breakdown
        </h2>
        <div className="space-y-5">
          {project.criteria.map((c) => (
            <ScoreBar key={c.key} criteria={c} />
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-center">
          <div className="text-2xl font-extrabold" style={{ color: getScoreColor(project.score) }}>
            {project.criteria.filter((c) => c.hasDoc).length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Criteria met</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-center">
          <div className="text-2xl font-extrabold text-danger">{gaps.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Gaps remaining</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-center">
          <div className="text-2xl font-extrabold text-accent">
            {gaps.reduce((s, g) => s + g.gapPoints, 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pts available</div>
        </div>
      </div>

      {/* CTA */}
      {allComplete ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
          <h3 className="text-lg font-bold text-success">Fully Documented — Investment Ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All six criteria are met. This project is eligible for term sheets with DFIs and PE funds.
          </p>
          <Link href="/projects" className={cn(buttonVariants(), 'mt-4')}>
            Browse Marketplace →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/projects/${project.id}/advisor`} className={cn(buttonVariants({ size: 'lg' }), 'flex-1 justify-center')}>
            View Improvement Roadmap <ArrowRight size={16} className="ml-2" />
          </Link>
          <Link href="/projects" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            Back to Marketplace
          </Link>
        </div>
      )}
    </div>
  )
}
