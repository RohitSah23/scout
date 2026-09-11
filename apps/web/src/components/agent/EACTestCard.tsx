"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EACTestResult {
  action: "authorized" | "unauthorized";
  success: boolean;
  status: number;
  data: Record<string, unknown>;
  timestamp: string;
}

export function EACTestCard() {
  const [loading, setLoading] = useState<"auth" | "unauth" | null>(null);
  const [result, setResult] = useState<EACTestResult | null>(null);

  async function handleTest(action: "authorized" | "unauthorized") {
    setLoading(action === "authorized" ? "auth" : "unauth");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/agent/test-eac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setResult({
        action,
        success: res.ok,
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setResult({
        action,
        success: false,
        status: 500,
        data: { error: err instanceof Error ? err.message : "Network error" },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card shadow className="border-brutal space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/20 pb-4">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-ink/60">
            Live Permission Gate Verification
          </p>
          <h2 className="font-display text-xl uppercase mt-1">ENSv2 Enhanced Access Control (EAC)</h2>
        </div>
        <span className="font-mono text-xs border border-ink/30 px-2 py-0.5 bg-paper-muted">
          Role-Based Gating
        </span>
      </div>

      <p className="text-sm text-ink/80">
        Test Scout&apos;s onchain permission boundaries. In ENSv2, the agent wallet is assigned{" "}
        <code className="bg-paper-muted px-1 py-0.5 border border-ink/20 font-mono text-xs">ROLE_TEXT</code>{" "}
        for research status records, but is explicitly blocked from high-privilege operations like transferring names or modifying resolvers.
      </p>

      <div className="flex flex-wrap gap-4">
        <Button
          variant="secondary"
          loading={loading === "auth"}
          onClick={() => handleTest("authorized")}
        >
          Test Authorized Action (Update Status)
        </Button>
        <Button
          variant="danger"
          loading={loading === "unauth"}
          onClick={() => handleTest("unauthorized")}
        >
          Test Unauthorized Action (Transfer / Upgrade)
        </Button>
      </div>

      {result && (
        <div className="border-brutal p-4 bg-paper-muted font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-ink/20 pb-2">
            <span className="font-bold uppercase">
              Action: {result.action === "authorized" ? "Update research.status" : "Transfer / Change Resolver"}
            </span>
            <span
              className={`px-2 py-0.5 font-bold uppercase ${
                result.success ? "bg-success text-paper" : "bg-error text-paper"
              }`}
            >
              {result.success ? `HTTP ${result.status} ALLOWED` : `HTTP ${result.status} BLOCKED`}
            </span>
          </div>

          <p className="text-ink/80">
            {result.success
              ? "Operation succeeded under ROLE_TEXT delegation. ENS record verified."
              : "Access denied by Permissioned Resolver: Account lacks permission for this namespace key."}
          </p>

          <pre className="bg-paper p-3 border border-ink/20 overflow-x-auto text-[11px]">
            {JSON.stringify(result.data, null, 2)}
          </pre>
          <p className="text-ink/40 text-[10px]">Verified at {result.timestamp}</p>
        </div>
      )}
    </Card>
  );
}
