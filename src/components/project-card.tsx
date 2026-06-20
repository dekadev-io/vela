import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Project } from "@/lib/data";
import { BandBadge, ScoreBar, ScoreNumber } from "./score";

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: p.id }}
      className="group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card/60 p-5 transition-all hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary/15 text-primary-foreground/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-primary/30">
            {p.sector}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} /> {p.province}
          </span>
        </div>
        <ArrowUpRight size={18} className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>

      <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-2">{p.title}</h3>

      <div className="flex items-end justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Bankability</span>
            <span className="text-lg"><ScoreNumber score={p.score} /><span className="text-xs text-muted-foreground">/100</span></span>
          </div>
          <ScoreBar score={p.score} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <BandBadge score={p.score} />
        <span className="text-sm font-semibold text-foreground tabular-nums">
          ${p.investmentUsdM.toLocaleString()}M
        </span>
      </div>
    </Link>
  );
}
