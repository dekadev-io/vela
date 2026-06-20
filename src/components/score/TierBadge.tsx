import { cn, getTierMeta } from '@/lib/utils'

interface TierBadgeProps {
  score: number
  large?: boolean
  className?: string
}

const TIER_STYLES = {
  'investment-ready': 'bg-success/10 text-success border-success/25',
  'near-bankable':    'bg-primary/10 text-primary border-primary/25',
  'development':      'bg-amber/10 text-amber border-amber/25',
  'early-stage':      'bg-danger/10 text-danger border-danger/25',
} as const

export function TierBadge({ score, large = false, className }: TierBadgeProps) {
  const tier = getTierMeta(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        large ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs',
        TIER_STYLES[tier.key],
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-70" />
      {tier.label}
    </span>
  )
}
