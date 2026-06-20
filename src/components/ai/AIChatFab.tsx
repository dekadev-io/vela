import { useState, useEffect, useRef } from 'react'
import { Bot, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MESSAGES = [
  'Need help with bankability scoring?',
  'I can analyze your project criteria',
  "Ask about IFC & Moody's standards",
  'Let me help close your scoring gaps',
  'Wondering what DFIs look for?',
  'Your AI advisor is ready',
  'How do I reach investor visibility?',
]

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function AIChatFab({ open, onOpen }: Props) {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const clearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (open || dismissed) {
      setVisible(false)
      return
    }

    function startCycle() {
      const msg = MESSAGES[msgIndex % MESSAGES.length]
      let i = 0
      setText('')
      setVisible(true)

      intervalRef.current = setInterval(() => {
        i++
        setText(msg.slice(0, i))
        if (i >= msg.length) {
          clearInterval(intervalRef.current)
          clearRef.current = setTimeout(() => {
            setVisible(false)
            clearRef.current = setTimeout(() => {
              setMsgIndex(n => (n + 1) % MESSAGES.length)
            }, 400)
          }, 2800)
        }
      }, 40)
    }

    clearRef.current = setTimeout(startCycle, msgIndex === 0 ? 1800 : 400)

    return () => {
      clearTimeout(clearRef.current)
      clearInterval(intervalRef.current)
    }
  }, [msgIndex, open, dismissed])

  if (open) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {!dismissed && (
        <div
          className={cn(
            'pointer-events-auto bg-popover border border-border rounded-xl shadow-md px-3 py-2 text-xs text-foreground max-w-[200px] text-right transition-all duration-300',
            visible && text ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5 pointer-events-none',
          )}
        >
          <div className="flex items-start gap-1.5 justify-end">
            <span className="leading-snug">{text}</span>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 mt-px text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={10} />
            </button>
          </div>
          {visible && <span className="inline-block w-px h-3 bg-primary align-middle ml-0.5 animate-pulse" />}
        </div>
      )}

      <button
        onClick={onOpen}
        className="pointer-events-auto h-8 w-8 rounded-lg border border-border bg-background shadow-md flex items-center justify-center text-primary hover:bg-muted hover:border-primary/30 transition-all duration-200 active:scale-95"
        aria-label="Open VELA AI"
      >
        <Bot size={16} />
      </button>
    </div>
  )
}
