import { getBand, bandColorVar } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 rounded-full bg-secondary/80 overflow-hidden ring-1 ring-border/60">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: bandColorVar(score) }}
        />
      </div>
    </div>
  );
}

export function BandBadge({ score, large = false }: { score: number; large?: boolean }) {
  const band = getBand(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1",
        band.bg,
        band.color,
        band.ring,
        large ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: bandColorVar(score) }} />
      {band.label}
    </span>
  );
}

export function ScoreNumber({ score }: { score: number }) {
  return (
    <span className="font-bold tabular-nums" style={{ color: bandColorVar(score) }}>
      {score}
    </span>
  );
}
