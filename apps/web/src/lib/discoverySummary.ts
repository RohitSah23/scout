import type { Candidate, ResearchSession } from "@scout/schemas";

export interface SkippedDeployment {
  protocol: string;
  chain: string;
  reason: string;
}

export interface DiscoverySummary {
  discoveredCount: number;
  liveCount: number;
  skippedCount: number;
  skipped: SkippedDeployment[];
}

const SKIP_PATTERN = /^(.+?)\s+\(([^)]+)\):\s*(.+)$/;

export function parseSkippedEntry(entry: string): SkippedDeployment | null {
  const match = entry.match(SKIP_PATTERN);
  if (!match) return null;
  return {
    protocol: match[1].trim(),
    chain: match[2].trim(),
    reason: match[3].trim(),
  };
}

function payloadNumber(payload: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = payload?.[key];
  return typeof value === "number" ? value : undefined;
}

function payloadSkipped(payload: Record<string, unknown> | undefined): string[] {
  const value = payload?.skipped;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function getDiscoverySummary(session: ResearchSession | null): DiscoverySummary | null {
  if (!session) return null;

  const candidatesEntry = session.decisionLog.find((entry) => entry.eventType === "candidates.updated");
  const graphEntry = session.decisionLog.find((entry) => entry.eventType === "graph.query");

  const discoveredCount =
    payloadNumber(candidatesEntry?.payload, "discoveredCount") ??
    payloadNumber(graphEntry?.payload, "discoveredCount");
  const liveCount =
    payloadNumber(candidatesEntry?.payload, "count") ??
    payloadNumber(graphEntry?.payload, "protocolCount") ??
    session.candidates.length;
  const skippedRaw =
    payloadSkipped(candidatesEntry?.payload).length > 0
      ? payloadSkipped(candidatesEntry?.payload)
      : payloadSkipped(graphEntry?.payload);
  const skipped = skippedRaw
    .map(parseSkippedEntry)
    .filter((entry): entry is SkippedDeployment => entry !== null);
  const skippedCount =
    payloadNumber(candidatesEntry?.payload, "skippedCount") ?? skippedRaw.length;

  if (discoveredCount === undefined && liveCount === 0 && skipped.length === 0) {
    return null;
  }

  return {
    discoveredCount: discoveredCount ?? liveCount + skippedCount,
    liveCount,
    skippedCount,
    skipped,
  };
}

export function isLiveCandidate(
  protocol: string,
  chain: string,
  candidates: Candidate[],
): boolean {
  const key = `${protocol.toLowerCase()}|${chain.toLowerCase()}`;
  return candidates.some(
    (candidate) => `${candidate.protocol.toLowerCase()}|${candidate.chain.toLowerCase()}` === key,
  );
}

export function formatDiscoveryHeadline(summary: DiscoverySummary): string {
  const parts = [
    `${summary.discoveredCount} discovered`,
    `${summary.liveCount} live`,
  ];
  if (summary.skippedCount > 0) {
    parts.push(`${summary.skippedCount} skipped`);
  }
  return parts.join(" · ");
}

export function getDiscoveryEntries(
  session: ResearchSession | null,
): Array<{ protocol: string; chain: string; status: "live" | "skipped"; reason?: string }> {
  const summary = getDiscoverySummary(session);
  if (!summary || !session) return [];

  const entries: Array<{ protocol: string; chain: string; status: "live" | "skipped"; reason?: string }> =
    session.candidates.map((candidate) => ({
      protocol: candidate.protocol,
      chain: candidate.chain,
      status: "live",
    }));

  for (const skipped of summary.skipped) {
    if (!isLiveCandidate(skipped.protocol, skipped.chain, session.candidates)) {
      entries.push({
        protocol: skipped.protocol,
        chain: skipped.chain,
        status: "skipped",
        reason: skipped.reason,
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : 1;
    return a.protocol.localeCompare(b.protocol);
  });
}
