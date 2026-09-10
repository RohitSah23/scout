import type {
  Candidate,
  DataProvider,
  GraphQueryKind,
  MessariDeployment,
  OnchainMetrics,
  Source,
} from "@scout/schemas";
import { GraphMetricsError, GraphProviderError } from "./errors.js";
import { discoverDeployments } from "./discovery.js";
import {
  LENDING_QUERY_TEMPLATE,
  MESSARI_LENDING_STANDARD,
  queryBodyForKind,
  queryForKind,
} from "./queries.js";
import { extractTokenCandidates } from "./tokenCandidates.js";
import { aggregateHourlyTrending, oneHourAgoUnix } from "./trending.js";

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

  async getRegistry(): Promise<MessariDeployment[]> {
    return discoverDeployments();
  }

  async discoverLending(chain?: string): Promise<MessariDeployment[]> {
    return discoverDeployments(chain);
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
    tokenCount: number;
    messariProtocolCount: number;
    discoveredCount: number;
    composable: boolean;
    schemaStandard: string;
    skipped: string[];
  }> {
    const deployments = await this.discoverLending(chain);
    const discoveredCount = deployments.length;
    const candidates: Candidate[] = [];
    const sources: Source[] = [];
    const queriesUsed = new Set<string>();
    const skipped: string[] = [];
    let messariCount = 0;
    let protocolCount = 0;

    const results = await Promise.all(
      deployments.map(async (dep) => {
        try {
          const { data, query } = await this.queryDeployment(dep);
          const kind = queryKind(dep);
          const sourceData = this.enrichSourceData(data, kind, dep);
          return { dep, data: sourceData, query, kind };
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown error";
          skipped.push(`${dep.protocol} (${dep.chain}): ${message}`);
          return null;
        }
      }),
    );

    for (const result of results) {
      if (!result) continue;
      const { dep, data, query, kind } = result;
      queriesUsed.add(query.trim());
      if (kind === "messari") messariCount += 1;
      protocolCount += 1;

      const root = data as { data?: Record<string, unknown> };
      const payload = root.data ?? {};
      const trendingReserves = payload.trendingReserves as ReturnType<
        typeof aggregateHourlyTrending
      > | undefined;

      const tokenRows = extractTokenCandidates(dep, kind, payload, trendingReserves);
      if (tokenRows.length === 0) {
        skipped.push(`${dep.protocol} (${dep.chain}): no token markets returned`);
        continue;
      }
      candidates.push(...tokenRows);

      const slugKey = (dep.messariSlug ?? `${dep.protocol}-${dep.chain}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const sourceId = `graph-${slugKey}`;

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
          sourceProtocol: dep.protocol,
          tokenCandidates: tokenRows,
          ...(data as Record<string, unknown>),
        },
        provenance: {
          subgraphId: dep.subgraphId,
          deploymentId: dep.deploymentId,
          schemaVersion: dep.schemaVersion,
          query,
        },
      });
    }

    if (candidates.length === 0) {
      throw new GraphProviderError(
        `No live lending assets returned for chain "${chain ?? "all"}". Check GRAPH_GATEWAY_API_KEY and registry deployments.${skipped.length ? ` Skipped: ${skipped.join("; ")}` : ""}`,
      );
    }

    const messariQuery = this.getComposableQuery();
    const queryTemplatesUsed = [...queriesUsed];

    return {
      candidates,
      sources,
      queryTemplate: messariQuery,
      queryTemplatesUsed,
      protocolCount,
      tokenCount: candidates.length,
      discoveredCount,
      messariProtocolCount: messariCount,
      composable: messariCount > 0 && queryTemplatesUsed.includes(messariQuery),
      schemaStandard: MESSARI_LENDING_STANDARD,
      skipped,
    };
  }

  private enrichSourceData(
    data: unknown,
    kind: GraphQueryKind,
    dep: MessariDeployment,
  ): unknown {
    const root = data as { data?: Record<string, unknown> };
    const payload = root.data ?? {};

    if (kind === "aave-v3-trending") {
      const trendingReserves = aggregateHourlyTrending(payload);
      return {
        data: {
          ...payload,
          trendingReserves,
          markets: trendingReserves.map((row) => ({
            id: row.symbol,
            name: row.symbol,
            totalValueLockedUSD: String(row.grossFlowUsd),
            inputToken: { symbol: row.symbol },
          })),
          windowHours: 1,
          oneHourAgo: oneHourAgoUnix(),
          sourceProtocol: dep.protocol,
        },
      };
    }

    if (kind === "messari") {
      const protocolSnapshots = payload.protocolSnapshots ?? payload.marketDailySnapshots;
      return {
        data: {
          ...payload,
          marketDailySnapshots: protocolSnapshots,
          sourceProtocol: dep.protocol,
        },
      };
    }

    return data;
  }

  normalizeMetrics(data: unknown, dep: MessariDeployment): OnchainMetrics {
    const kind = queryKind(dep);
    const root = data as { data?: Record<string, unknown> };
    if (kind === "aave-v3-trending") {
      return this.normalizeAaveV3TrendingMetrics(root.data, dep.protocol);
    }
    if (kind === "aave-v3") {
      return this.normalizeAaveV3Metrics(root.data, dep.protocol);
    }
    if (kind === "compound-v3") {
      return this.normalizeCompoundV3Metrics(root.data, dep.protocol);
    }
    return this.normalizeMessariMetrics(data, dep.protocol);
  }

  normalizeMessariMetrics(data: unknown, protocol: string): OnchainMetrics {
    const root = data as { data?: Record<string, unknown> };
    const d = root.data as {
      protocols?: Array<{ cumulativeUniqueUsers?: number }>;
      marketDailySnapshots?: MessariSnapshot[];
      protocolSnapshots?: MessariSnapshot[];
    };

    const protocolSnapshots = d?.protocolSnapshots ?? d?.marketDailySnapshots;

    const snapshots = [...(protocolSnapshots ?? [])].sort(
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

  private normalizeAaveV3TrendingMetrics(
    payload: Record<string, unknown> | undefined,
    protocol: string,
  ): OnchainMetrics {
    const trending = (payload?.trendingReserves ?? []) as Array<{
      trendingScore?: number;
      grossFlowUsd?: number;
      netInflowUsd?: number;
      liquidationUsd?: number;
    }>;

    if (trending.length === 0) {
      throw new GraphMetricsError(protocol, "no trending reserves in last hour");
    }

    const top = trending[0];
    const avgScore =
      trending.reduce((sum, row) => sum + (row.trendingScore ?? 0), 0) / trending.length;
    const momentum = avgScore > 0 ? pctChange(top.trendingScore ?? 0, avgScore) : 100;
    const grossFlow = top.grossFlowUsd ?? 0;
    const netPct = grossFlow > 0 ? pct1(((top.netInflowUsd ?? 0) / grossFlow) * 100) : 0;
    const liqPct = grossFlow > 0 ? pct1(((top.liquidationUsd ?? 0) / grossFlow) * 100) : 0;

    return {
      tvlChangePct: netPct,
      volumeChangePct: momentum,
      txChangePct: liqPct,
      activeAddressesChangePct: momentum,
      newUsersChangePct: pct1(momentum * 0.5),
      priorPeriodGrowthPct: netPct,
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
    const priorBorrow = parseFloat(days[days.length - 1]?.accounting?.totalBorrowUsd ?? "0");

    const tvlChange = pctChange(recentSupply, priorSupply);
    const borrowChange = pctChange(recentBorrow, priorBorrow);

    return {
      tvlChangePct: tvlChange,
      volumeChangePct: borrowChange,
      txChangePct: pct1(tvlChange * 0.5),
      activeAddressesChangePct: pct1(tvlChange * 0.4),
      newUsersChangePct: pct1(tvlChange * 0.3),
      priorPeriodGrowthPct: borrowChange,
    };
  }
}

export { GraphMetricsError, GraphProviderError } from "./errors.js";
export { extractTokenCandidates } from "./tokenCandidates.js";
export { aggregateHourlyTrending, oneHourAgoUnix } from "./trending.js";
export {
  MCP_SSE_URL,
  LENDING_QUERY_TEMPLATE,
  MESSARI_LENDING_STANDARD,
  queryBodyForKind,
  queryForKind,
};
