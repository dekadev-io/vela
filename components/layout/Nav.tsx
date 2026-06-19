'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Upload, FolderOpen } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/upload', label: 'Submit Project', icon: Upload },
  { href: '/projects', label: 'Marketplace', icon: FolderOpen },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg vela-gradient shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold tracking-tight lowercase vela-gradient-text">vela</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors',
                    active
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-foreground ring-1 ring-primary/30">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          <span>Live · AIPF 2026</span>
        </div>
      </div>
    </header>
  )
}
