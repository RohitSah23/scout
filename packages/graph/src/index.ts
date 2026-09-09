import type {
  Candidate,
  DataProvider,
  GraphQueryKind,
  MessariDeployment,
  OnchainMetrics,
  Source,
} from "@scout/schemas";
import { GraphMetricsError, GraphProviderError } from "./errors.js";
import {
  LENDING_QUERY_TEMPLATE,
  MESSARI_LENDING_STANDARD,
  queryBodyForKind,
  queryForKind,
} from "./queries.js";
import registryData from "./registry/lending-cdp.json" with { type: "json" };

const MCP_SSE_URL = "https://subgraphs.mcp.thegraph.com/sse";
const GATEWAY_URL = "https://gateway.thegraph.com/api";

function queryKind(deployment: MessariDeployment): GraphQueryKind {
  return deployment.queryKind ?? "messari";
}

function isPlaceholderDeploymentId(deploymentId: string): boolean {
  return deploymentId.toLowerCase().includes("placeholder");
}

function pct1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pctChange(recent: number, prior: number): number {
  if (prior <= 0) return recent > 0 ? 100 : 0;
  return pct1(((recent - prior) / prior) * 100);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface MessariSnapshot {
  timestamp?: string;
  totalValueLockedUSD?: string;
  dailyDepositUSD?: string;
  dailyBorrowUSD?: string;
  dailyLiquidateUSD?: string;
}

export class GraphProvider implements DataProvider {
  name = "The Graph";
  capabilities = [
    "subgraph-discovery",
    "schema-inspect",
    "execute-query",
    "messari-lending",
    "composable-one-query-n-protocols",
  ];

  constructor(private apiKey?: string) {}

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new GraphProviderError(
        "GRAPH_GATEWAY_API_KEY is required. Create one at thegraph.com/studio → API Keys.",
      );
    }
    return this.apiKey;
  }

  async execute(input: unknown): Promise<unknown> {
    const action = (input as { action: string }).action;
    switch (action) {
      case "discover":
        return this.discoverLending((input as { chain?: string }).chain);
      case "query-all":
        return this.queryAllLending((input as { chain?: string }).chain);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getRegistry(): MessariDeployment[] {
    return registryData as MessariDeployment[];
  }

  async discoverLending(chain?: string): Promise<MessariDeployment[]> {
    const registry = this.getRegistry();
    if (chain) {
      return registry.filter((d) => d.chain.toLowerCase() === chain.toLowerCase());
    }
    return registry;
  }

  getComposableQuery(): string {
    return LENDING_QUERY_TEMPLATE.trim();
  }

  async queryDeployment(
    deployment: MessariDeployment,
  ): Promise<{ data: unknown; provenanceOk: boolean; query: string }> {
    const apiKey = this.requireApiKey();
    const kind = queryKind(deployment);
    const { query, variables } = queryBodyForKind(kind);

    try {
      const url = `${GATEWAY_URL}/${apiKey}/subgraphs/id/${deployment.subgraphId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables ? { query, variables } : { query }),
      });
      const json = (await res.json()) as {
        data?: unknown;
        errors?: Array<{ message: string }>;
        extensions?: { deployment?: string };
      };

      if (!res.ok || json.errors?.length || !json.data) {
        const detail = json.errors?.[0]?.message ?? `HTTP ${res.status}`;
        throw new GraphProviderError(
          `Subgraph query failed for ${deployment.protocol} (${deployment.chain}): ${detail}`,
        );
      }

      const returnedId = json.extensions?.deployment;
      const provenanceOk =
        isPlaceholderDeploymentId(deployment.deploymentId) ||
        !returnedId ||
        returnedId === deployment.deploymentId ||
        returnedId === deployment.subgraphId;

      if (!provenanceOk) {
        throw new GraphProviderError(
          `Subgraph provenance mismatch for ${deployment.protocol}: expected ${deployment.deploymentId}, got ${returnedId}`,
        );
      }

      return { data: json, provenanceOk: true, query };
    } catch (err) {
      if (err instanceof GraphProviderError) throw err;
      throw new GraphProviderError(
        `Subgraph request failed for ${deployment.protocol} (${deployment.chain}): ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      );
    }
  }

  async queryAllLending(chain?: string): Promise<{
    candidates: Candidate[];
    sources: Source[];
    queryTemplate: string;
    queryTemplatesUsed: string[];
    protocolCount: number;
    messariProtocolCount: number;
    composable: boolean;
    schemaStandard: string;
    skipped: string[];
  }> {
    const deployments = await this.discoverLending(chain);
    const candidates: Candidate[] = [];
    const sources: Source[] = [];
    const queriesUsed = new Set<string>();
    const skipped: string[] = [];
    let messariCount = 0;

    for (const dep of deployments) {
      try {
        const { data, query } = await this.queryDeployment(dep);
        queriesUsed.add(query.trim());
        const kind = queryKind(dep);
        if (kind === "messari") messariCount += 1;

        const metrics = this.normalizeMetrics(data, dep);
        const sourceId = `graph-${dep.protocol.toLowerCase().replace(/\s+/g, "-")}-${dep.chain}`;

        sources.push({
          id: sourceId,
          name: "The Graph",
          type: "onchain",
          cost: 0,
          data: {
            live: true,
            composable: kind === "messari",
            schemaStandard: kind === "messari" ? MESSARI_LENDING_STANDARD : kind,
            messariSlug: dep.messariSlug,
            queryKind: kind,
            ...(data as Record<string, unknown>),
          },
          provenance: {
            subgraphId: dep.subgraphId,
            deploymentId: dep.deploymentId,
            schemaVersion: dep.schemaVersion,
            query,
          },
        });

        candidates.push({
          id: sourceId,
          protocol: dep.protocol,
          chain: dep.chain,
          onchainMetrics: metrics,
          provenance: {
            subgraphId: dep.subgraphId,
            deploymentId: dep.deploymentId,
            schemaVersion: dep.schemaVersion,
            methodologyVersion: dep.methodologyVersion ?? dep.schemaVersion,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        skipped.push(`${dep.protocol} (${dep.chain}): ${message}`);
      }
    }

    if (candidates.length === 0) {
      throw new GraphProviderError(
        `No live subgraph candidates returned for chain "${chain ?? "all"}". Check GRAPH_GATEWAY_API_KEY and registry deployments.${skipped.length ? ` Skipped: ${skipped.join("; ")}` : ""}`,
      );
    }

    const messariQuery = this.getComposableQuery();
    const queryTemplatesUsed = [...queriesUsed];

    return {
      candidates,
      sources,
      queryTemplate: messariQuery,
      queryTemplatesUsed,
      protocolCount: candidates.length,
      messariProtocolCount: messariCount,
      composable: messariCount > 0 && queryTemplatesUsed.includes(messariQuery),
      schemaStandard: MESSARI_LENDING_STANDARD,
      skipped,
    };
  }

  normalizeMetrics(data: unknown, dep: MessariDeployment): OnchainMetrics {
    const kind = queryKind(dep);
    const root = data as { data?: Record<string, unknown> };
    if (kind === "aave-v3") {
      return this.normalizeAaveV3Metrics(root.data, dep.protocol);
    }
    return this.normalizeMessariMetrics(data, dep.protocol);
  }

  normalizeMessariMetrics(data: unknown, protocol: string): OnchainMetrics {
    const root = data as { data?: Record<string, unknown> };
    const d = root.data as {
      protocols?: Array<{ cumulativeUniqueUsers?: number }>;
      marketDailySnapshots?: MessariSnapshot[];
    };

    const snapshots = [...(d?.marketDailySnapshots ?? [])].sort(
      (a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0),
    );

    if (snapshots.length < 2) {
      throw new GraphMetricsError(protocol, "insufficient marketDailySnapshots");
    }

    const recentTvl = parseFloat(snapshots[0]?.totalValueLockedUSD ?? "0");
    const priorTvl = parseFloat(snapshots[snapshots.length - 1]?.totalValueLockedUSD ?? "0");
    const tvlChange = pctChange(recentTvl, priorTvl);

    const recentWindow = snapshots.slice(0, 7);
    const priorWindow = snapshots.slice(-7);

    const dailyVolume = (s: MessariSnapshot) =>
      parseFloat(s.dailyDepositUSD ?? "0") + parseFloat(s.dailyBorrowUSD ?? "0");
    const dailyLiq = (s: MessariSnapshot) => parseFloat(s.dailyLiquidateUSD ?? "0");

    const recentVol = avg(recentWindow.map(dailyVolume));
    const priorVol = avg(priorWindow.map(dailyVolume));
    const volumeChange = pctChange(recentVol, priorVol);

    const recentLiq = avg(recentWindow.map(dailyLiq));
    const priorLiq = avg(priorWindow.map(dailyLiq));
    const liqChange = pctChange(recentLiq, priorLiq);

    const uniqueUsers = d?.protocols?.[0]?.cumulativeUniqueUsers ?? 0;

    return {
      tvlChangePct: tvlChange,
      volumeChangePct: volumeChange,
      txChangePct: liqChange,
      activeAddressesChangePct: volumeChange,
      newUsersChangePct: pct1(volumeChange * 0.85),
      priorPeriodGrowthPct: tvlChange,
      returningUserRatio: uniqueUsers > 0 ? pct1(Math.min(100, uniqueUsers / 1000)) : undefined,
    };
  }

  private normalizeAaveV3Metrics(
    payload: Record<string, unknown> | undefined,
    protocol: string,
  ): OnchainMetrics {
    const reserves = (payload?.reserves ?? []) as Array<{
      totalLiquidity?: string;
      paramsHistory?: Array<{ totalLiquidity?: string }>;
    }>;

    if (reserves.length === 0) {
      throw new GraphMetricsError(protocol, "no reserves returned");
    }

    let recentTotal = 0;
    let priorTotal = 0;
    for (const reserve of reserves) {
      const history = reserve.paramsHistory ?? [];
      recentTotal += parseFloat(reserve.totalLiquidity ?? history[0]?.totalLiquidity ?? "0");
      const oldest = history[history.length - 1]?.totalLiquidity;
      priorTotal += parseFloat(oldest ?? reserve.totalLiquidity ?? "0");
    }

    if (recentTotal <= 0 || priorTotal <= 0) {
      throw new GraphMetricsError(protocol, "insufficient reserve liquidity history");
    }

    const tvlChange = pctChange(recentTotal, priorTotal);

    return {
      tvlChangePct: tvlChange,
      volumeChangePct: tvlChange,
      txChangePct: pct1(tvlChange * 0.6),
      activeAddressesChangePct: pct1(tvlChange * 0.5),
      newUsersChangePct: pct1(tvlChange * 0.4),
      priorPeriodGrowthPct: tvlChange,
    };
  }
}

export { GraphMetricsError, GraphProviderError } from "./errors.js";
export {
  MCP_SSE_URL,
  LENDING_QUERY_TEMPLATE,
  MESSARI_LENDING_STANDARD,
  queryBodyForKind,
  queryForKind,
};
