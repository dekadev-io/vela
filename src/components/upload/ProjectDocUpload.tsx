import { useState, useRef } from 'react'
import { FileText, CheckCircle2, Wand2, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { runProjectDocAnalysis, PROJECT_DOC_STAGES, type AIExtractedInfo } from '@/lib/ai-mock'

type Phase = 'idle' | 'analyzing' | 'done'

interface Props {
  onExtracted: (info: AIExtractedInfo) => void
  onReset: () => void
}

export function ProjectDocUpload({ onExtracted, onReset }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [stageIndex, setStageIndex] = useState(0)
  const [extracted, setExtracted] = useState<AIExtractedInfo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setFileName(file.name)
    setFileSize(formatSize(file.size))
    setPhase('analyzing')
    setStageIndex(0)

    const info = await runProjectDocAnalysis(file, ({ index }) => setStageIndex(index))
    setExtracted(info)
    setPhase('done')
    onExtracted(info)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleReset() {
    setPhase('idle')
    setFileName('')
    setFileSize('')
    setStageIndex(0)
    setExtracted(null)
    onReset()
  }

  if (phase === 'idle') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/12 scale-[1.01]'
            : 'border-primary/30 bg-primary/4 hover:border-primary/60 hover:bg-primary/8',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={handleInput}
        />
        <div className="w-12 h-12 rounded-xl vela-gradient flex items-center justify-center shadow-md shadow-primary/20">
          <Wand2 size={20} className="text-white" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            Upload pitch deck or feasibility study
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI reads your document and fills all project fields automatically
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
          PDF · Word · PowerPoint
        </span>
        {isDragging && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-primary/15">
            <p className="text-primary font-bold">Release to analyze</p>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <FileText size={16} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          </div>
          <span className="text-xs text-primary animate-pulse font-semibold">Reading...</span>
        </div>

        <div className="space-y-2">
          {PROJECT_DOC_STAGES.map((msg, i) => {
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
                  <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                )}
                <span className={cn(
                  active ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {msg}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-success/25 bg-success/6 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" />
          <span className="text-sm font-semibold text-success">Project details extracted</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw size={11} />
          Upload different file
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
        <FileText size={15} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate">{fileName}</span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">{fileSize}</span>
      </div>

      {extracted && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
          {extracted.title && <ExtractedField label="Title" value={extracted.title} />}
          {extracted.sector && <ExtractedField label="Sector" value={extracted.sector} />}
          {extracted.province && <ExtractedField label="Province" value={extracted.province} />}
          {extracted.capex && <ExtractedField label="Investment" value={`$${extracted.capex}M USD`} />}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
        <span className="text-[11px] text-muted-foreground flex-1">
          All fields are editable — correct anything AI got wrong.
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-danger transition-colors shrink-0"
        >
          <AlertCircle size={11} />
          Reject & reupload
        </button>
      </div>
    </div>
  )
}

function ExtractedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
