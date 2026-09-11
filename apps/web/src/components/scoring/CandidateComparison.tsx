"use client";

import type { Candidate, CandidateScore } from "@scout/schemas";
import { CandidateScoreCard } from "./CandidateScoreCard";

export function CandidateComparison({
  candidates,
  rawCandidates,
}: {
  candidates: CandidateScore[];
  rawCandidates?: Candidate[];
}) {
  const ranked = [...candidates].sort((a, b) => a.rank - b.rank || b.composite - a.composite);

  if (ranked.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl uppercase">
          {ranked.length} Lending Asset{ranked.length === 1 ? "" : "s"} Ranked
        </h2>
        <p className="mt-2 text-sm text-ink/60 max-w-2xl">
          Cross-protocol token leaderboard — top markets per lending protocol with on-chain,
          search, competitive gap, and evidence confidence side by side.
        </p>
        <div className="h-[3px] w-16 bg-ink mt-3" />
      </div>

      <div className="space-y-5">
        {ranked.map((c, i) => (
          <CandidateScoreCard
            key={`${c.assetSymbol ?? c.protocol}-${c.sourceProtocol ?? ""}-${c.chain}-${i}`}
            candidate={c}
            rank={c.rank || i + 1}
            rawCandidates={rawCandidates}
            highlighted={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
