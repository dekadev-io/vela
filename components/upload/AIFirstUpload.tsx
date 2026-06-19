'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, Sparkles, FileText, Brain, Zap } from 'lucide-react'
import { cn, CRITERIA_LABELS, getScoreColor } from '@/lib/utils'
import {
  runMockAIAnalysis,
  detectCriteriaFromFilename,
  ANALYSIS_STAGES,
  type AIDocResult,
  type AIExtractedInfo,
} from '@/lib/ai-mock'
import type { CriteriaKey, Sector, Province } from '@/lib/types'
import { toast } from 'sonner'

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

    // Stage 1: detecting type
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
      // Stagger processing starts
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
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border/50 bg-secondary/10 hover:border-primary/40 hover:bg-primary/5',
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
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-primary/15 backdrop-blur-sm">
            <p className="text-primary font-bold text-lg">Release to analyze</p>
          </div>
        )}
      </div>

      {/* Processing cards */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4">
          <p className="text-xs text-muted-foreground text-center">
            Documents you upload will appear here with real-time AI analysis
          </p>
        </div>
      )}
    </div>
  )
}

function FileCard({ item }: { item: FileItem }) {
  const stages = item.detectedKey ? ANALYSIS_STAGES[item.detectedKey] : []
  const currentStage = stages[item.stageIndex] ?? ''

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        item.status === 'done' ? 'border-success/30 bg-success/5' : 'border-border/60 bg-card/60',
        item.status === 'error' && 'border-danger/30 bg-danger/5',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          item.status === 'done' ? 'bg-success/20' : 'bg-primary/10',
        )}>
          {item.status === 'done' ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : item.status === 'detecting' || item.status === 'analyzing' ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <FileText size={16} className="text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{item.file.name}</span>
            {item.detectedKey && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                {CRITERIA_LABELS[item.detectedKey]}
              </span>
            )}
          </div>

          <div className="mt-1">
            {item.status === 'queued' && (
              <p className="text-xs text-muted-foreground">Queued for analysis...</p>
            )}
            {item.status === 'detecting' && (
              <p className="text-xs text-primary animate-pulse">Detecting document type...</p>
            )}
            {item.status === 'analyzing' && currentStage && (
              <p className="text-xs text-muted-foreground">{currentStage}</p>
            )}
            {item.status === 'done' && item.result && (
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-xs font-bold"
                  style={{ color: getScoreColor(item.result.docScore) }}
                >
                  Document score: {item.result.docScore}/100
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.result.confidence}% confidence
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage mini-progress bar when analyzing */}
      {item.status === 'analyzing' && item.detectedKey && (
        <div className="mt-3">
          <div className="h-1 rounded-full bg-secondary/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${((item.stageIndex + 1) / stages.length) * 100}%` }}
            />
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
