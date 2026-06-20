import { getScoreColor, getTierMeta } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const strokeWidth = size < 80 ? 6 : 8
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const tier = getTierMeta(score)

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.65s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <span
          className="font-bold tabular-nums leading-none"
          style={{
            fontSize: size < 80 ? '1.125rem' : size < 110 ? '1.5rem' : '2rem',
            color,
            transition: 'color 0.4s ease',
          }}
        >
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">/ 100</span>
        {size >= 100 && (
          <span className="text-[9px] font-medium mt-0.5" style={{ color }}>
            {tier.label.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  )
}
