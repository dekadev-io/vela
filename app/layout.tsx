import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/layout/Nav'
import { Toaster } from '@/components/ui/sonner'
import { AIChatFab } from '@/components/ai/AIChatFab'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'VELA — Indonesia Investment Intelligence',
  description: 'AI-powered bankability advisory connecting Indonesia\'s investment projects to international capital providers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
          © 2026 VELA · Indonesia Investment Intelligence Platform · Demo build · AIPF 2026
        </footer>
        <Toaster richColors position="top-right" />
        <AIChatFab />
      </body>
    </html>
  )
}
