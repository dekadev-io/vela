'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Brain, Blend, CheckSquare, Square, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScoreRing } from '@/components/score/ScoreRing'
import { TierBadge } from '@/components/score/TierBadge'
import { DocUploadDialog } from '@/components/upload/DocUploadDialog'
import { AIFirstUpload } from '@/components/upload/AIFirstUpload'
import { ProjectDocUpload } from '@/components/upload/ProjectDocUpload'
import {
  cn,
  computeScoreFromDocs,
  getTierMeta,
  CRITERIA_LABELS,
  CRITERIA_DESC,
  CRITERIA_WEIGHTS,
} from '@/lib/utils'
import type { CriteriaKey, Sector, Province } from '@/lib/types'
import type { AIDocResult, AIExtractedInfo } from '@/lib/ai-mock'

const CRITERIA_KEYS: CriteriaKey[] = ['offtake', 'permits', 'financial', 'esg', 'sponsor', 'strategic']
const BASE_PTS: Record<CriteriaKey, number> = { offtake: 25, permits: 20, financial: 20, esg: 15, sponsor: 10, strategic: 10 }
const SECTORS: Sector[] = ['Renewable Energy', 'Infrastructure', 'Tourism', 'Agriculture', 'Water & Sanitation', 'Digital']
const PROVINCES: Province[] = ['Java', 'Sumatra', 'Bali', 'Kalimantan', 'Sulawesi', 'Papua']

type Mode = 'hybrid' | 'ai-first'

export default function UploadPage() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode | null>(null)

  // Project fields
  const [title, setTitle] = useState('')
  const [sector, setSector] = useState<Sector | ''>('')
  const [province, setProvince] = useState<Province | ''>('')
  const [capex, setCapex] = useState('')
  const [description, setDescription] = useState('')

  // Docs / scoring
  const [docs, setDocs] = useState<Record<CriteriaKey, boolean>>({
    offtake: false, permits: false, financial: false,
    esg: false, sponsor: false, strategic: false,
  })

  // Hybrid mode: which criterion dialog is open + per-doc results
  const [openDialog, setOpenDialog] = useState<CriteriaKey | null>(null)
  const [docResults, setDocResults] = useState<Partial<Record<CriteriaKey, AIDocResult>>>({})

  // Whether AI has filled the project info fields
  const [aiFilledInfo, setAiFilledInfo] = useState(false)

  const score = useMemo(() => computeScoreFromDocs(docs), [docs])
  const tier = getTierMeta(score)
  const topGap = CRITERIA_KEYS.filter(k => !docs[k]).sort((a, b) => BASE_PTS[b] - BASE_PTS[a])[0]

  // Typewriter fill — title gets character-by-character, rest stagger in
  const applyExtractedInfo = useCallback(async (info: AIExtractedInfo) => {
    setAiFilledInfo(true)

    // Title: typewriter
    if (info.title) {
      for (let i = 1; i <= info.title.length; i++) {
        await sleep(28)
        setTitle(info.title.slice(0, i))
      }
    }

    // Description: typewriter (faster)
    const descDelay = info.title ? info.title.length * 28 + 100 : 100
    if (info.description) {
      setTimeout(async () => {
        for (let i = 1; i <= info.description!.length; i++) {
          await sleep(12)
          setDescription(info.description!.slice(0, i))
        }
      }, descDelay)
    }

    // Select fields: stagger reveals
    const base = descDelay
    if (info.sector) setTimeout(() => setSector(info.sector!), base + 200)
    if (info.province) setTimeout(() => setProvince(info.province!), base + 400)
    if (info.capex) setTimeout(() => setCapex(String(info.capex!)), base + 600)
  }, [])

  function handleProjectDocExtracted(info: AIExtractedInfo) {
    applyExtractedInfo(info)
    toast.success('Project details extracted', {
      description: 'Review the auto-filled fields below.',
    })
  }

  function handleProjectDocReset() {
    setTitle('')
    setSector('')
    setProvince('')
    setCapex('')
    setDescription('')
    setAiFilledInfo(false)
  }

  function handleHybridDialogComplete(key: CriteriaKey, result: AIDocResult) {
    setDocs(prev => ({ ...prev, [key]: true }))
    setDocResults(prev => ({ ...prev, [key]: result }))
    toast.success(`+${BASE_PTS[key]} pts unlocked`, {
      description: `${CRITERIA_LABELS[key]} scored ${result.docScore}/100`,
    })
  }

  function handleAIDocComplete(key: CriteriaKey) {
    setDocs(prev => ({ ...prev, [key]: true }))
  }

  function handleAIProjectInfoExtracted(info: AIExtractedInfo) {
    applyExtractedInfo(info)
    toast.success('Project info extracted', {
      description: 'AI detected project details from your documents.',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !sector || !province || !capex) {
      toast.error('Please fill in all required fields.')
      return
    }
    const id =
      title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40) +
      '-' + Date.now().toString(36)

    sessionStorage.setItem(`vela_project_${id}`, JSON.stringify({
      id, title, sector, province, capex: parseFloat(capex), description, score, tier: tier.key, docs,
    }))

    toast.success('Project submitted!')
    router.push(`/projects/${id}/score?draft=1`)
  }

  // ── Mode selection ─────────────────────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">Submit Your Project</h1>
          <p className="mt-2 text-muted-foreground">Choose how you want to get your bankability score</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Hybrid */}
          <button
            type="button"
            onClick={() => setMode('hybrid')}
            className="group flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/60 p-8 text-left hover:border-primary/50 hover:bg-primary/5 transition-all hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="w-12 h-12 rounded-xl border border-border/60 bg-secondary/40 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
              <Blend size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Hybrid</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Upload your pitch deck or feasibility study — AI auto-fills all project fields.
                Then upload bankability documents one by one for AI scoring.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                'Pitch deck auto-fills the form',
                'AI scores each criterion document',
                'Full control over what you share',
              ].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-success shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <span className="text-xs text-primary font-semibold group-hover:underline mt-auto">
              Start hybrid →
            </span>
          </button>

          {/* AI-First */}
          <button
            type="button"
            onClick={() => setMode('ai-first')}
            className="group relative flex flex-col gap-5 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/8 to-transparent p-8 text-left hover:border-primary/60 hover:from-primary/12 transition-all hover:shadow-lg hover:shadow-primary/15"
          >
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/15 px-2 py-0.5 rounded-full">
              Recommended
            </div>
            <div className="w-12 h-12 rounded-xl vela-gradient flex items-center justify-center shadow-md shadow-primary/20">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI-First</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Drop all your documents at once. AI identifies each type, deep-analyzes every file,
                scores all criteria, and fills your project details automatically.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                'Drop everything at once',
                'AI detects each document type',
                'Project info auto-filled from docs',
                'Full score in seconds',
              ].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-accent shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <span className="text-xs vela-gradient-text font-semibold group-hover:underline mt-auto">
              Let AI do the work →
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Submit Your Project</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {mode === 'ai-first' ? 'AI-First — drop docs to auto-score everything' : 'Hybrid — pitch deck fills the form, AI scores each document'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setMode(null); handleProjectDocReset() }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-3 py-1 transition-colors"
        >
          Switch mode
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-5">

            {/* Hybrid: pitch deck → auto-fill */}
            {mode === 'hybrid' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <span className="text-sm font-semibold">Auto-fill from document</span>
                </div>
                <ProjectDocUpload
                  onExtracted={handleProjectDocExtracted}
                  onReset={handleProjectDocReset}
                />
              </div>
            )}

            {/* AI-First dropzone */}
            {mode === 'ai-first' && (
              <AIFirstUpload
                onDocComplete={handleAIDocComplete}
                onProjectInfoExtracted={handleAIProjectInfoExtracted}
                completedKeys={new Set(CRITERIA_KEYS.filter(k => docs[k]))}
              />
            )}

            {/* Project info form */}
            <div className={cn(
              'rounded-2xl border border-border/60 bg-card/60 p-6 space-y-5 transition-all duration-300',
              aiFilledInfo && 'ring-1 ring-primary/25',
            )}>
              <div className="flex items-center justify-between">
                {mode === 'hybrid' && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
                    <span className="text-sm font-semibold">Project Information</span>
                  </div>
                )}
                {mode === 'ai-first' && (
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Project Information</h2>
                )}
                {aiFilledInfo && (
                  <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Brain size={11} />
                    Auto-filled by AI
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Project Title <span className="text-danger">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. North Java Solar Farm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={cn(aiFilledInfo && title && 'border-primary/40 focus-visible:border-primary')}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sector <span className="text-danger">*</span></Label>
                  <Select value={sector} onValueChange={v => setSector(v as Sector)}>
                    <SelectTrigger className={cn(aiFilledInfo && sector && 'border-primary/40')}>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Province <span className="text-danger">*</span></Label>
                  <Select value={province} onValueChange={v => setProvince(v as Province)}>
                    <SelectTrigger className={cn(aiFilledInfo && province && 'border-primary/40')}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capex">Investment Value (USD M) <span className="text-danger">*</span></Label>
                <Input
                  id="capex"
                  type="number"
                  min="1"
                  placeholder="e.g. 250"
                  value={capex}
                  onChange={e => setCapex(e.target.value)}
                  className={cn(aiFilledInfo && capex && 'border-primary/40')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe the project, structure, and commercial terms..."
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={cn(aiFilledInfo && description && 'border-primary/40')}
                />
              </div>
            </div>

            {/* Hybrid: criterion document upload */}
            {mode === 'hybrid' && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <span className="text-sm font-semibold">Upload Bankability Documents</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Click each criterion — upload a document and AI reads, analyzes, and scores it instantly.
                </p>
                <div className="space-y-2.5">
                  {CRITERIA_KEYS.map(key => {
                    const done = docs[key]
                    const result = docResults[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => !done && setOpenDialog(key)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                          done
                            ? 'border-success/40 bg-success/8 cursor-default'
                            : 'border-border/60 bg-background/40 hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
                        )}
                      >
                        {done
                          ? <CheckSquare size={18} className="text-success shrink-0" />
                          : <Square size={18} className="text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn('text-sm font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                              {CRITERIA_LABELS[key]}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {Math.round(CRITERIA_WEIGHTS[key] * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{CRITERIA_DESC[key]}</p>
                          {done && result && (
                            <p className="text-xs text-success font-semibold mt-1">
                              Score {result.docScore}/100 · {result.confidence}% confidence
                            </p>
                          )}
                        </div>
                        {!done && (
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-accent">+{BASE_PTS[key]} pts</span>
                            <span className="text-[10px] text-primary">Upload →</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI-First: criterion coverage grid */}
            {mode === 'ai-first' && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Criterion Coverage
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CRITERIA_KEYS.map(key => (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                        docs[key] ? 'bg-success/15 text-success' : 'bg-secondary/30 text-muted-foreground',
                      )}
                    >
                      {docs[key]
                        ? <CheckCircle2 size={12} />
                        : <span className="w-3 h-3 rounded-full border border-border/60" />}
                      {CRITERIA_LABELS[key].split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Submit Project & View Score
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {/* Live score panel */}
          <div className="md:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Live Bankability Score</h2>

              <div className="flex items-center justify-center py-4">
                <ScoreRing score={score} size={140} />
              </div>
              <div className="flex items-center justify-center">
                <TierBadge score={score} large />
              </div>

              <div className="space-y-2">
                {CRITERIA_KEYS.map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 truncate">{CRITERIA_LABELS[key]}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: docs[key] ? '100%' : '0%',
                          background: docs[key] ? 'var(--success)' : 'transparent',
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold w-10 text-right"
                      style={{ color: docs[key] ? 'var(--success)' : 'var(--muted-foreground)' }}
                    >
                      {docs[key] ? `+${BASE_PTS[key]}` : '0'}
                    </span>
                  </div>
                ))}
              </div>

              {topGap && (
                <div className="rounded-xl border border-accent/30 bg-accent/8 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">
                    Highest impact next
                  </p>
                  <p className="text-sm font-medium">
                    {CRITERIA_LABELS[topGap]} → <span className="text-accent font-bold">+{BASE_PTS[topGap]} pts</span>
                  </p>
                </div>
              )}

              {score >= 70 && (
                <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                  <p className="text-sm font-semibold text-success">✓ Visible to investors</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Capital providers can now discover your project.
                  </p>
                </div>
              )}

              {tier.nextThreshold && (
                <p className="text-center text-xs text-muted-foreground">
                  +{tier.nextThreshold - score} pts to {tier.nextLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Hybrid criterion dialog */}
      {mode === 'hybrid' && openDialog && (
        <DocUploadDialog
          open
          onOpenChange={open => { if (!open) setOpenDialog(null) }}
          criteriaKey={openDialog}
          onComplete={handleHybridDialogComplete}
        />
      )}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
