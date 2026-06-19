'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { AIChat } from './AIChat'
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

export function AIChatFab() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const clearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (open) {
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
            }, 450)
          }, 2800)
        }
      }, 40)
    }

    // First cycle delayed, subsequent faster
    clearRef.current = setTimeout(startCycle, msgIndex === 0 ? 1800 : 400)

    return () => {
      clearTimeout(clearRef.current)
      clearInterval(intervalRef.current)
    }
  }, [msgIndex, open])

  return (
    <>
      {/* Floating button + tooltip */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
          {/* Tooltip bubble */}
          <div
            className={cn(
              'pointer-events-none bg-popover border border-border/60 rounded-xl shadow-lg shadow-black/8 px-3.5 py-2 text-xs text-foreground max-w-[210px] text-right transition-all duration-350',
              visible && text ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            )}
          >
            {text}
            {visible && <span className="inline-block w-px h-3 bg-primary align-middle ml-0.5 animate-pulse" />}
          </div>

          {/* FAB */}
          <button
            onClick={() => setOpen(true)}
            className="pointer-events-auto w-14 h-14 rounded-full vela-gradient shadow-lg shadow-primary/25 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-primary/35 active:scale-95"
            aria-label="Open VELA AI"
          >
            {/* Pulse ring */}
            <span className="absolute w-14 h-14 rounded-full vela-gradient opacity-40 animate-ping" />
            <Sparkles size={22} className="text-white relative z-10" />
          </button>
        </div>
      )}

      {/* Chat sidebar */}
      {open && <AIChat onClose={() => setOpen(false)} />}
    </>
  )
}
