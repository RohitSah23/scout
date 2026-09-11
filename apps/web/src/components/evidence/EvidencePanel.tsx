"use client";

import { useState } from "react";
import type { Source } from "@scout/schemas";
import { ToolBadge } from "@/components/ui/Badge";
import { OnchainEvidenceView } from "./OnchainEvidenceView";
import { SeoEvidenceView } from "./SeoEvidenceView";

export function EvidencePanel({
  source,
  index,
  compact = false,
}: {
  source: Source;
  index: number;
  compact?: boolean;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const typeLabel =
    source.type === "onchain" ? "On-chain" : source.type === "web" ? "Web intelligence" : "Paid analysis";

  return (
    <article className={`border-brutal bg-paper ${compact ? "" : "shadow-brutal"}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/20 px-5 py-4 bg-paper-muted/30">
        <div>
          <p className="font-mono text-xs text-ink/50">
            Evidence #{String(index).padStart(2, "0")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ToolBadge tool={source.name} />
            <span className="font-mono text-xs uppercase text-ink/60">{typeLabel}</span>
            {source.cost > 0 && (
              <span className="font-mono text-xs text-signal">${source.cost.toFixed(2)}</span>
            )}
          </div>
        </div>
      </header>

      <div className="p-5">
        {source.type === "onchain" && <OnchainEvidenceView source={source} />}
        {source.type === "web" && <SeoEvidenceView source={source} />}
        {source.type === "paid" && (
          <p className="text-sm text-ink/70">
            Paid deep-analysis evidence. Open the transaction reference below for audit trail.
          </p>
        )}

        {source.txRef && (
          <a
            className="mt-4 inline-block font-mono text-xs break-all text-signal underline"
            href={`https://sepolia.basescan.org/tx/${source.txRef}`}
            target="_blank"
            rel="noreferrer"
          >
            View payment transaction: {source.txRef} ↗
          </a>
        )}

        {source.data && (
          <div className="mt-6 pt-4 border-t border-ink/10">
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="font-mono text-xs text-ink/50 hover:text-ink underline"
            >
              {showRaw ? "Hide raw JSON" : "View raw JSON"}
            </button>
            {showRaw && (
              <pre className="mt-2 text-[10px] bg-paper-muted p-3 overflow-x-auto max-h-48">
                {JSON.stringify(source.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
