'use client'

import { cn, getTierMeta, getScoreColor } from '@/lib/utils'

interface TierBadgeProps {
  score: number
  large?: boolean
  className?: string
}

export function TierBadge({ score, large = false, className }: TierBadgeProps) {
  const tier = getTierMeta(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1',
        large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
        tier.bg, tier.color, tier.ring,
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: getScoreColor(score) }}
      />
      {tier.label}
    </span>
  )
}
