"use client";

import type { CandidateScore } from "@scout/schemas";
import { formatScore } from "@/lib/formatScore";

export function CombinedSignalView({ candidate }: { candidate: CandidateScore }) {
  const onchain = candidate.dimensions.find((d) => d.key === "onchainGrowth")?.score ?? 0;
  const search = candidate.dimensions.find((d) => d.key === "searchDemand")?.score ?? 0;
  const gap = candidate.dimensions.find((d) => d.key === "competitiveGap")?.score ?? 0;
  const seo = candidate.dimensions.find((d) => d.key === "seoOpportunity")?.score ?? 0;

  const visibility =
    search < 50 ? "LOW" : search < 75 ? "MODERATE" : "HIGH";

  return (
    <div className="border-brutal p-6 space-y-6">
      <h3 className="font-display text-sm uppercase tracking-widest">{candidate.protocol}</h3>

      <div className="space-y-4 font-mono text-sm">
        <SignalBar label="On-chain Adoption" value={onchain} />
        <SignalBar label="Web Demand" value={search} />
        <SignalBar label="Web Visibility" value={visibility === "LOW" ? 30 : visibility === "MODERATE" ? 60 : 90} display={visibility} />
        <SignalBar label="Competitive Gap" value={gap} />
      </div>

      <div className="border-t-2 border-ink pt-4">
        <p className="font-display text-xs uppercase tracking-widest text-ink/60 mb-2">
          Scout&apos;s Interpretation
        </p>
        <p className="text-sm leading-relaxed">
          {onchain > 75 && search < 70
            ? "Real adoption + underdeveloped web presence + lower relative visibility = potential build opportunity."
            : candidate.gapSignal ?? "Signals suggest a differentiated opportunity worth investigating."}
        </p>
      </div>
    </div>
  );
}

function SignalBar({
  label,
  value,
  display,
}: {
  label: string;
  value: number;
  display?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="uppercase text-xs text-ink/60">{label}</span>
        <span>{display ?? formatScore(value)}</span>
      </div>
      <div className="h-3 bg-paper-muted border border-ink/20">
        <div className="h-full bg-ink" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
