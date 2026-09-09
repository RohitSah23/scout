"use client";

import { useEffect, useState } from "react";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { AgentActivity } from "@/components/agent/AgentActivity";
import { fetchReports, type ResearchListItem } from "@/lib/api";

export default function AgentPage() {
  const [reports, setReports] = useState<ResearchListItem[]>([]);

  useEffect(() => {
    fetchReports().then(setReports).catch(() => setReports([]));
  }, []);

  return (
    <ScoutShell>
      <div className="max-w-scout mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">
        <AgentIdentityCard name="scout" status="ACTIVE" />
        <AgentActivity reports={reports} />
      </div>
    </ScoutShell>
  );
}
