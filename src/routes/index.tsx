import { createFileRoute, useRouter } from "@tanstack/react-router";
import { TrendingUp, Building2, ShieldCheck, ArrowRight, Sparkles, BarChart3, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, type Role } from "@/store/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

const STATS = [
  { value: "247", label: "Projects tracked" },
  { value: "$48B", label: "Pipeline value" },
  { value: "38", label: "Provinces covered" },
  { value: "89", label: "Investment-ready" },
];

const ROLES: { id: Exclude<Role, null>; title: string; desc: string; icon: typeof TrendingUp }[] = [
  { id: "investor", title: "Investor", desc: "Browse the pipeline, filter by bankability, and request curated data rooms.", icon: TrendingUp },
  { id: "developer", title: "Developer", desc: "Submit projects, see your live bankability score, and approve investor access.", icon: Building2 },
  { id: "admin", title: "BKPM Admin", desc: "National view: rank projects, monitor pipeline health, and accelerate flagship deals.", icon: ShieldCheck },
];

function Landing() {
  const { setRole } = useApp();
  const router = useRouter();

  const choose = (r: Exclude<Role, null>) => {
    setRole(r);
    toast.success(`Signed in as ${r === "admin" ? "BKPM Admin" : r.charAt(0).toUpperCase() + r.slice(1)}`);
    router.navigate({ to: r === "developer" ? "/upload" : "/dashboard" });
  };

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" aria-hidden />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/20 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles size={13} className="text-accent" />
            Built for BKPM · Powered by AI bankability scoring
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Smarter Investments.<br />
            <span className="vela-gradient-text">Faster Decisions.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            VELA scores Indonesia&apos;s national strategic projects on a single bankability index — so capital flows where it&apos;s ready to deploy.
          </p>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card/80 px-6 py-6 backdrop-blur">
                <div className="text-3xl md:text-4xl font-extrabold vela-gradient-text tabular-nums">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="relative border-y border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">The Problem</div>
            <h2 className="mt-3 text-3xl font-bold">Indonesia&apos;s pipeline is opaque.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Hundreds of strategic projects compete for foreign capital, but investors can&apos;t compare them apples-to-apples. Diligence drags on for months. Capital sits on the sidelines while bankable deals lose momentum.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-teal font-semibold">The VELA Solution</div>
            <h2 className="mt-3 text-3xl font-bold">One score. Six criteria. Every project.</h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              {[
                { icon: BarChart3, text: "Standardized 0–100 bankability score across the entire pipeline" },
                { icon: FileSearch, text: "Live diligence trail — offtake, permits, financials, ESG, sponsor, strategic fit" },
                { icon: Sparkles, text: "AI-generated summaries and improvement paths for every project" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <Icon size={18} className="mt-0.5 text-teal flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ROLE SELECTOR */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Choose your view</h2>
          <p className="mt-3 text-muted-foreground">Three roles. One platform. Pick how you&apos;ll use VELA.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {ROLES.map(({ id, title, desc, icon: Icon }) => (
            <button
              key={id}
              onClick={() => choose(id)}
              className="group text-left relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 transition-all hover:border-primary/60 hover:bg-card hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl vela-gradient">
                  <Icon className="text-white" size={22} strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-foreground/90">
                  Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="ghost" onClick={() => choose("investor")}>
            Or explore as an investor →
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © 2026 VELA · Indonesia Investment Intelligence Platform · Demo build
      </footer>
    </main>
  );
}
