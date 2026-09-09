"use client";

import type { Source } from "@scout/schemas";
import { EvidencePanel } from "./EvidencePanel";

export function EvidenceDrawer({
  source,
  index,
  claim,
  open,
  onClose,
}: {
  source: Source;
  index: number;
  claim?: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 z-40" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-3xl bg-paper border-l-[3px] border-ink z-50 overflow-y-auto"
        role="dialog"
        aria-label={`Evidence ${index}`}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 bg-paper border-b border-ink/20">
          <h2 className="font-display text-lg uppercase">Evidence detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-sm px-3 py-1 border border-ink hover:bg-paper-muted"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-4">
          {claim && (
            <div className="border border-ink/20 bg-paper-muted/40 p-4">
              <p className="font-display text-xs uppercase tracking-widest text-ink/50">Related claim</p>
              <p className="mt-2 text-sm leading-relaxed">{claim}</p>
            </div>
          )}
          <EvidencePanel source={source} index={index} compact />
        </div>
      </aside>
    </>
  );
}
