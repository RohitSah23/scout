"use client";

import { useState } from "react";
import type { Source } from "@scout/schemas";
import { parseGraphEvidence } from "@/lib/evidence/parseGraphEvidence";
import { formatUsd, formatPct, formatTimestamp } from "@/lib/evidence/format";
import { formatScore } from "@/lib/formatScore";
import { MiniBarChart } from "./MiniBarChart";
import { DataTable } from "./DataTable";
import { MetricCards } from "./MetricCards";

export function OnchainEvidenceView({ source }: { source: Source }) {
  const parsed = parseGraphEvidence(source);
  if (!parsed) {
    return <RawFallback source={source} />;
  }

  const chartData = parsed.series.slice(-14).map((p) => ({
    label: p.label.split(" ")[0] ?? p.label,
    value: p.primary,
    secondary: p.secondary,
  }));

  const changeTone =
    parsed.summary.changePct == null
      ? "default"
      : parsed.summary.changePct >= 0
        ? "positive"
        : "negative";

  const metrics = [
    {
      label: parsed.summary.primaryLabel,
      value: formatUsd(parsed.summary.primaryValue),
      hint: parsed.summary.changePct != null ? `${formatPct(parsed.summary.changePct)} vs period start` : undefined,
      tone: changeTone as "default" | "positive" | "negative",
    },
    ...(parsed.summary.secondaryLabel
      ? [
          {
            label: parsed.summary.secondaryLabel,
            value: parsed.summary.secondaryLabel.includes("users")
              ? formatScore(Number(parsed.summary.secondaryValue))
              : formatUsd(parsed.summary.secondaryValue),
          },
        ]
      : []),
    {
      label: "Data points",
      value: String(parsed.summary.dataPoints),
      hint: parsed.kind.replace("-", " "),
    },
    {
      label: "Source",
      value: parsed.live ? "Live" : "Cached",
      hint: "The Graph subgraph",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/50">Protocol</p>
        <p className="font-display text-xl uppercase mt-1">{parsed.protocol}</p>
      </div>

      <MetricCards items={metrics} />

      {chartData.length > 0 && (
        <div className="border border-ink/20 p-4 bg-paper">
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-4">
            {parsed.kind === "aave-v3" ? "Top reserves by liquidity" : "30-day trend"}
          </h4>
          <MiniBarChart
            data={chartData}
            primaryLabel={parsed.series[0]?.primaryLabel ?? "Value"}
            secondaryLabel={parsed.series[0]?.secondaryLabel}
            formatValue={formatUsd}
          />
        </div>
      )}

      {(parsed.kind === "compound-v3" || parsed.kind === "messari") && (
        <div>
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-3">Daily snapshots</h4>
          <DataTable
            rows={parsed.series.slice().reverse().slice(0, 10)}
            emptyMessage="No daily data"
            columns={[
              {
                key: "date",
                header: "Date",
                render: (r) => formatTimestamp(r.timestamp),
              },
              {
                key: "primary",
                header: parsed.series[0]?.primaryLabel ?? "Primary",
                align: "right",
                render: (r) => formatUsd(r.primary),
              },
              ...(parsed.series[0]?.secondaryLabel
                ? [
                    {
                      key: "secondary",
                      header: parsed.series[0]!.secondaryLabel!,
                      align: "right" as const,
                      render: (r: { secondary?: number }) =>
                        parsed.series[0]?.secondaryLabel?.includes("DAU")
                          ? formatScore(r.secondary ?? 0)
                          : formatUsd(r.secondary),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}

      {parsed.reserves && parsed.reserves.length > 0 && (
        <div>
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-3">Reserve breakdown</h4>
          <DataTable
            rows={parsed.reserves}
            columns={[
              { key: "symbol", header: "Asset", render: (r) => r.symbol },
              {
                key: "liquidity",
                header: "Liquidity",
                align: "right",
                render: (r) => formatUsd(r.liquidity),
              },
              {
                key: "change",
                header: "Change",
                align: "right",
                render: (r) =>
                  r.changePct == null ? (
                    "—"
                  ) : (
                    <span className={r.changePct >= 0 ? "text-success" : "text-error"}>
                      {formatPct(r.changePct)}
                    </span>
                  ),
              },
            ]}
          />
        </div>
      )}

      {source.provenance?.deploymentId && <ProvenanceBlock source={source} />}
    </div>
  );
}

function ProvenanceBlock({ source }: { source: Source }) {
  const [showQuery, setShowQuery] = useState(false);
  return (
    <details className="border border-ink/20 p-3 text-sm font-mono">
      <summary className="cursor-pointer font-display text-xs uppercase tracking-widest text-ink/60">
        Provenance & query
      </summary>
      <div className="mt-3 space-y-2 text-xs">
        {source.provenance?.subgraphId && (
          <p><span className="text-ink/50">Subgraph:</span> {source.provenance.subgraphId}</p>
        )}
        {source.provenance?.deploymentId && (
          <p className="break-all"><span className="text-ink/50">Deployment:</span> {source.provenance.deploymentId}</p>
        )}
        {source.provenance?.query && (
          <button
            type="button"
            onClick={() => setShowQuery((v) => !v)}
            className="text-signal underline"
          >
            {showQuery ? "Hide GraphQL query" : "Show GraphQL query"}
          </button>
        )}
        {showQuery && source.provenance?.query && (
          <pre className="bg-paper-muted p-3 overflow-x-auto text-[10px]">{source.provenance.query}</pre>
        )}
      </div>
    </details>
  );
}

function RawFallback({ source }: { source: Source }) {
  return (
    <pre className="text-xs bg-paper-muted p-3 overflow-x-auto max-h-64">
      {JSON.stringify(source.data, null, 2)}
    </pre>
  );
}
