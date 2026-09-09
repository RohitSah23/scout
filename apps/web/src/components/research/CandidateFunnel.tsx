"use client";

import type { ResearchSession } from "@scout/schemas";

export function CandidateFunnel({ session }: { session: ResearchSession | null }) {
  const count = session?.candidates.length ?? 0;
  const protocolCount =
    (session?.decisionLog.find((l) => l.eventType === "graph.query")?.payload
      ?.protocolCount as number) ?? (count > 0 ? 100 : 0);
  const scored = session?.scoreBreakdown?.candidates.length ?? 0;
  const hasDecision = session?.status === "completed";

  const stages = [
    { label: "protocols", value: protocolCount || (count > 0 ? 100 : 0) },
    { label: "candidates", value: count || (scored > 0 ? scored : 0) },
    { label: "scored", value: scored > 0 ? scored : count },
    ...(hasDecision ? [{ label: "decision", value: 1 }] : []),
  ].filter((s) => s.value > 0);

  if (stages.length === 0) return null;

  return (
    <div className="border-brutal p-6 space-y-4">
      <p className="font-display text-xs uppercase tracking-widest text-ink/60">Funnel</p>
      <div className="flex items-end gap-4">
        {stages.map((stage, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tabular-nums">
              {stage.value}
            </span>
            <span className="font-mono text-xs uppercase text-ink/50">{stage.label}</span>
            {i < stages.length - 1 && (
              <span className="hidden md:block absolute" aria-hidden>↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
