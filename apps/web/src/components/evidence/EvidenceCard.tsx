"use client";

import type { Source } from "@scout/schemas";
import { SourceBadge } from "@/components/ui/Badge";
import { parseGraphEvidence } from "@/lib/evidence/parseGraphEvidence";
import { parseSeoEvidence } from "@/lib/evidence/parseSeoEvidence";
import { formatUsd, formatPct } from "@/lib/evidence/format";
import { formatScore } from "@/lib/formatScore";

function evidencePreview(source: Source): { title: string; stats: Array<{ label: string; value: string }> } {
  if (source.type === "onchain") {
    const parsed = parseGraphEvidence(source);
    if (!parsed) return { title: "On-chain data", stats: [] };
    return {
      title: parsed.protocol,
      stats: [
        { label: parsed.summary.primaryLabel, value: formatUsd(parsed.summary.primaryValue) },
        ...(parsed.summary.changePct != null
          ? [{ label: "Change", value: formatPct(parsed.summary.changePct) }]
          : []),
        { label: "Points", value: String(parsed.summary.dataPoints) },
      ],
    };
  }

  if (source.type === "web") {
    const parsed = parseSeoEvidence(source);
    if (!parsed) return { title: "Web intelligence", stats: [] };
    return {
      title: parsed.protocol,
      stats: [
        { label: "Demand", value: formatPct(parsed.metrics.searchDemandChangePct ?? 0) },
        { label: "Visibility", value: `${formatScore(parsed.metrics.organicVisibility)}/100` },
        { label: "Keywords", value: String(parsed.keywords.length) },
      ],
    };
  }

  return { title: "Paid analysis", stats: [{ label: "Cost", value: `$${source.cost.toFixed(2)}` }] };
}

export function EvidenceCard({
  source,
  index,
  onClick,
}: {
  source: Source;
  index: number;
  onClick: () => void;
}) {
  const preview = evidencePreview(source);
  const typeLabel =
    source.type === "onchain" ? "On-chain" : source.type === "web" ? "Web" : "Paid";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border-brutal p-5 hover:shadow-brutal-hover transition-all bg-paper group"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <SourceBadge name={source.name} index={index} />
          <p className="mt-3 font-display text-lg uppercase truncate">{preview.title}</p>
          <p className="mt-1 font-mono text-xs text-ink/50 uppercase">{typeLabel}</p>
        </div>
        {source.cost > 0 && (
          <span className="font-mono text-sm text-signal shrink-0">${source.cost.toFixed(2)}</span>
        )}
      </div>

      {preview.stats.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink/10 pt-4">
          {preview.stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-[10px] uppercase text-ink/50">{s.label}</p>
              <p className="font-mono text-sm font-bold tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 font-mono text-xs text-signal opacity-0 group-hover:opacity-100 transition-opacity">
        View full evidence →
      </p>
    </button>
  );
}
