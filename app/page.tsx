import Link from 'next/link'
import { ArrowRight, TrendingUp, Globe2, Zap } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATS = [
  { value: '$427B', label: 'Pipeline of bankable projects needed by 2030' },
  { value: '73%', label: 'Projects rejected due to missing documentation' },
  { value: '6 weeks', label: 'Average time from submission to term sheet' },
]

const PILLARS = [
  {
    icon: Zap,
    title: 'AI Bankability Score',
    desc: "Instant 0–100 composite score across 6 IFC/Moody's criteria. Know exactly where you stand and what to fix.",
  },
  {
    icon: TrendingUp,
    title: 'Improvement Roadmap',
    desc: 'Ranked gap analysis with specific actions. Close gaps, watch your score climb in real time.',
  },
  {
    icon: Globe2,
    title: 'Capital Marketplace',
    desc: 'Projects scoring 70+ become visible to matched DFIs, PE funds, and family offices — no cold outreach.',
  },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          AIPF 2026 · Indonesia Investment Intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
          Turn Indonesian projects into{' '}
          <span className="vela-gradient-text">bankable investments</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          VELA scores your project against IFC Performance Standards, shows you exactly what&apos;s
          missing, and connects you with capital providers — all in one platform.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/upload" className={cn(buttonVariants({ size: 'lg' }))}>
            Submit Your Project <ArrowRight size={16} className="ml-2" />
          </Link>
          <Link href="/projects" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>
            Browse Marketplace
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div
              key={s.value}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur"
            >
              <div className="text-3xl font-extrabold vela-gradient-text">{s.value}</div>
              <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-10">How VELA works</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col gap-4 backdrop-blur"
            >
              <div className="w-10 h-10 rounded-xl vela-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/upload" className={cn(buttonVariants({ size: 'lg' }))}>
            Get Your Bankability Score <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}
