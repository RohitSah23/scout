"use client";

import { useState } from "react";
import type { ResearchSession } from "@scout/schemas";
import type { DecisionLogEntry } from "@scout/schemas";
import { ScoutHeader } from "./ScoutHeader";
import { BudgetDrawer } from "./BudgetDrawer";

export function ScoutShell({
  children,
  session,
  lastLog,
}: {
  children: React.ReactNode;
  session?: ResearchSession | null;
  lastLog?: DecisionLogEntry;
}) {
  const [treasuryOpen, setTreasuryOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <ScoutHeader
        session={session}
        lastLog={lastLog}
        onOpenTreasury={() => setTreasuryOpen(true)}
      />
      <main className="flex-1">{children}</main>
      <BudgetDrawer
        open={treasuryOpen}
        onClose={() => setTreasuryOpen(false)}
        session={session ?? null}
      />
    </div>
  );
}
