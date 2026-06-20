import { useState, useRef, useEffect } from 'react'
import {
  Upload, CheckCircle2, Sparkles, FileText, Brain, Zap,
  ChevronDown, MessageSquare, CheckCircle, AlertTriangle,
  XCircle, Send, X, BookOpen, Bot,
} from 'lucide-react'
import { cn, CRITERIA_LABELS, getScoreColor } from '@/lib/utils'
import {
  runMockAIAnalysis,
  detectCriteriaFromFilename,
  ANALYSIS_STAGES,
  FRAMEWORK_REFS,
  FEEDBACK_RESPONSES,
  type AIDocResult,
  type AIExtractedInfo,
  type ChecklistItem,
} from '@/lib/ai-mock'
import type { CriteriaKey } from '@/lib/scoring'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

async function streamWords(
  text: string,
  onChunk: (partial: string) => void,
  delayMs = 18,
) {
  const words = text.split(' ')
  let built = ''
  for (const word of words) {
    built += (built ? ' ' : '') + word
    onChunk(built)
    await new Promise<void>((r) => setTimeout(r, delayMs))
  }
}

function renderEvidence(text: string, onHighlightClick?: (phrase: string, rect: DOMRect) => void) {
  const parts = text.split(/(\[\[.*?\]\])/g)
  return parts.map((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const phrase = part.slice(2, -2)
      return (
        <mark
          key={i}
          onClick={onHighlightClick ? (e) => {
            e.stopPropagation()
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            onHighlightClick(phrase, rect)
          } : undefined}
          className={cn(
            'bg-amber-200/70 text-amber-900 rounded-sm px-0.5 not-italic',
            onHighlightClick && 'cursor-pointer underline decoration-amber-500/50 decoration-dashed hover:bg-amber-300/70 transition-colors',
          )}
          title={onHighlightClick ? 'Click to clarify this specific point' : undefined}
        >
          {phrase}
        </mark>
      )
    }
    return <span key={i}>{part}</span>
  })
}

type FileStatus = 'queued' | 'detecting' | 'analyzing' | 'done' | 'error'

interface FileItem {
  id: string
  file: File
  status: FileStatus
  detectedKey: CriteriaKey | null
  stageIndex: number
  result: AIDocResult | null
}

interface Props {
  onDocComplete: (key: CriteriaKey) => void
  onProjectInfoExtracted: (info: AIExtractedInfo) => void
  completedKeys: Set<CriteriaKey>
}

const ALL_KEYS: CriteriaKey[] = ['offtake', 'permits', 'financial', 'esg', 'sponsor', 'strategic']

export function AIFirstUpload({ onDocComplete, onProjectInfoExtracted, completedKeys }: Props) {
  const [items, setItems] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [infoExtracted, setInfoExtracted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const processingRef = useRef<Set<string>>(new Set())

  function getNextUnassignedKey(current: FileItem[]): CriteriaKey {
    const usedKeys = new Set([
      ...current.filter(i => i.detectedKey).map(i => i.detectedKey!),
      ...completedKeys,
    ])
    return ALL_KEYS.find(k => !usedKeys.has(k)) ?? ALL_KEYS[0]
  }

  async function processFile(item: FileItem, allItems: FileItem[]) {
    if (processingRef.current.has(item.id)) return
    processingRef.current.add(item.id)

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'detecting' } : i))
    await sleep(600)

    const detected = detectCriteriaFromFilename(item.file.name)
    const key = detected ?? getNextUnassignedKey(allItems)

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing', detectedKey: key } : i))

    try {
      const result = await runMockAIAnalysis(item.file, key, ({ index }) => {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, stageIndex: index } : i))
      })

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', result } : i))
      onDocComplete(key)

      if (!infoExtracted && Object.keys(result.extractedInfo).length > 0) {
        setInfoExtracted(true)
        onProjectInfoExtracted(result.extractedInfo)
        toast.success('Project info extracted', {
          description: 'AI detected project details from your documents.',
        })
      }

      toast.success(`+${getKeyPoints(key)} pts unlocked`, {
        description: `${CRITERIA_LABELS[key]} analyzed — score updated.`,
      })
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i))
    }

    processingRef.current.delete(item.id)
  }

  function addFiles(files: File[]) {
    const newItems: FileItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'queued',
      detectedKey: null,
      stageIndex: 0,
      result: null,
    }))

    setItems(prev => {
      const next = [...prev, ...newItems]
      newItems.forEach((item, i) => {
        setTimeout(() => processFile(item, next), i * 400)
      })
      return next
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) addFiles(files)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border bg-secondary hover:border-primary/40 hover:bg-primary/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.ppt,.pptx"
          onChange={handleInput}
        />
        <div className="w-16 h-16 rounded-2xl vela-gradient flex items-center justify-center shadow-lg shadow-primary/25">
          <Brain size={28} className="text-white" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">Drop all your project documents</p>
          <p className="text-sm text-muted-foreground mt-1">
            AI will identify each document type, analyze it, and score your project automatically
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles size={12} className="text-accent" />
          <span>PDF · Word · Excel · PowerPoint — multiple files accepted</span>
        </div>
        {isDragging && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-primary/15">
            <p className="text-primary font-bold text-lg">Release to analyze</p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              AI Processing ({items.filter(i => i.status === 'done').length}/{items.length} complete)
            </p>
            {items.some(i => i.status !== 'done' && i.status !== 'error') && (
              <span className="flex items-center gap-1.5 text-xs text-primary animate-pulse">
                <Zap size={11} />
                Analyzing...
              </span>
            )}
          </div>
          {items.map(item => (
            <FileCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary p-4">
          <p className="text-xs text-muted-foreground text-center">
            Documents you upload will appear here with real-time AI analysis
          </p>
        </div>
      )}
    </div>
  )
}

function ChecklistRow({
  item, onHighlightClick,
}: { item: ChecklistItem; onHighlightClick?: (phrase: string, rect: DOMRect) => void }) {
  const [expanded, setExpanded] = useState(false)
  const expandable = (item.status === 'warn' || item.status === 'fail') && (item.concern || item.evidence)

  return (
    <div className={cn(
      'border-b border-border/50 last:border-0',
      expanded && item.status === 'warn' && 'bg-amber-50/40 rounded-lg border border-amber-200/50 mb-1 last:mb-0',
      expanded && item.status === 'fail' && 'bg-destructive/5 rounded-lg border border-destructive/20 mb-1 last:mb-0',
    )}>
      <button
        type="button"
        onClick={() => expandable && setExpanded(v => !v)}
        className={cn(
          'w-full flex items-start gap-2 py-1.5 text-left',
          expandable ? 'cursor-pointer' : 'cursor-default',
          expanded ? 'px-2 pt-2' : '',
        )}
      >
        {item.status === 'pass' && <CheckCircle size={12} className="text-success shrink-0 mt-0.5" />}
        {item.status === 'warn' && <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />}
        {item.status === 'fail' && <XCircle size={12} className="text-destructive shrink-0 mt-0.5" />}
        <span className={cn(
          'text-[11px] leading-snug flex-1',
          item.status === 'pass' && 'text-foreground',
          item.status === 'warn' && 'text-amber-700 font-medium',
          item.status === 'fail' && 'text-destructive font-medium',
        )}>
          {item.label}
        </span>
        {expandable && (
          <ChevronDown size={11} className={cn(
            'shrink-0 text-muted-foreground/60 transition-transform duration-150 mt-0.5',
            expanded && 'rotate-180',
          )} />
        )}
      </button>

      {expanded && expandable && (
        <div className="px-2 pb-2.5 space-y-2.5">
          {item.concern && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">AI Concern</p>
              <p className="text-[11px] text-foreground/80 leading-relaxed">{item.concern}</p>
            </div>
          )}
          {item.evidence && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Document Reference</p>
                {onHighlightClick && (
                  <p className="text-[9px] text-amber-600/70 italic">click highlighted text to clarify</p>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/70 bg-background rounded-md px-2.5 py-2 border border-border/60 italic">
                {renderEvidence(item.evidence, onHighlightClick)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type FeedbackPhase = 'input' | 'streaming' | 'done'

function FeedbackPopover({
  criteriaKey, onClose, prefillText, anchor,
}: { criteriaKey: CriteriaKey; onClose: () => void; prefillText?: string; anchor?: DOMRect }) {
  const [phase, setPhase] = useState<FeedbackPhase>('input')
  const [text, setText] = useState(() => prefillText ?? '')
  const [userMsg, setUserMsg] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (phase === 'input' && prefillText !== undefined) {
      setText(prefillText)
      textareaRef.current?.focus()
    }
  }, [prefillText, phase])

  useEffect(() => {
    if (phase !== 'input') return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [phase, onClose])

  async function handleSubmit() {
    if (!text.trim()) return
    const msg = text.trim()
    setUserMsg(msg)
    setText('')
    setPhase('streaming')
    const fullResponse = FEEDBACK_RESPONSES[criteriaKey]
    await streamWords(fullResponse, partial => setAiResponse(partial), 16)
    setPhase('done')
  }

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
  const shortcutHint = isMac ? '⌘↵' : 'Ctrl+↵'

  const anchorStyle: React.CSSProperties | undefined = anchor ? (() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800
    const showAbove = anchor.top > 240
    return {
      position: 'fixed',
      top: showAbove ? anchor.top - 8 : anchor.bottom + 8,
      transform: showAbove ? 'translateY(-100%)' : undefined,
      left: Math.max(8, Math.min(anchor.left, vw - 328)),
    }
  })() : undefined

  return (
    <div
      ref={ref}
      style={anchorStyle}
      className={cn(
        'w-80 z-50 rounded-xl border border-border bg-card shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden',
        !anchor && 'absolute bottom-full right-0 mb-2',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={12} className="text-muted-foreground" />
          <p className="text-xs font-semibold">
            {phase === 'input' ? 'Clarify or request revision' : 'AI is reviewing…'}
          </p>
        </div>
        {phase !== 'streaming' && (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      {phase === 'input' && (
        <div className="p-3 space-y-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ask AI to clarify its assessment or provide additional context about this document.
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="e.g., The tariff escalation clause in Annex 3B is CPI-linked — please re-evaluate."
            className="w-full rounded-lg border border-border bg-background text-xs px-2.5 py-2 min-h-[72px] max-h-[240px] resize-y outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/50 leading-relaxed"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50">{shortcutHint} to send</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-3 text-xs rounded-lg"
                disabled={!text.trim()}
                onClick={handleSubmit}
              >
                <Send size={10} className="mr-1" /> Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {(phase === 'streaming' || phase === 'done') && (
        <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-[11px] leading-relaxed">
              {userMsg}
            </div>
          </div>

          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={10} className="text-white" />
            </div>
            <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted/50 border border-border px-3 py-2 text-[11px] leading-relaxed text-foreground">
              {aiResponse}
              {phase === 'streaming' && (
                <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5 align-middle opacity-60" />
              )}
            </div>
          </div>

          {phase === 'done' && (
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1 text-[10px] text-success font-medium">
                <CheckCircle size={10} /> Analysis context updated
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-2.5 py-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InternalScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-amber-500' : 'bg-destructive'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">{score}%</span>
    </div>
  )
}

function FileCard({ item }: { item: FileItem }) {
  const [expanded, setExpanded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackPrefill, setFeedbackPrefill] = useState<string | undefined>(undefined)
  const [feedbackAnchor, setFeedbackAnchor] = useState<DOMRect | undefined>(undefined)
  const stages = item.detectedKey ? ANALYSIS_STAGES[item.detectedKey] : []
  const currentStage = stages[item.stageIndex] ?? ''
  const isDone = item.status === 'done' && item.result

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      isDone ? 'border-success/25 bg-success/5' : 'border-border bg-card shadow-xs',
      item.status === 'error' && 'border-destructive/30 bg-destructive/5',
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          isDone ? 'bg-success/15' : 'bg-primary/10',
        )}>
          {isDone ? (
            <CheckCircle2 size={15} className="text-success" />
          ) : (item.status === 'detecting' || item.status === 'analyzing') ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <FileText size={15} className="text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold truncate">{item.file.name}</span>
            {item.detectedKey && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/12 text-primary shrink-0">
                {CRITERIA_LABELS[item.detectedKey]}
              </span>
            )}
          </div>

          <div className="mt-1">
            {item.status === 'queued' && (
              <p className="text-[11px] text-muted-foreground">Queued for analysis…</p>
            )}
            {item.status === 'detecting' && (
              <p className="text-[11px] text-primary animate-pulse">Detecting document type…</p>
            )}
            {item.status === 'analyzing' && currentStage && (
              <p className="text-[11px] text-muted-foreground">{currentStage}</p>
            )}
            {isDone && item.result && (
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-xs font-bold tabular-nums" style={{ color: getScoreColor(item.result.docScore) }}>
                  {item.result.docScore}/100
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.result.confidence}% confidence
                </span>
              </div>
            )}
          </div>

          {isDone && item.result && (
            <div className="mt-2">
              <InternalScoreBar score={item.result.docScore} />
            </div>
          )}
        </div>

        {isDone && (
          <div className="flex items-center gap-1 shrink-0 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFeedback(v => !v)}
                title="Clarify or request revision"
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  showFeedback
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                <MessageSquare size={13} />
              </button>
              {showFeedback && item.detectedKey && (
                <FeedbackPopover
                  criteriaKey={item.detectedKey}
                  onClose={() => { setShowFeedback(false); setFeedbackPrefill(undefined); setFeedbackAnchor(undefined) }}
                  prefillText={feedbackPrefill}
                  anchor={feedbackAnchor}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              title={expanded ? 'Collapse' : 'Expand details'}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronDown size={13} className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
            </button>
          </div>
        )}
      </div>

      {item.status === 'analyzing' && item.detectedKey && (
        <div className="px-4 pb-4 -mt-2">
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${((item.stageIndex + 1) / stages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {expanded && isDone && item.result && item.detectedKey && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              AI Scoring Rationale
            </p>
            <div className="rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-[11px] text-foreground leading-relaxed">
                {item.result.reasoning}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Framework Checklist
              </p>
              <div className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5">
                <BookOpen size={9} className="text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground font-medium">
                  {FRAMEWORK_REFS[item.detectedKey]}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-1">
              {item.result.checklistItems.map((ci, i) => (
                <ChecklistRow
                  key={i}
                  item={ci}
                  onHighlightClick={(phrase, rect) => {
                    setFeedbackPrefill(`Regarding the highlighted concern: "${phrase}" — `)
                    setFeedbackAnchor(rect)
                    setShowFeedback(true)
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <span className="flex items-center gap-1 text-[10px] text-success font-medium">
                <CheckCircle size={10} />
                {item.result.checklistItems.filter(c => c.status === 'pass').length} passed
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                <AlertTriangle size={10} />
                {item.result.checklistItems.filter(c => c.status === 'warn').length} need attention
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Key Findings
            </p>
            <ul className="space-y-1">
              {item.result.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-foreground leading-snug">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0 mt-1.5" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function getKeyPoints(key: CriteriaKey): number {
  const pts: Record<CriteriaKey, number> = {
    offtake: 25, permits: 20, financial: 20, esg: 15, sponsor: 10, strategic: 10,
  }
  return pts[key]
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
