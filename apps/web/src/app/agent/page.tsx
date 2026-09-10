"use client";

import { useEffect, useState } from "react";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { PermissionList } from "@/components/agent/PermissionList";
import { EACTestCard } from "@/components/agent/EACTestCard";
import { AgentActivity } from "@/components/agent/AgentActivity";
import { fetchReports, type ResearchListItem } from "@/lib/api";

export default function AgentPage() {
  const [reports, setReports] = useState<ResearchListItem[]>([]);
  const [identity, setIdentity] = useState<{
    name: string;
    ensName: string;
    status: string;
    budgetCap: number;
  } | null>(null);

  useEffect(() => {
    fetchReports().then(setReports).catch(() => setReports([]));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(`${apiUrl}/agent/identity`)
      .then((r) => r.json())
      .then(setIdentity)
      .catch(() => null);
  }, []);

  return (
    <ScoutShell>
      <div className="max-w-scout mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">
        <AgentIdentityCard
          name={identity?.name ?? "scout"}
          ensName={identity?.ensName ?? "scout.base.eth"}
          budgetCap={identity?.budgetCap ?? 0.5}
          status={identity?.status ?? "ACTIVE"}
        />

        <PermissionList />

        <EACTestCard />

        <AgentActivity reports={reports} />
      </div>
    </ScoutShell>
  );
}
