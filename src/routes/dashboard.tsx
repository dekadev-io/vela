import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Briefcase, Sparkles, TrendingUp, DollarSign, ShieldCheck } from "lucide-react";
import { useApp } from "@/store/app-store";
import { getBand } from "@/lib/scoring";
import { BandBadge, ScoreBar, ScoreNumber } from "@/components/score";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Metric({ icon: Icon, label, value, sub, tone = "primary" }: { icon: typeof Briefcase; label: string; value: string; sub?: string; tone?: "primary" | "accent" | "teal" | "success" }) {
  const toneCls = {
    primary: "from-primary/30 to-primary/0 text-primary-foreground",
    accent: "from-accent/30 to-accent/0 text-accent-foreground",
    teal: "from-teal/30 to-teal/0",
    success: "from-success/30 to-success/0",
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${toneCls} opacity-40 pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-4xl font-extrabold tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className="rounded-xl bg-background/40 p-2 ring-1 ring-border/60"><Icon size={20} /></div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { projects, role } = useApp();

  const metrics = useMemo(() => {
    const total = projects.length;
    const ready = projects.filter((p) => p.score >= 85).length;
    const near = projects.filter((p) => p.score >= 70 && p.score < 85).length;
    const pipeline = projects.reduce((s, p) => s + p.investmentUsdM, 0);
    return { total, ready, near, pipeline };
  }, [projects]);

  const sectorAvg = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    projects.forEach((p) => {
      const e = map.get(p.sector) ?? { sum: 0, n: 0 };
      e.sum += p.score; e.n += 1;
      map.set(p.sector, e);
    });
    return Array.from(map.entries())
      .map(([sector, { sum, n }]) => ({ sector: sector.replace(" & ", " & "), score: Math.round(sum / n) }))
      .sort((a, b) => b.score - a.score);
  }, [projects]);

  const bandDist = useMemo(() => {
    const counts = { "Investment Ready": 0, "Near Bankable": 0, "Development": 0, "Early Stage": 0 } as Record<string, number>;
    projects.forEach((p) => { counts[getBand(p.score).label] += 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const top10 = useMemo(() => [...projects].sort((a, b) => b.score - a.score).slice(0, 10), [projects]);

  const BAND_COLORS = ["var(--success)", "var(--accent)", "var(--amber)", "var(--danger)"];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {role === "admin" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/15 px-4 py-3 text-sm">
          <ShieldCheck size={18} className="text-primary-foreground" />
          <span className="font-semibold">BKPM Admin View</span>
          <span className="text-muted-foreground">— National pipeline oversight & flagship project ranking</span>
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">National Pipeline</div>
          <h1 className="mt-1 text-4xl font-extrabold">Investment Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground">Real-time bankability scoring across {projects.length} projects.</p>
      </div>

      {/* METRICS */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Briefcase} label="Total Projects" value={String(metrics.total)} sub="Tracked nationally" tone="primary" />
        <Metric icon={Sparkles} label="Investment Ready" value={String(metrics.ready)} sub="Score ≥ 85" tone="success" />
        <Metric icon={TrendingUp} label="Near Bankable" value={String(metrics.near)} sub="Score 70–84" tone="accent" />
        <Metric icon={DollarSign} label="Pipeline Value" value={`$${(metrics.pipeline / 1000).toFixed(2)}B`} sub="USD, total CAPEX" tone="teal" />
      </div>

      {/* CHARTS */}
      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/70 p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold">Average Bankability by Sector</h3>
            <span className="text-xs text-muted-foreground">0–100 score</span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorAvg} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {sectorAvg.map((d, i) => (
                    <Cell key={i} fill={d.score >= 85 ? "var(--success)" : d.score >= 70 ? "var(--accent)" : d.score >= 50 ? "var(--amber)" : "var(--danger)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
          <h3 className="font-bold">Score Band Distribution</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bandDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="var(--background)" strokeWidth={2}>
                  {bandDist.map((_, i) => <Cell key={i} fill={BAND_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {bandDist.map((b, i) => (
              <li key={b.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAND_COLORS[i] }} />
                  {b.name}
                </span>
                <span className="font-semibold tabular-nums">{b.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TOP 10 */}
      <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 overflow-hidden">
        <div className="flex items-baseline justify-between p-6 pb-4">
          <h3 className="font-bold">Top 10 Projects by Bankability</h3>
          <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-y border-border/60 bg-secondary/30">
                <th className="px-6 py-3 w-10">#</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Sector</th>
                <th className="px-3 py-3">Province</th>
                <th className="px-3 py-3">Bankability</th>
                <th className="px-3 py-3">Band</th>
                <th className="px-3 py-3 text-right pr-6">CAPEX (USD)</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((p, i) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-secondary/30 transition">
                  <td className="px-6 py-3 font-semibold tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3 font-medium">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:text-primary-foreground">{p.title}</Link>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.sector}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.province}</td>
                  <td className="px-3 py-3 w-48">
                    <div className="flex items-center gap-2">
                      <ScoreBar score={p.score} className="flex-1" />
                      <span className="text-sm w-8 text-right"><ScoreNumber score={p.score} /></span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><BandBadge score={p.score} /></td>
                  <td className="px-3 py-3 text-right pr-6 font-semibold tabular-nums">${p.investmentUsdM.toLocaleString()}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
