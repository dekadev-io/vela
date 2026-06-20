import { createFileRoute } from "@tanstack/react-router";
import { Check, X, ShieldCheck, Clock } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RequestStatus } from "@/lib/data";

export const Route = createFileRoute("/data-rooms")({
  component: DataRoomsPage,
});

const STATUS_STYLES: Record<RequestStatus, { label: string; cls: string; icon: typeof Check }> = {
  pending: { label: "Pending", cls: "bg-amber/15 text-amber ring-amber/40", icon: Clock },
  approved: { label: "Approved", cls: "bg-success/15 text-success ring-success/40", icon: Check },
  rejected: { label: "Rejected", cls: "bg-danger/15 text-danger ring-danger/40", icon: X },
};

function DataRoomsPage() {
  const { requests, role, updateRequest } = useApp();
  const isDeveloper = role === "developer";

  const decide = (id: string, status: RequestStatus) => {
    updateRequest(id, status);
    toast.success(`Request ${status}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Data Rooms</div>
        <h1 className="mt-1 text-4xl font-extrabold">Access Requests</h1>
        <p className="mt-2 text-muted-foreground">
          {isDeveloper ? "Review investor requests for your projects." : "Track your data room access status across the pipeline."}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-secondary/30">
                <th className="px-6 py-3">Project</th>
                <th className="px-3 py-3">Investor</th>
                <th className="px-3 py-3">Organization</th>
                <th className="px-3 py-3">MNDA</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const S = STATUS_STYLES[r.status];
                return (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/20 transition">
                    <td className="px-6 py-4 font-medium">{r.projectTitle}</td>
                    <td className="px-3 py-4 text-muted-foreground">{r.investorName}</td>
                    <td className="px-3 py-4">{r.organization}</td>
                    <td className="px-3 py-4">
                      {r.mndaSigned ? (
                        <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                          <ShieldCheck size={13} /> Signed
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${S.cls}`}>
                        <S.icon size={12} /> {S.label}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground tabular-nums">{r.date}</td>
                    <td className="px-3 py-4 text-right pr-6">
                      {isDeveloper && r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")} className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger">
                            <X size={14} /> Reject
                          </Button>
                          <Button size="sm" onClick={() => decide(r.id, "approved")} className="bg-success/90 text-background hover:bg-success">
                            <Check size={14} /> Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {requests.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No data room requests yet.
        </div>
      )}
    </main>
  );
}
