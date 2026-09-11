"use client";

import type { Candidate, CandidateScore } from "@scout/schemas";
import { formatUsd } from "@/lib/evidence/format";
import { formatScore } from "@/lib/formatScore";
import { formatSignedPct, matchRawCandidate } from "@/lib/candidateSummary";
import { DataTable } from "@/components/evidence/DataTable";

export function TokenLeaderboardTable({
  candidates,
  rawCandidates,
}: {
  candidates: CandidateScore[];
  rawCandidates?: Candidate[];
}) {
  const ranked = [...candidates].sort((a, b) => a.rank - b.rank || b.composite - a.composite);

  if (ranked.length === 0) return null;

  return (
    <div className="border-brutal p-6 space-y-4">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/60">
          Cross-Protocol Leaderboard
        </p>
        <h2 className="font-display text-xl uppercase mt-2">Top Lending Assets</h2>
        <p className="mt-2 text-sm text-ink/60">
          Top 5 markets per protocol, ranked by live on-chain activity and growth.
        </p>
        <div className="h-[3px] w-16 bg-ink mt-3" />
      </div>

      <DataTable
        rows={ranked}
        emptyMessage="No ranked assets"
        columns={[
          {
            key: "rank",
            header: "#",
            render: (row) => String(row.rank).padStart(2, "0"),
          },
          {
            key: "asset",
            header: "Asset",
            render: (row) => row.assetSymbol ?? row.protocol.split(" · ")[0] ?? row.protocol,
          },
          {
            key: "protocol",
            header: "Protocol",
            render: (row) => row.sourceProtocol ?? row.protocol.split(" · ")[1] ?? "—",
          },
          {
            key: "window",
            header: "Window",
            render: (row) => row.windowLabel ?? "—",
          },
          {
            key: "growth",
            header: "Growth",
            align: "right",
            render: (row) => {
              const raw = matchRawCandidate(row, rawCandidates);
              return formatSignedPct(raw?.onchainMetrics?.tvlChangePct);
            },
          },
          {
            key: "flow",
            header: "Flow / TVL",
            align: "right",
            render: (row) => {
              const raw = matchRawCandidate(row, rawCandidates);
              const value =
                raw?.tokenMetrics?.grossFlowUsd ??
                raw?.tokenMetrics?.tvlUsd ??
                0;
              return formatUsd(value);
            },
          },
          {
            key: "score",
            header: "Score",
            align: "right",
            render: (row) => formatScore(row.composite),
          },
        ]}
      />
    </div>
  );
}
