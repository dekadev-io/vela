import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useApp } from "@/store/app-store";
import { ProjectCard } from "@/components/project-card";
import { SECTORS, PROVINCES } from "@/lib/data";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

const BANDS = [
  { key: "all", label: "All bands" },
  { key: "ready", label: "Investment Ready (85+)" },
  { key: "near", label: "Near Bankable (70–84)" },
  { key: "dev", label: "Development (50–69)" },
  { key: "early", label: "Early Stage (<50)" },
] as const;

function ProjectsPage() {
  const { projects } = useApp();
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [province, setProvince] = useState<string>("all");
  const [band, setBand] = useState<string>("all");

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        if (sector !== "all" && p.sector !== sector) return false;
        if (province !== "all" && p.province !== province) return false;
        if (band !== "all") {
          const s = p.score;
          if (band === "ready" && s < 85) return false;
          if (band === "near" && (s < 70 || s >= 85)) return false;
          if (band === "dev" && (s < 50 || s >= 70)) return false;
          if (band === "early" && s >= 50) return false;
        }
        if (
          q &&
          !p.title.toLowerCase().includes(q.toLowerCase()) &&
          !p.description.toLowerCase().includes(q.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [projects, q, sector, province, band]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Marketplace</div>
        <h1 className="mt-1 text-4xl font-extrabold">Investment Pipeline</h1>
        <p className="mt-2 text-muted-foreground">
          Filter, compare, and shortlist {projects.length} bankable projects.
        </p>
      </div>

      {/* FILTERS */}
      <div className="mt-8 grid md:grid-cols-12 gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="md:col-span-4 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <SelectFilter
          value={sector}
          onChange={setSector}
          label="Sector"
          options={[{ k: "all", v: "All sectors" }, ...SECTORS.map((s) => ({ k: s, v: s }))]}
          className="md:col-span-3"
        />
        <SelectFilter
          value={province}
          onChange={setProvince}
          label="Province"
          options={[{ k: "all", v: "All provinces" }, ...PROVINCES.map((s) => ({ k: s, v: s }))]}
          className="md:col-span-2"
        />
        <SelectFilter
          value={band}
          onChange={setBand}
          label="Band"
          options={BANDS.map((b) => ({ k: b.key, v: b.label }))}
          className="md:col-span-3"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Filter size={12} />
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
        {projects.length} projects
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No projects match your filters.
        </div>
      )}
    </main>
  );
}

function SelectFilter({
  value,
  onChange,
  label,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { k: string; v: string }[];
  className?: string;
}) {
  return (
    <label className={`flex flex-col text-xs ${className ?? ""}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-input/60 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.k} value={o.k} className="bg-popover">
            {o.v}
          </option>
        ))}
      </select>
    </label>
  );
}
