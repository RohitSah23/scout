"use client";

import { useState } from "react";

export function TechnicalView() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-ink/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 font-display text-xs uppercase tracking-widest text-left hover:bg-paper-muted"
      >
        Technical View {open ? "−" : "+"}
      </button>
      {open && (
        <div className="p-6 font-mono text-xs space-y-4 bg-paper-muted">
          <pre className="text-center leading-loose">
{`SCOUT AGENT
     ↓
THE GRAPH · OPENSEO
     ↓
SCORING ENGINE
     ↓
RECOMMENDATION`}
          </pre>
        </div>
      )}
    </div>
  );
}
