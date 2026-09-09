"use client";

import type { ResearchSession } from "@scout/schemas";
import type { DecisionLogEntry } from "@scout/schemas";
import { ScoutHeader } from "./ScoutHeader";

export function ScoutShell({
  children,
  session,
  lastLog,
}: {
  children: React.ReactNode;
  session?: ResearchSession | null;
  lastLog?: DecisionLogEntry;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <ScoutHeader session={session} lastLog={lastLog} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
