'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

// ── Mock response engine ───────────────────────────────────────────────────

const RESPONSE_MAP: Array<[RegExp, string]> = [
  [
    /bankab|score|how.?does|what.?is.?the.?scor/i,
    "Your bankability score is a 0–100 composite built on 6 criteria from IFC Performance Standards and Moody's Project Finance methodology. Offtake Agreement (25pt), Permits (20pt), Financial Model (20pt), ESG Compliance (15pt), Sponsor Strength (10pt), Strategic Alignment (10pt). Score ≥70 unlocks investor visibility in the VELA marketplace.",
  ],
  [
    /offtake|ppa|power.?purchase|buyer/i,
    "Offtake Agreement is the highest-weighted criterion at 25 points. A 20-year PPA with PLN or a creditworthy industrial buyer provides the revenue certainty DFIs require before investment committee. Without it, most lenders won't proceed past initial screening.",
  ],
  [
    /permit|licen|izin|amdal|regulatory|oss/i,
    "Permits & Licensing accounts for 20 points. Required: AMDAL environmental clearance, IUP construction permit, OSS (Online Single Submission) confirmation. Grid connection permits (IUPTL) from PLN are also critical for renewable energy. All permits should be current and in the project entity's name.",
  ],
  [
    /financ|irr|dscr|model|projection|npv|return/i,
    "Financial Model carries 20 points. IFC requires: project IRR ≥12%, DSCR ≥1.25x, NPV positive at 10% discount rate. Capital structure is typically 70% debt / 30% equity. Include base, upside, and downside scenarios — sensitivity analysis is mandatory for investment committee.",
  ],
  [
    /esg|environmental|social|climate|ghg|carbon|impact/i,
    "ESG Compliance is 15 points and mandatory for GCF and multilateral DFI access. You need an ESMP aligned with IFC Performance Standards 1–8, community benefit-sharing mechanism, and GHG accounting if claiming climate finance. No critical habitat encroachment is a hard requirement.",
  ],
  [
    /sponsor|track.?record|credential|team|management/i,
    "Sponsor Strength accounts for 10 points. Investors want: ≥1 comparable project completed, management team with relevant infrastructure finance credentials, and ideally a co-investor or DFI that has worked with the sponsor before. AUM and balance sheet capacity matter for larger tickets.",
  ],
  [
    /strateg|rpjmn|psn|bkpm|government|national|vgf/i,
    "Strategic Alignment is 10 points. PSN (Proyek Strategis Nasional) listing or alignment with RPJMN 2025–2029 renewable targets unlocks BKPM fast-track facilitation and government Viability Gap Funding (VGF), which significantly de-risks returns for private investors.",
  ],
  [
    /70|investor|visib|marketplace|discover/i,
    "Once your score crosses 70, your project becomes visible in the VELA marketplace to matched capital providers — IFC, ADB, GCF, and family offices with Indonesia mandates. They can request data room access without any cold outreach from you. Think of it as passive deal flow.",
  ],
  [
    /85|investment.?ready|term.?sheet/i,
    "A score of 85+ means Investment Ready — all six criteria are substantially met. At this level you're eligible for term sheet discussions. Most well-prepared projects at this score close financing within 90–180 days from first investor contact.",
  ],
  [
    /upload|document|how.?to|start|submit|get.?start/i,
    "Go to 'Submit Project' and choose your mode: Hybrid (upload your pitch deck to auto-fill the form, then upload bankability docs per criterion) or AI-First (drop everything at once — AI identifies each document type, scores all criteria, and fills your project details automatically).",
  ],
  [
    /ifc|adb|gcf|dfi|capital|fund|multilateral/i,
    "VELA connects projects to three capital tiers: multilateral DFIs (IFC, ADB, GCF) for development and climate finance at $50M+; infrastructure PE funds at $20M–$200M; and family offices with Southeast Asia mandates at $5M–$50M. Each tier has distinct return expectations and ESG requirements.",
  ],
  [
    /vela|platform|what.?is|about|who/i,
    "VELA is Indonesia's Investment Intelligence Platform — AI-powered bankability advisory helping infrastructure and renewable energy projects become financing-ready. Built for BKPM and the AIPF 2026 initiative to accelerate $427B in bankable project development across the archipelago.",
  ],
  [
    /gap|improve|increase|higher|better|next/i,
    "To improve your score fastest: 1) Secure an offtake agreement (+25pts) — the single highest-impact action. 2) Obtain AMDAL and construction permits (+20pts). 3) Complete your financial model with IRR/DSCR/NPV (+20pts). Hitting these three alone takes you from 0 to 65 — close to investor visibility.",
  ],
]

function getMockResponse(text: string): string {
  for (const [pattern, response] of RESPONSE_MAP) {
    if (pattern.test(text)) return response
  }
  return "I can help with bankability scoring, document analysis, IFC/ADB criteria, or explaining how VELA connects projects to capital. Try asking about a specific criterion like 'offtake agreement' or 'financial model', or ask 'how do I reach score 70?'"
}

async function streamWords(
  text: string,
  onChunk: (partial: string) => void,
  delayMs = 32,
) {
  const words = text.split(' ')
  let built = ''
  for (const word of words) {
    built += (built ? ' ' : '') + word
    onChunk(built)
    await new Promise<void>((r) => setTimeout(r, delayMs))
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const INITIAL_MSG: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm VELA AI, your bankability advisor. I can help you understand scoring criteria, what documents to prepare, or how investors evaluate projects. What would you like to know?",
}

const QUICK_PROMPTS = [
  'How does the score work?',
  'What documents do I need?',
  'How do I reach score 70?',
  'What do DFIs look for?',
]

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export function AIChat({ onClose }: Props) {
  const [width, setWidth] = useState(380)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(380)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))

    const response = getMockResponse(text)
    const aiId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '', isStreaming: true }])
    setIsTyping(false)

    await streamWords(response, (partial) => {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: partial } : m))
    })
    setMessages(prev => prev.map(m => m.id === aiId ? { ...m, isStreaming: false } : m))
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: widthRef.current }

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return
      const next = Math.max(300, Math.min(640, dragRef.current.startW + (dragRef.current.startX - ev.clientX)))
      widthRef.current = next
      setWidth(next)
    }
    function onUp() {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
  }

  return (
    <div
      className="fixed top-0 right-0 h-full z-[60] flex flex-col bg-background border-l border-border/50 shadow-2xl shadow-black/15"
      style={{ width }}
    >
      {/* Resize grip */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-10 group select-none"
      >
        <div className="absolute top-1/2 left-0.5 -translate-y-1/2 w-1 h-10 rounded-full bg-border/40 group-hover:bg-primary/50 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 shrink-0 bg-card/40">
        <div className="w-8 h-8 rounded-lg vela-gradient flex items-center justify-center shadow shadow-primary/20 shrink-0">
          <Bot size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">VELA AI</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Bankability Advisor · Online</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Close chat"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-primary/15">
                <Bot size={11} className="text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-secondary/50 text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm',
              )}
            >
              {msg.content || (msg.isStreaming ? '' : '—')}
              {msg.isStreaming && (
                <span className="inline-block w-0.5 h-3.5 bg-current animate-pulse ml-0.5 align-middle opacity-70" />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-1">
              <Bot size={11} className="text-white" />
            </div>
            <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: `${i * 130}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => sendMessage(p)}
              disabled={isTyping}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/8 transition-all disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border/50 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 focus-within:border-primary/40 focus-within:bg-primary/4 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask about bankability, criteria, investors..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed"
            style={{ maxHeight: 96 }}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 rounded-lg vela-gradient flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Demo mode · Responses are illustrative
        </p>
      </div>
    </div>
  )
}
