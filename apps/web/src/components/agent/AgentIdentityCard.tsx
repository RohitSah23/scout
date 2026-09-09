import { ToolBadge } from "@/components/ui/Badge";

export function AgentIdentityCard({
  name,
  status = "ACTIVE",
}: {
  name: string;
  status?: string;
}) {
  return (
    <div className="border-brutal p-8 space-y-6">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/60">Agent</p>
        <h1 className="font-mono text-2xl md:text-3xl mt-2">{name}</h1>
        <p className="font-display text-sm uppercase mt-2 text-ink/70">Protocol Research Agent</p>
      </div>

      <div className="grid grid-cols-2 gap-4 font-mono text-sm">
        <div>
          <p className="text-ink/50 uppercase text-xs">Status</p>
          <p className="text-success">{status}</p>
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
