import { useState, useRef } from 'react'
import { AIChat } from './AIChat'
import { AIChatFab } from './AIChatFab'

interface Props {
  children: React.ReactNode
}

export function AIChatLayout({ children }: Props) {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(380)
  const widthRef = useRef(380)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

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

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>

      {open && (
        <aside
          className="shrink-0 border-l border-border flex flex-col bg-background relative"
          style={{ width }}
        >
          <div
            onMouseDown={handleResizeStart}
            className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize z-10 group select-none"
          >
            <div className="absolute top-1/2 left-0.5 -translate-y-1/2 w-1 h-10 rounded-full bg-border group-hover:bg-primary/40 transition-colors" />
          </div>

          <AIChat onClose={() => setOpen(false)} />
        </aside>
      )}

      <AIChatFab open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} />
    </div>
  )
}
