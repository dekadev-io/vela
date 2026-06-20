import { useState, useRef, useEffect } from 'react'
import {
  X, Send, Bot, Plus, MessageSquare, ChevronDown, ChevronRight,
  Maximize2, Minimize2, Search, HelpCircle, FileText, TrendingUp,
  Building2, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function makeSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    messages: [],
    createdAt: Date.now(),
  }
}

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
  delayMs = 28,
) {
  const words = text.split(' ')
  let built = ''
  for (const word of words) {
    built += (built ? ' ' : '') + word
    onChunk(built)
    await new Promise<void>((r) => setTimeout(r, delayMs))
  }
}

const STARTERS = [
  { label: 'How does the score work?', sub: 'Criteria, weights, and thresholds', icon: HelpCircle },
  { label: 'What documents do I need?', sub: 'IFC-grade documentation checklist', icon: FileText },
  { label: 'How do I reach score 70?', sub: 'Fastest path to investor visibility', icon: TrendingUp },
  { label: 'What do DFIs look for?', sub: 'IFC, ADB, GCF requirements', icon: Building2 },
]

function TypingDots() {
  return (
    <div className="flex gap-2">
      <div className="w-5 h-5 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={10} className="text-white" />
      </div>
      <div className="bg-card ring ring-border/50 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: `${i * 130}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

interface ChatContentProps {
  messages: Message[]
  isTyping: boolean
  hasUserMessages: boolean
  input: string
  setInput: (v: string) => void
  onSend: (text: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
}

function InputArea({
  input, setInput, onSend, textareaRef, hasUserMessages, isTyping,
}: Pick<ChatContentProps, 'input' | 'setInput' | 'onSend' | 'textareaRef' | 'hasUserMessages' | 'isTyping'>) {
  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div className="shrink-0 border-t border-border p-3 space-y-2">
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend(input)
            }
          }}
          placeholder={hasUserMessages ? 'Follow up…' : 'Ask anything about bankability…'}
          rows={1}
          className="w-full resize-none overflow-y-auto bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed px-3 pt-3 pb-2 block"
          style={{ minHeight: 60, maxHeight: '50vh' }}
          disabled={isTyping}
        />
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground/50">
            Enter ↵ · Shift+Enter new line
          </p>
          <Button
            size="sm"
            className="h-6 px-2.5 rounded-xl text-xs"
            onClick={() => onSend(input)}
            disabled={!input.trim() || isTyping}
          >
            <Send size={10} className="mr-1" /> Ask
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/40 text-center">
        VELA AI can make mistakes. Verify important information.
      </p>
    </div>
  )
}

function ChatContent({
  messages, isTyping, hasUserMessages, input, setInput, onSend, textareaRef, bottomRef,
}: ChatContentProps) {
  if (messages.length === 0 && !isTyping) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5 dot-grid overflow-hidden min-h-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/20 to-primary/5 shrink-0">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight">How can I help?</h2>
            <p className="text-xs text-muted-foreground">Ask anything about bankability or your project</p>
          </div>
          <div className="w-full space-y-2">
            {STARTERS.map(({ label, sub, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => onSend(label)}
                className="relative w-full text-left flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 overflow-hidden transition-all duration-200 group hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
              >
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary origin-center scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary/60 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
        <InputArea
          input={input} setInput={setInput} onSend={onSend}
          textareaRef={textareaRef} hasUserMessages={false} isTyping={isTyping}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md vela-gradient flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={10} className="text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[86%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-card ring ring-border/50 text-foreground rounded-tl-sm w-full'
                  : 'bg-primary text-primary-foreground rounded-tr-sm',
              )}
            >
              {msg.content || (msg.isStreaming ? '' : '—')}
              {msg.isStreaming && (
                <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5 align-middle opacity-70" />
              )}
            </div>
          </div>
        ))}
        {isTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>
      <InputArea
        input={input} setInput={setInput} onSend={onSend}
        textareaRef={textareaRef} hasUserMessages={hasUserMessages} isTyping={isTyping}
      />
    </>
  )
}

interface SessionPickerProps {
  sessions: Session[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function SessionPickerBar({ sessions, activeId, onSelect, onNew, onDelete }: SessionPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const active = sessions.find(s => s.id === activeId)
  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex-1 flex items-center gap-1.5 text-left min-w-0 rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-secondary transition-colors"
        >
          <MessageSquare size={11} className="shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium truncate flex-1">{active?.title ?? 'New conversation'}</span>
          <ChevronDown size={11} className={cn('shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
        </button>
        <button
          type="button"
          onClick={onNew}
          title="New chat"
          className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
        >
          <Plus size={12} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 border-x border-b border-border rounded-b-xl bg-background shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
            <Search size={11} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground min-w-0"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X size={10} />
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                {search ? 'No conversations found' : 'No conversations yet'}
              </p>
            ) : (
              filtered.map(sess => (
                <div
                  key={sess.id}
                  onClick={() => { onSelect(sess.id); setOpen(false); setSearch('') }}
                  className={cn(
                    'group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors',
                    activeId === sess.id ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs font-medium truncate leading-tight">{sess.title}</p>
                    <p className="text-[10px] text-muted-foreground">{relativeTime(sess.createdAt)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(sess.id) }}
                    className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    aria-label="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border p-1.5">
            <button
              onClick={() => { onNew(); setOpen(false); setSearch('') }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Plus size={12} className="shrink-0" /> New conversation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  onClose: () => void
}

export function AIChat({ onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const s = makeSession()
    return [s]
  })
  const [activeId, setActiveId] = useState<string>(() => {
    const s = makeSession()
    return s.id
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [fsSearch, setFsSearch] = useState('')

  const [initialized] = useState(() => {
    const s = makeSession()
    setSessions([s])
    setActiveId(s.id)
    return true
  })
  void initialized

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0]
  const messages = activeSession?.messages ?? []
  const hasUserMessages = messages.some(m => m.role === 'user')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!isFullscreen) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isFullscreen])

  function newSession() {
    const s = makeSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
  }

  function deleteSession(id: string) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const fresh = makeSession()
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  function updateActive(updater: (s: Session) => Session) {
    setSessions(prev => prev.map(s => s.id === activeId ? updater(s) : s))
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    if (!hasUserMessages) {
      const title = text.length > 38 ? text.slice(0, 37) + '…' : text
      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, title } : s))
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    updateActive(s => ({ ...s, messages: [...s.messages, userMsg] }))
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 500 + Math.random() * 400))

    const response = getMockResponse(text)
    const aiId = crypto.randomUUID()
    updateActive(s => ({
      ...s,
      messages: [...s.messages, { id: aiId, role: 'assistant', content: '', isStreaming: true }],
    }))
    setIsTyping(false)

    await streamWords(response, (partial) => {
      setSessions(prev => prev.map(s =>
        s.id === activeId
          ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: partial } : m) }
          : s
      ))
    })
    setSessions(prev => prev.map(s =>
      s.id === activeId
        ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, isStreaming: false } : m) }
        : s
    ))
  }

  const Header = ({ inFullscreen }: { inFullscreen: boolean }) => (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border shrink-0">
      <div className="w-6 h-6 rounded-md vela-gradient flex items-center justify-center shrink-0">
        <Bot size={12} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-none">VELA AI</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-1 h-1 rounded-full bg-success" />
          <span className="text-[10px] text-muted-foreground">Bankability Advisor · Online</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsFullscreen(v => !v)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={inFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {inFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close chat"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )

  if (isFullscreen) {
    const fsSessions = sessions.filter(s =>
      s.title.toLowerCase().includes(fsSearch.toLowerCase())
    )

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <Header inFullscreen />
        <div className="flex flex-1 min-h-0">
          <aside className="w-52 shrink-0 border-r border-border flex flex-col">
            <div className="p-3 space-y-1.5 border-b border-border shrink-0">
              <button
                type="button"
                onClick={newSession}
                className="flex w-full items-center gap-2 rounded-lg border border-border px-2.5 h-8 text-xs font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <Plus size={12} /> New chat
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 h-7">
                <Search size={11} className="text-muted-foreground shrink-0" />
                <input
                  value={fsSearch}
                  onChange={e => setFsSearch(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground min-w-0"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
              {fsSessions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">No conversations yet</p>
              ) : (
                fsSessions.map(sess => (
                  <div
                    key={sess.id}
                    onClick={() => setActiveId(sess.id)}
                    className={cn(
                      'group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors',
                      activeId === sess.id ? 'bg-muted' : 'hover:bg-muted/60',
                    )}
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs font-medium truncate leading-tight">{sess.title}</p>
                      <p className="text-[10px] text-muted-foreground">{relativeTime(sess.createdAt)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(sess.id) }}
                      className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
          <div className="flex-1 flex flex-col min-h-0">
            <ChatContent
              messages={messages}
              isTyping={isTyping}
              hasUserMessages={hasUserMessages}
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              textareaRef={textareaRef}
              bottomRef={bottomRef}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Header inFullscreen={false} />
      <SessionPickerBar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newSession}
        onDelete={deleteSession}
      />
      <ChatContent
        messages={messages}
        isTyping={isTyping}
        hasUserMessages={hasUserMessages}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        textareaRef={textareaRef}
        bottomRef={bottomRef}
      />
    </div>
  )
}
