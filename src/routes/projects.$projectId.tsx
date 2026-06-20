import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, MapPin, FileCheck2, FileX2, Sparkles, Send,
  Building2, DollarSign, Lightbulb, ScanSearch, Bot,
  AlertTriangle, AlertCircle, Info, RotateCcw,
  ChevronDown, MessageSquare, CheckCircle, XCircle, X,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { CRITERIA, getBand, bandColorVar, type CriteriaKey } from "@/lib/scoring";
import { aiSummary, aiRecommendations, type Project } from "@/lib/data";
import { BandBadge, ScoreBar } from "@/components/score";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GAP_SCAN_REPORTS,
  GAP_SCAN_STAGES,
  scanVerdict,
  streamWords,
  ADVISOR_RESPONSES,
  ADVISOR_QUICK_PROMPTS,
  CRITERION_AI_DETAILS,
  FEEDBACK_RESPONSES,
  type AdvisorPromptSlug,
} from "@/lib/ai-mock";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetail,
  notFoundComponent: () => <NotFound />,
});

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">Project not found</h1>
      <Link to="/projects" className="mt-4 inline-block text-primary-foreground underline">Back to projects</Link>
    </main>
  );
}

// ─── Shared: evidence renderer + feedback popover ────────────────────────────

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
      position: 'fixed' as const,
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
            Ask AI to clarify its assessment or provide additional context about this criterion.
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
            }}
            placeholder="e.g., The escalation clause in Annex 3B is CPI-linked — please re-evaluate."
            className="w-full rounded-lg border border-border bg-background text-xs px-2.5 py-2 min-h-[72px] max-h-[240px] resize-y outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/50 leading-relaxed"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50">{shortcutHint} to send</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <Button type="button" size="sm" className="h-7 px-3 text-xs rounded-lg" disabled={!text.trim()} onClick={handleSubmit}>
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
              <button type="button" onClick={onClose} className="text-xs px-2.5 py-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CriterionDetailRow({ criterionKey, label, weight, present }: {
  criterionKey: CriteriaKey
  label: string
  weight: number
  present: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackPrefill, setFeedbackPrefill] = useState<string | undefined>(undefined)
  const [feedbackAnchor, setFeedbackAnchor] = useState<DOMRect | undefined>(undefined)

  const detail = CRITERION_AI_DETAILS[criterionKey][present ? 'present' : 'missing']
  const sub = present ? 85 : 28
  const expandable = detail.status !== 'pass' || !!detail.evidence

  const statusIcon = detail.status === 'pass'
    ? <CheckCircle size={13} className="text-success shrink-0 mt-0.5" />
    : detail.status === 'warn'
    ? <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
    : <XCircle size={13} className="text-destructive shrink-0 mt-0.5" />

  return (
    <div className={cn(
      'rounded-lg border transition-all',
      expanded && detail.status === 'warn' && 'border-amber-200/60 bg-amber-50/30',
      expanded && detail.status === 'fail' && 'border-destructive/20 bg-destructive/5',
      !expanded && 'border-border/50 bg-background/40',
    )}>
      {/* Row header */}
      <button
        type="button"
        onClick={() => expandable && setExpanded(v => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 text-left',
          expandable ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {statusIcon}
        <span className={cn(
          'flex-1 text-sm font-medium',
          detail.status === 'pass' && 'text-foreground',
          detail.status === 'warn' && 'text-amber-700',
          detail.status === 'fail' && 'text-destructive',
        )}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{weight}%</span>
        <span className="text-xs tabular-nums font-semibold w-8 text-right" style={{ color: bandColorVar(sub) }}>{sub}</span>
        {expandable && (
          <ChevronDown size={13} className={cn(
            'text-muted-foreground/60 transition-transform duration-150 shrink-0',
            expanded && 'rotate-180',
          )} />
        )}
      </button>

      {/* Score bar */}
      <div className="px-3 pb-2 -mt-1">
        <ScoreBar score={sub} />
      </div>

      {/* Expanded content */}
      {expanded && expandable && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
          {/* AI concern */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">AI Assessment</p>
            <p className="text-[11px] text-foreground/80 leading-relaxed">{detail.concern}</p>
          </div>

          {/* Evidence with highlights */}
          {detail.evidence && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Document Reference</p>
                <p className="text-[9px] text-amber-600/70 italic">click highlighted text to clarify</p>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/70 bg-background rounded-md px-2.5 py-2 border border-border/60 italic">
                {renderEvidence(detail.evidence, (phrase, rect) => {
                  setFeedbackPrefill(`Regarding the highlighted concern: "${phrase}" — `)
                  setFeedbackAnchor(rect)
                  setShowFeedback(true)
                })}
              </p>
            </div>
          )}

          {/* Feedback CTA */}
          <div className="relative flex items-center justify-end">
            <button
              type="button"
              onClick={() => { setShowFeedback(v => !v); setFeedbackAnchor(undefined) }}
              className={cn(
                'flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 border transition-colors',
                showFeedback
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary',
              )}
            >
              <MessageSquare size={11} />
              Clarify or request revision
            </button>
            {showFeedback && (
              <FeedbackPopover
                criteriaKey={criterionKey}
                onClose={() => { setShowFeedback(false); setFeedbackPrefill(undefined); setFeedbackAnchor(undefined) }}
                prefillText={feedbackPrefill}
                anchor={feedbackAnchor}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Feature 1: Bankability Gap Scan ─────────────────────────────────────────

type ScanState = "idle" | "scanning" | "complete";

function priorityColor(priority: "Critical" | "High" | "Medium"): string {
  if (priority === "Critical") return "var(--danger)";
  if (priority === "High") return "var(--amber)";
  return "var(--accent)";
}

function priorityIcon(priority: "Critical" | "High" | "Medium") {
  if (priority === "Critical") return <AlertTriangle size={14} />;
  if (priority === "High") return <AlertCircle size={14} />;
  return <Info size={14} />;
}

function BankabilityGapScan({ p }: { p: Project }) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [finalising, setFinalising] = useState(false);
  const cancelRef = useRef(false);

  const missingCriteria = CRITERIA.filter((c) => !p.docs[c.key]) as {
    key: CriteriaKey;
    label: string;
    weight: number;
    description: string;
  }[];

  async function runScan() {
    if (scanState === "scanning") return;
    cancelRef.current = false;
    setScanState("scanning");
    setStageIndex(0);
    setFinalising(false);

    for (let i = 0; i < GAP_SCAN_STAGES.length - 1; i++) {
      if (cancelRef.current) return;
      setStageIndex(i);
      await new Promise<void>((r) => setTimeout(r, 600));
    }
    setFinalising(true);
    setStageIndex(GAP_SCAN_STAGES.length - 1);
    await new Promise<void>((r) => setTimeout(r, 1000));
    if (!cancelRef.current) setScanState("complete");
  }

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const verdict = scanVerdict(p.score, missingCriteria.length);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: "var(--primary)" }}>
        <ScanSearch size={14} />
        Full Bankability Gap Scan
      </div>

      {/* Idle state */}
      {scanState === "idle" && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI analyses every criterion against IFC, Moody&apos;s, and ADB frameworks in one pass — identifying gaps, quantifying capital market impact, and generating a prioritised action matrix.
          </p>
          {missingCriteria.length === 0 ? (
            <p className="mt-3 text-sm text-success font-medium">All six criteria are documented — no gaps detected.</p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {missingCriteria.length} gap{missingCriteria.length > 1 ? "s" : ""} detected across{" "}
              {missingCriteria.map((c) => c.label).join(", ")}.
            </p>
          )}
          <Button
            type="button"
            onClick={runScan}
            className="mt-5 vela-gradient text-white border-0 hover:opacity-90"
          >
            <ScanSearch size={15} /> Run Full AI Gap Scan
          </Button>
        </div>
      )}

      {/* Scanning state */}
      {scanState === "scanning" && (
        <div className="mt-4">
          <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span
                className="inline-block w-3.5 h-3.5 border-2 rounded-full border-primary border-t-transparent animate-spin shrink-0"
                style={{ borderTopColor: "transparent" }}
              />
              <span className="font-medium">{GAP_SCAN_STAGES[stageIndex]}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{finalising ? "Generating report…" : "Scanning"}</span>
                <span>{stageIndex + 1}/{GAP_SCAN_STAGES.length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full vela-gradient transition-all duration-500"
                  style={{ width: `${((stageIndex + 1) / GAP_SCAN_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete state */}
      {scanState === "complete" && (
        <div className="mt-4 space-y-4">
          {missingCriteria.length === 0 ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-success font-medium">
              No gaps detected — all six bankability criteria are fully documented.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {missingCriteria.map((c) => {
                const report = GAP_SCAN_REPORTS[c.key];
                return (
                  <div
                    key={c.key}
                    className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-2.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: priorityColor(report.priority) }}
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold leading-tight" style={{ color: priorityColor(report.priority) }}>
                        {priorityIcon(report.priority)}
                        {c.label}
                      </span>
                      <span
                        className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: priorityColor(report.priority),
                          background: `color-mix(in oklch, ${priorityColor(report.priority)} 12%, transparent)`,
                        }}
                      >
                        {report.priority}
                      </span>
                    </div>

                    {/* Point impact */}
                    <div className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                      +{report.pointImpact} pts if closed
                    </div>

                    {/* Actions */}
                    <ol className="space-y-1.5">
                      {report.actions.map((action, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/80">
                          <span
                            className="shrink-0 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5"
                            style={{
                              color: priorityColor(report.priority),
                              background: `color-mix(in oklch, ${priorityColor(report.priority)} 12%, transparent)`,
                            }}
                          >
                            {i + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ol>

                    {/* Capital note */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-2 italic">
                      {report.capitalNote}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Verdict */}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block mb-1">
              Overall Readiness Verdict
            </span>
            {verdict}
          </div>

          {/* Scan again */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScanState("idle")}
            className="flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Scan Again
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Feature 2: AI Advisor Panel ─────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

function AIAdvisorPanel({ p }: { p: Project }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setShowChips(false);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // derive response
    const slug = ADVISOR_QUICK_PROMPTS.find(
      (qp) => qp.label === text
    )?.slug as AdvisorPromptSlug | undefined;

    let responseText: string;
    if (slug && ADVISOR_RESPONSES[slug]) {
      responseText = ADVISOR_RESPONSES[slug](p);
    } else {
      // generic fallback using best-match
      const lower = text.toLowerCase();
      if (/block|access|investor|gat/i.test(lower)) {
        responseText = ADVISOR_RESPONSES.blocking(p);
      } else if (/fast|quick|easy|rapid|close/i.test(lower)) {
        responseText = ADVISOR_RESPONSES.fastest(p);
      } else if (/tier|next|band|level|reach|score/i.test(lower)) {
        responseText = ADVISOR_RESPONSES.tier(p);
      } else {
        responseText = `For ${p.title} (${p.score}/100), the most impactful actions are: ${ADVISOR_RESPONSES.blocking(p)}`;
      }
    }

    await new Promise<void>((r) => setTimeout(r, 350));
    const aiId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: aiId, role: "assistant", content: "", isStreaming: true },
    ]);
    setIsStreaming(true);

    await streamWords(responseText, (partial) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: partial } : m))
      );
    }, 18);

    setMessages((prev) =>
      prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m))
    );
    setIsStreaming(false);
    setShowChips(true);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <div className="w-6 h-6 rounded-md vela-gradient flex items-center justify-center shrink-0">
          <Bot size={12} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-none">AI Advisor</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ask anything about this project</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Online
        </span>
      </div>

      {/* Messages */}
      {hasMessages && (
        <div className="px-3 py-3 space-y-2.5 max-h-72 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-1.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={9} className="text-white" />
                </div>
              )}
              <div
                className={[
                  "max-w-[90%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-background ring-1 ring-border/50 text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm",
                ].join(" ")}
              >
                {msg.content || (msg.isStreaming ? "" : "—")}
                {msg.isStreaming && (
                  <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5 align-middle opacity-70" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick prompts */}
      {showChips && !isStreaming && (
        <div className={`px-3 ${hasMessages ? "pb-2" : "pt-3 pb-2"} flex flex-wrap gap-1.5`}>
          {!hasMessages && (
            <p className="w-full text-[10px] text-muted-foreground mb-1">Quick questions about this project:</p>
          )}
          {ADVISOR_QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.slug}
              type="button"
              onClick={() => sendMessage(qp.label)}
              className="text-[11px] rounded-full border border-border bg-background/60 px-2.5 py-1 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/60 px-3 py-2.5">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = textareaRef.current;
              if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about this project…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-background/60 text-[11px] placeholder:text-muted-foreground/50 outline-none px-2.5 py-2 leading-relaxed"
            style={{ minHeight: 34, maxHeight: 120 }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="h-[34px] w-[34px] p-0 shrink-0 vela-gradient border-0 text-white hover:opacity-90"
          >
            <Send size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { projects, role, addRequest, requests } = useApp();
  const router = useRouter();
  const p = projects.find((x) => x.id === projectId);

  if (!p) return <NotFound />;

  const band = getBand(p.score);
  const summary = aiSummary(p);
  const recs = aiRecommendations(p);
  const existing = requests.find((r) => r.projectId === p.id && r.organization === "Macquarie Asset Management");

  const requestAccess = () => {
    addRequest({
      id: `r${Date.now()}`,
      projectId: p.id,
      projectTitle: p.title,
      investorName: "Demo Investor",
      organization: "Demo Capital Partners",
      mndaSigned: true,
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
    });
    toast.success("Data room access requested", { description: "Developer will review your MNDA." });
    router.navigate({ to: "/data-rooms" });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to projects
      </Link>

      <div className="mt-4 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* HEADER */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/15 text-primary-foreground px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-primary/30">{p.sector}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {p.province}</span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">{p.title}</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">{p.description}</p>

            {/* Score block */}
            <div className="mt-6 grid sm:grid-cols-[auto,1fr] gap-6 items-center rounded-xl bg-background/50 p-5 ring-1 ring-border/60">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Bankability</div>
                <div className="mt-1 text-7xl font-extrabold tabular-nums leading-none" style={{ color: bandColorVar(p.score) }}>
                  {p.score}
                </div>
                <div className="text-xs text-muted-foreground mt-1">/ 100</div>
                <div className="mt-3"><BandBadge score={p.score} large /></div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Criteria breakdown</div>
                <div className="space-y-2">
                  {CRITERIA.map((c) => (
                    <CriterionDetailRow
                      key={c.key}
                      criterionKey={c.key}
                      label={c.label}
                      weight={c.weight}
                      present={!!p.docs[c.key]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BANKABILITY GAP SCAN */}
          <BankabilityGapScan p={p} />

          {/* AI SUMMARY */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-foreground">
              <Sparkles size={14} className="text-accent" /> AI Summary
            </div>
            <p className="mt-3 leading-relaxed">{summary}</p>
          </div>

          {/* RECOMMENDATIONS */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-teal">
              <Lightbulb size={14} /> Improvement Recommendations
            </div>
            <ul className="mt-4 space-y-3">
              {recs.map((r, i) => (
                <li key={i} className="flex gap-3 rounded-lg bg-background/40 p-3 ring-1 ring-border/40">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal/15 text-teal text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 sticky top-20">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Project Info</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row icon={DollarSign} label="Investment value">
                <span className="font-bold tabular-nums">${p.investmentUsdM.toLocaleString()}M</span>
              </Row>
              <Row icon={Building2} label="Developer"><span className="font-medium">{p.developer}</span></Row>
              <Row icon={MapPin} label="Province"><span>{p.province}</span></Row>
              <Row icon={Sparkles} label="Sector"><span>{p.sector}</span></Row>
            </dl>

            <div className="mt-6 border-t border-border/60 pt-4">
              {role === "investor" ? (
                <Button onClick={requestAccess} disabled={!!existing} className="w-full vela-gradient text-white border-0 hover:opacity-90">
                  <Send size={15} /> {existing ? "Access already requested" : "Request Data Room Access"}
                </Button>
              ) : role === "developer" ? (
                <p className="text-xs text-muted-foreground text-center">Developer view — manage incoming requests in Data Rooms.</p>
              ) : (
                <p className="text-xs text-muted-foreground text-center">BKPM Admin view — read-only oversight.</p>
              )}
            </div>
          </div>

          {/* AI ADVISOR PANEL */}
          <AIAdvisorPanel p={p} />
        </aside>
      </div>
    </main>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof DollarSign; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon size={13} /> {label}
      </span>
      {children}
    </div>
  );
}
