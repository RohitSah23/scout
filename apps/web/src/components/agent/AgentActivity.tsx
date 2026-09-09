import type { ResearchListItem } from "@/lib/api";
import { formatScore } from "@/lib/formatScore";

export function AgentActivity({ reports }: { reports: ResearchListItem[] }) {
  const completed = reports.filter((r) => r.status === "completed");
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length
      : 0;

  const stats = [
    { label: "Completed", value: String(completed.length) },
    { label: "Avg Score", value: completed.length > 0 ? `${formatScore(avgScore)}/100` : "—" },
    { label: "Chains", value: String(new Set(completed.map((r) => r.chain ?? "base")).size) },
    { label: "Latest", value: completed[0]?.winner ?? "—" },
  ];

  return (
    <div className="border-brutal p-6">
      <h2 className="font-display text-sm uppercase tracking-widest mb-6">Agent Activity</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-sm">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-ink/50 uppercase text-xs">{s.label}</p>
            <p className="mt-1 text-lg">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
