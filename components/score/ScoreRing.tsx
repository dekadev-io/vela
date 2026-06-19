'use client'

import { getScoreColor, getTierMeta } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const tier = getTierMeta(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(88% .04 300)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-extrabold tabular-nums leading-none"
          style={{ color, transition: 'color 0.4s ease' }}
        >
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
          / 100
        </span>
        <span className={`text-[10px] font-semibold mt-1 ${tier.color}`}>
          {tier.label.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}
