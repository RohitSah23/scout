import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "signal" | "success" | "warning" | "graph" | "openseo" | "x402" | "ens" | "privy";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-paper-muted text-ink",
  signal: "bg-signal text-paper",
  success: "bg-success text-paper",
  warning: "bg-warning text-paper",
  graph: "bg-ink text-paper",
  openseo: "bg-paper-dark text-paper",
  x402: "bg-signal text-paper",
  ens: "bg-paper-muted text-ink border border-ink",
  privy: "bg-ink text-paper",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function SourceBadge({ name, index }: { name: string; index: number }) {
  const variant = name.toLowerCase().includes("graph")
    ? "graph"
    : name.toLowerCase().includes("openseo") || name.toLowerCase().includes("seo")
      ? "openseo"
      : name.toLowerCase().includes("deep")
        ? "x402"
        : "default";
  const short = name.toUpperCase().replace(" ", " ").slice(0, 12);
  return (
    <Badge variant={variant} className="cursor-pointer hover:opacity-80">
      {short} #{String(index).padStart(2, "0")}
    </Badge>
  );
}

export function ToolBadge({ tool }: { tool: string }) {
  const map: Record<string, BadgeVariant> = {
    graph: "graph",
    thegraph: "graph",
    openseo: "openseo",
    x402: "x402",
    ens: "ens",
    privy: "privy",
  };
  const key = tool.toLowerCase().replace(/\s+/g, "");
  return <Badge variant={map[key] ?? "default"}>{tool}</Badge>;
}
