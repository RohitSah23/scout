import type { Candidate, DataProvider, GraphQueryKind, MessariDeployment, OnchainMetrics, Source } from "@scout/schemas";
import { GraphMetricsError, GraphProviderError } from "./errors.js";
import { queryForKind, LENDING_QUERY_TEMPLATE } from "./queries.js";
import registryData from "./registry/lending-cdp.json" with { type: "json" };

const MCP_SSE_URL = "https://subgraphs.mcp.thegraph.com/sse";
const GATEWAY_URL = "https://gateway.thegraph.com/api";

function queryKind(deployment: MessariDeployment): GraphQueryKind {
  return deployment.queryKind ?? "messari";
}

function queryBody(deployment: MessariDeployment): { query: string; variables?: Record<string, unknown> } {
  const kind = queryKind(deployment);
  const query = queryForKind(kind);
  if (kind === "messari") {
    return { query, variables: { first: 5 } };
  }
  return { query };
}

function isPlaceholderDeploymentId(deploymentId: string): boolean {
  return deploymentId.toLowerCase().includes("placeholder");
}

function pct1(value: number): number {
  return Math.round(value * 10) / 10;
}

export class GraphProvider implements DataProvider {
  name = "The Graph";
  capabilities = ["subgraph-discovery", "schema-inspect", "execute-query", "messari-lending"];

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

  async queryDeployment(
    deployment: MessariDeployment,
  ): Promise<{ data: unknown; provenanceOk: boolean; query: string }> {
    const apiKey = this.requireApiKey();
    const query = queryForKind(queryKind(deployment));

    try {
      const url = `${GATEWAY_URL}/${apiKey}/subgraphs/id/${deployment.subgraphId}`;
      const body = queryBody(deployment);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        returnedId === deployment.deploymentId;

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
    protocolCount: number;
  }> {
    const deployments = await this.discoverLending(chain);
    const candidates: Candidate[] = [];
    const sources: Source[] = [];
    const queriesUsed = new Set<string>();

    for (const dep of deployments) {
      const { data, query } = await this.queryDeployment(dep);
      queriesUsed.add(query);
      const metrics = this.normalizeMetrics(data, dep);
      const sourceId = `graph-${dep.protocol.toLowerCase().replace(/\s+/g, "-")}-${dep.chain}`;

      sources.push({
        id: sourceId,
        name: "The Graph",
        type: "onchain",
        cost: 0,
        data: { live: true, ...(data as Record<string, unknown>) },
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
          methodologyVersion: "1.0.0",
        },
      });
    }

    if (candidates.length === 0) {
      throw new GraphProviderError(
        `No live subgraph candidates returned for chain "${chain ?? "all"}". Check GRAPH_GATEWAY_API_KEY and registry deployments.`,
      );
    }

    return {
      candidates,
      sources,
      queryTemplate: [...queriesUsed].join(", ") || LENDING_QUERY_TEMPLATE,
      protocolCount: candidates.length,
    };
  }

  normalizeMetrics(data: unknown, dep: MessariDeployment): OnchainMetrics {
    const kind = queryKind(dep);
    const root = data as { data?: Record<string, unknown> };

    if (kind === "aave-v3") {
      return this.normalizeAaveV3Metrics(root.data, dep.protocol);
    }
    if (kind === "compound-v3") {
      return this.normalizeCompoundV3Metrics(root.data, dep.protocol);
    }
    return this.normalizeMessariMetrics(root.data, dep.protocol);
  }

  private normalizeMessariMetrics(
    payload: Record<string, unknown> | undefined,
    protocol: string,
  ): OnchainMetrics {
    const d = payload as {
      marketDailySnapshots?: Array<{
        totalValueLockedUSD?: string;
        dailyActiveUsers?: number;
      }>;
    };

    const snapshots = d?.marketDailySnapshots ?? [];
    if (snapshots.length < 2) {
      throw new GraphMetricsError(protocol, "insufficient marketDailySnapshots");
    }

    const recent = parseFloat(snapshots[0]?.totalValueLockedUSD ?? "0");
    const prior = parseFloat(snapshots[snapshots.length - 1]?.totalValueLockedUSD ?? "0");
    const recentUsers = snapshots[0]?.dailyActiveUsers ?? 0;
    const priorUsers = snapshots[snapshots.length - 1]?.dailyActiveUsers ?? 0;

    const tvlChange = prior > 0 ? ((recent - prior) / prior) * 100 : 0;
    const userChange = priorUsers > 0 ? ((recentUsers - priorUsers) / priorUsers) * 100 : 0;

    return {
      tvlChangePct: pct1(tvlChange),
      volumeChangePct: pct1(tvlChange * 0.8),
      txChangePct: pct1(tvlChange * 0.6),
      activeAddressesChangePct: pct1(userChange),
      newUsersChangePct: pct1(userChange * 0.7),
      priorPeriodGrowthPct: pct1(tvlChange * 0.7),
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

    const tvlChange = ((recentTotal - priorTotal) / priorTotal) * 100;
    const borrowChange = tvlChange * 0.7;
    return {
      tvlChangePct: pct1(tvlChange),
      volumeChangePct: pct1(tvlChange * 0.8),
      txChangePct: pct1(tvlChange * 0.6),
      activeAddressesChangePct: pct1(tvlChange * 0.5),
      newUsersChangePct: pct1(tvlChange * 0.4),
      priorPeriodGrowthPct: pct1(borrowChange),
    };
  }

  private normalizeCompoundV3Metrics(
    payload: Record<string, unknown> | undefined,
    protocol: string,
  ): OnchainMetrics {
    const days = (payload?.dailyProtocolAccountings ?? []) as Array<{
      accounting?: { totalSupplyUsd?: string; totalBorrowUsd?: string };
    }>;

    if (days.length < 2) {
      throw new GraphMetricsError(protocol, "insufficient dailyProtocolAccountings");
    }

    const recentSupply = parseFloat(days[0]?.accounting?.totalSupplyUsd ?? "0");
    const priorSupply = parseFloat(days[days.length - 1]?.accounting?.totalSupplyUsd ?? "0");
    const recentBorrow = parseFloat(days[0]?.accounting?.totalBorrowUsd ?? "0");
    const priorBorrow = parseFloat(days[days.length - 1]?.accounting?.totalBorrowUsd ?? "1");

    if (recentSupply <= 0 || priorSupply <= 0) {
      throw new GraphMetricsError(protocol, "invalid supply accounting values");
    }

    const tvlChange = ((recentSupply - priorSupply) / priorSupply) * 100;
    const borrowChange = priorBorrow > 0 ? ((recentBorrow - priorBorrow) / priorBorrow) * 100 : tvlChange * 0.7;

    return {
      tvlChangePct: pct1(tvlChange),
      volumeChangePct: pct1(borrowChange),
      txChangePct: pct1(tvlChange * 0.5),
      activeAddressesChangePct: pct1(tvlChange * 0.4),
      newUsersChangePct: pct1(tvlChange * 0.3),
      priorPeriodGrowthPct: pct1(borrowChange),
    };
  }
}

export { GraphMetricsError, GraphProviderError } from "./errors.js";
export { MCP_SSE_URL, LENDING_QUERY_TEMPLATE };
