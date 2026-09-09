"use client";

import type { Source } from "@scout/schemas";
import { parseSeoEvidence } from "@/lib/evidence/parseSeoEvidence";
import { formatPct } from "@/lib/evidence/format";
import { formatScore } from "@/lib/formatScore";
import { DataTable } from "./DataTable";
import { MetricCards } from "./MetricCards";
import { MiniBarChart } from "./MiniBarChart";

export function SeoEvidenceView({ source }: { source: Source }) {
  const parsed = parseSeoEvidence(source);
  if (!parsed) {
    return (
      <pre className="text-xs bg-paper-muted p-3 overflow-x-auto max-h-64">
        {JSON.stringify(source.data, null, 2)}
      </pre>
    );
  }

  const m = parsed.metrics;
  const topKeywords = parsed.keywords.slice(0, 8);
  const volumeChart = topKeywords.map((k) => ({
    label: k.keyword.split(" ")[0] ?? k.keyword,
    value: k.volume,
  }));

  const demandTone =
    (m.searchDemandChangePct ?? 0) >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/50">Protocol & seed</p>
        <p className="font-display text-xl uppercase mt-1">{parsed.protocol}</p>
        {parsed.seed && (
          <p className="mt-1 font-mono text-sm text-ink/70">Seed: &ldquo;{parsed.seed}&rdquo;</p>
        )}
      </div>

      <MetricCards
        items={[
          {
            label: "Search demand",
            value: formatPct(m.searchDemandChangePct ?? 0),
            hint: "3-mo trend avg",
            tone: demandTone,
          },
          {
            label: "Organic visibility",
            value: `${formatScore(m.organicVisibility)}/100`,
          },
          {
            label: "Content gap",
            value: `${formatScore(m.contentGapScore)}/100`,
            hint: "Higher = more opportunity",
          },
          {
            label: "Dev intent",
            value: `${formatScore(m.developerIntentScore)}/100`,
          },
          {
            label: "SERP dominance",
            value: `${formatScore(m.competitorSerpDominance)}/100`,
            hint: "Official + major publishers",
          },
          {
            label: "AI visibility",
            value: `${formatScore(m.aiVisibilityScore ?? 0)}/100`,
          },
          {
            label: "Keywords",
            value: String(parsed.keywords.length),
            hint: "Top rows shown",
          },
          {
            label: "Source",
            value: parsed.live ? "Live" : "Cached",
            hint: "OpenSEO MCP",
          },
        ]}
      />

      {volumeChart.length > 0 && (
        <div className="border border-ink/20 p-4 bg-paper">
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-4">
            Top keyword volume
          </h4>
          <MiniBarChart
            data={volumeChart}
            primaryLabel="Monthly volume"
            formatValue={(v) => v.toLocaleString()}
            height={140}
          />
        </div>
      )}

      {parsed.keywords.length > 0 && (
        <div>
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-3">Keyword research</h4>
          <DataTable
            rows={parsed.keywords}
            columns={[
              {
                key: "keyword",
                header: "Keyword",
                render: (r) => <span className="max-w-[200px] truncate block">{r.keyword}</span>,
              },
              {
                key: "volume",
                header: "Volume",
                align: "right",
                render: (r) => r.volume.toLocaleString(),
              },
              {
                key: "trend",
                header: "Trend",
                align: "right",
                render: (r) =>
                  r.trendChangePct == null ? (
                    "—"
                  ) : (
                    <span className={r.trendChangePct >= 0 ? "text-success" : "text-error"}>
                      {formatPct(r.trendChangePct)}
                    </span>
                  ),
              },
              {
                key: "kd",
                header: "KD",
                align: "right",
                render: (r) => (r.difficulty != null ? formatScore(r.difficulty) : "—"),
              },
              {
                key: "intent",
                header: "Intent",
                render: (r) => <span className="text-ink/70 capitalize">{r.intent}</span>,
              },
            ]}
          />
        </div>
      )}

      {parsed.serp.length > 0 && (
        <div>
          <h4 className="font-display text-xs uppercase tracking-widest text-ink/60 mb-3">SERP results</h4>
          <DataTable
            rows={parsed.serp}
            columns={[
              {
                key: "rank",
                header: "#",
                align: "right",
                render: (r) => r.rank,
              },
              {
                key: "type",
                header: "Type",
                render: (r) => (
                  <span className="text-xs uppercase text-ink/60">{r.type.replace("_", " ")}</span>
                ),
              },
              {
                key: "domain",
                header: "Domain",
                render: (r) => r.domain,
              },
              {
                key: "url",
                header: "URL",
                render: (r) =>
                  r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-signal underline truncate max-w-[180px] block"
                    >
                      {r.url.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
