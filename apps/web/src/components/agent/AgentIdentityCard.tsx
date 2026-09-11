import { ToolBadge } from "@/components/ui/Badge";

export function AgentIdentityCard({
  name,
  ensName = "scout.base.eth",
  budgetCap = 0.5,
  status = "ACTIVE",
  mcpEndpoint,
}: {
  name: string;
  ensName?: string;
  budgetCap?: number;
  status?: string;
  mcpEndpoint?: string;
}) {
  return (
    <div className="border-brutal p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-ink/60">Autonomous Agent</p>
          <h1 className="font-mono text-2xl md:text-3xl mt-2 font-bold">{name}</h1>
          <p className="font-mono text-sm text-signal mt-1">ENS: {ensName}</p>
          {mcpEndpoint && (
            <a
              href={mcpEndpoint}
              target="_blank"
              rel="noreferrer"
              className="block font-mono text-xs text-ink/60 mt-1 underline underline-offset-2 break-all"
            >
              MCP: {mcpEndpoint}
            </a>
          )}
          <p className="font-display text-sm uppercase mt-2 text-ink/70">Protocol Research & Intelligence Agent</p>
        </div>
        <span className="font-mono text-xs border border-ink/30 px-2.5 py-1 bg-paper-muted">
          ENSv2 Sepolia Beta
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-sm pt-4 border-t border-ink/10">
        <div>
          <p className="text-ink/50 uppercase text-xs">Status</p>
          <p className="text-success font-bold">{status}</p>
        </div>
        <div>
          <p className="text-ink/50 uppercase text-xs">Budget Cap</p>
          <p className="font-bold">${budgetCap.toFixed(2)} USDC</p>
        </div>
        <div>
          <p className="text-ink/50 uppercase text-xs">Role Model</p>
          <p className="text-ink/80">EAC Permissioned</p>
        </div>
        <div>
          <p className="text-ink/50 uppercase text-xs">Data Sources</p>
          <div className="flex gap-1 mt-1">
            <ToolBadge tool="graph" />
            <ToolBadge tool="openseo" />
          </div>
        </div>
      </div>
    </div>
  );
}
