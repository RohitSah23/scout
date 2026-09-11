"use client";

import type { ResearchSession } from "@scout/schemas";
import { formatUsd } from "@/lib/evidence/format";
import {
  formatDiscoveryHeadline,
  getDiscoverySummary,
} from "@/lib/discoverySummary";

export function CandidateDiscoveryPanel({ session }: { session: ResearchSession | null }) {
  const summary = getDiscoverySummary(session);
  const tokens = session?.candidates ?? [];

  if (!summary || tokens.length === 0) return null;

  return (
    <div className="border-brutal p-6 space-y-4">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/60">
          Asset Discovery
        </p>
        <h2 className="font-display text-xl uppercase mt-2">Discovered Lending Assets</h2>
        <p className="mt-2 text-sm text-ink/60">{formatDiscoveryHeadline(summary)}</p>
        <div className="h-[3px] w-16 bg-ink mt-3" />
      </div>

      <div className="space-y-3">
        {tokens.map((entry) => (
          <div
            key={entry.id}
            className="border border-ink/15 px-4 py-3 bg-paper flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <p className="font-display text-sm uppercase">
                {entry.assetSymbol ?? entry.protocol}
              </p>
              <p className="font-mono text-xs text-ink/50 uppercase mt-0.5">
                {entry.sourceProtocol ?? entry.protocol} · {entry.chain}
                {entry.windowLabel ? ` · ${entry.windowLabel}` : ""}
              </p>
            </div>
            <span className="self-start font-mono text-[10px] uppercase px-2 py-0.5 border border-success/40 text-success bg-success/5">
              {formatUsd(entry.tokenMetrics?.grossFlowUsd ?? entry.tokenMetrics?.tvlUsd ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
