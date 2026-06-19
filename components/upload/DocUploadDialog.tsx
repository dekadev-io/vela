'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, Sparkles, FileText, Star, AlertCircle, RotateCcw, ThumbsUp } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  CRITERIA_LABELS, CRITERIA_DESC, cn,
} from '@/lib/utils'
import { runMockAIAnalysis, ANALYSIS_STAGES, type AIDocResult } from '@/lib/ai-mock'
import type { CriteriaKey } from '@/lib/types'

type Phase = 'idle' | 'analyzing' | 'done'
type FeedbackState = 'hidden' | 'open' | 'reanalyzing'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteriaKey: CriteriaKey
  onComplete: (key: CriteriaKey, result: AIDocResult) => void
}

export function DocUploadDialog({ open, onOpenChange, criteriaKey, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [fileRef, setFileRef] = useState<File | null>(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [stageTotal, setStageTotal] = useState(ANALYSIS_STAGES[criteriaKey].length)
  const [result, setResult] = useState<AIDocResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Feedback
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden')
  const [feedbackText, setFeedbackText] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const stages = ANALYSIS_STAGES[criteriaKey]

  function reset() {
    setPhase('idle')
    setFileName('')
    setFileRef(null)
    setStageIndex(0)
    setStageTotal(stages.length)
    setResult(null)
    setIsDragging(false)
    setFeedbackState('hidden')
    setFeedbackText('')
  }

  async function processFile(file: File, withFeedback = false) {
    setFileRef(file)
    setFileName(file.name)
    setPhase('analyzing')
    setFeedbackState('hidden')
    setResult(null)
    setStageIndex(0)

    const totalStages = withFeedback ? stages.length + 1 : stages.length
    setStageTotal(totalStages)

    const res = await runMockAIAnalysis(file, criteriaKey, ({ index, total }) => {
      setStageIndex(index)
      setStageTotal(total)
    }, { withFeedback })

    setResult(res)
    setPhase('done')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleApply() {
    if (!result) return
    onComplete(criteriaKey, result)
    onOpenChange(false)
    setTimeout(reset, 300)
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(reset, 300)
  }

  function handleReanalyze() {
    if (!fileRef || !feedbackText.trim()) return
    setFeedbackState('reanalyzing')
    processFile(fileRef, true)
  }

  function handleReject() {
    reset()
  }

  // Effective stages for display (includes feedback preamble if reanalyzing)
  const displayStages = feedbackState === 'reanalyzing'
    ? ['Incorporating your feedback and context...', ...stages]
    : stages

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" showCloseButton={phase !== 'analyzing'}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">{CRITERIA_LABELS[criteriaKey]}</DialogTitle>
              <p className="text-xs text-muted-foreground">{CRITERIA_DESC[criteriaKey]}</p>
            </div>
          </div>
        </DialogHeader>

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all',
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-primary/5',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.ppt,.pptx"
              onChange={handleFileInput}
            />
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <Upload size={22} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Drop your document here</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PDF, Word, Excel, PowerPoint — AI reads and scores it
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              or click to browse
            </span>
          </div>
        )}

        {/* ── ANALYZING ────────────────────────────────────────────────────── */}
        {phase === 'analyzing' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
              <FileText size={15} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">{fileName}</span>
              {feedbackState === 'reanalyzing' && (
                <span className="text-[10px] text-accent font-semibold shrink-0">With your feedback</span>
              )}
            </div>

            <div className="space-y-1.5">
              {displayStages.map((msg, i) => {
                const done = i < stageIndex
                const active = i === stageIndex
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-400',
                      done && 'opacity-55',
                      active && 'bg-primary/10 ring-1 ring-primary/20',
                      i > stageIndex && 'opacity-20',
                    )}
                  >
                    {done ? (
                      <CheckCircle2 size={14} className="text-success shrink-0" />
                    ) : active ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-border/60 shrink-0" />
                    )}
                    <span className={cn(
                      active && i === 0 && feedbackState === 'reanalyzing'
                        ? 'text-accent font-medium'
                        : active ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {msg}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-[10px] text-muted-foreground animate-pulse">
              {feedbackState === 'reanalyzing' ? 'Re-analyzing with your context...' : 'AI analyzing your document...'}
            </p>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────────────────────── */}
        {phase === 'done' && result && (
          <div className="space-y-4 py-1">
            {/* Score */}
            <div className="flex items-center gap-4 rounded-xl border border-success/30 bg-success/8 px-5 py-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Document Score</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-4xl font-extrabold text-success">{result.docScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-0.5 justify-end mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={12}
                      className={i <= Math.round(result.docScore / 20) ? 'text-amber' : 'text-border'}
                      style={i <= Math.round(result.docScore / 20) ? { fill: 'var(--amber)', color: 'var(--amber)' } : {}}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">AI confidence: {result.confidence}%</p>
              </div>
            </div>

            {/* Key findings */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Key findings</p>
              <ul className="space-y-1.5">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={13} className="text-success mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Feedback bar ─────────────────────────────────────────────── */}
            {feedbackState === 'hidden' && (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground flex-1">Does this look accurate?</p>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 text-xs font-semibold text-success hover:text-success/80 transition-colors"
                >
                  <ThumbsUp size={13} />
                  Looks right
                </button>
                <span className="w-px h-4 bg-border/60" />
                <button
                  type="button"
                  onClick={() => setFeedbackState('open')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AlertCircle size={13} />
                  Something&apos;s off
                </button>
              </div>
            )}

            {/* ── Feedback panel ───────────────────────────────────────────── */}
            {feedbackState === 'open' && (
              <div className="rounded-xl border border-amber/30 bg-amber/6 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  What&apos;s incorrect about this analysis?
                </p>
                <Textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="e.g. The offtake duration is 25 years, not 20. The tariff is variable, not fixed."
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleReanalyze}
                    disabled={!feedbackText.trim()}
                  >
                    <Sparkles size={13} className="mr-1.5" />
                    Re-analyze with feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleReject}
                  >
                    <RotateCcw size={13} className="mr-1.5" />
                    Reject & reupload
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackState('hidden')}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Apply CTA — only show when feedback bar is hidden (user can also click "Looks right" in the bar) */}
            {feedbackState === 'hidden' && (
              <Button className="w-full" onClick={handleApply}>
                Apply to project score
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
