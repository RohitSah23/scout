import type { SeoMetrics } from "@scout/schemas";

export interface KeywordTrendPoint {
  year: number;
  month: number;
  searchVolume: number;
}

export interface KeywordRow {
  keyword: string;
  searchVolume: number;
  trend?: KeywordTrendPoint[];
  cpc?: number;
  competition?: number;
  keywordDifficulty?: number;
  intent?: string;
}

export interface ResearchKeywordsResult {
  results?: Array<{
    seed: string;
    ok: boolean;
    rows?: KeywordRow[];
  }>;
}

export interface SerpItem {
  type?: string;
  rank?: number;
  domain?: string | null;
  url?: string | null;
}

export interface SerpResultsPayload {
  results?: Array<{
    keyword: string;
    ok: boolean;
    items?: SerpItem[];
  }>;
}

const DEV_INTENTS = new Set(["commercial", "transactional"]);
const DEV_KEYWORDS = ["sdk", "api", "docs", "developer", "integrate", "build"];

function pct1(value: number): number {
  return Math.round(value * 10) / 10;
}

function protocolTokens(protocol: string): string[] {
  const lower = protocol.toLowerCase();
  const tokens = lower.split(/\s+/).filter((t) => t.length > 2);
  if (lower.includes("compound")) tokens.push("compound");
  if (lower.includes("aave")) tokens.push("aave");
  if (lower.includes("moonwell")) tokens.push("moonwell");
  if (lower.includes("seamless")) tokens.push("seamless");
  if (lower.includes("spark")) tokens.push("spark");
  if (lower.includes("maker")) tokens.push("makerdao", "maker");
  if (lower.includes("euler")) tokens.push("euler");
  if (lower.includes("liquity")) tokens.push("liquity");
  if (lower.includes("morpho")) tokens.push("morpho");
  if (lower.includes("radiant")) tokens.push("radiant");
  if (lower.includes("sonne")) tokens.push("sonne");
  if (lower.includes("qidao") || lower.includes("qi dao")) tokens.push("qidao");
  if (lower.includes("rwa")) tokens.push("rwa", "aave");
  if (lower.includes("arc")) tokens.push("aave");
  if (lower.includes("amm")) tokens.push("aave");
  return [...new Set(tokens)];
}

export function neutralSeoMetrics(): SeoMetrics {
  return {
    searchDemandChangePct: 0,
    organicVisibility: 0,
    contentGapScore: 20,
    competitorSerpDominance: 50,
    developerIntentScore: 20,
    aiVisibilityScore: 0,
  };
}

function rowMatchesProtocol(row: KeywordRow, protocol: string): boolean {
  const keyword = row.keyword.toLowerCase();
  return protocolTokens(protocol).some((token) => keyword.includes(token));
}

function trendChangePct(trend: KeywordTrendPoint[] | undefined): number {
  if (!trend || trend.length < 4) return 0;
  const sorted = [...trend].sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  const recent = sorted.slice(0, 3).map((p) => p.searchVolume);
  const prior = sorted.slice(3, 6).map((p) => p.searchVolume);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const priorAvg = prior.reduce((a, b) => a + b, 0) / (prior.length || 1);
  if (priorAvg <= 0) return recentAvg > 0 ? 100 : 0;
  return pct1(((recentAvg - priorAvg) / priorAvg) * 100);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function competitorSerpDominance(items: SerpItem[] | undefined, protocol: string): number {
  const organic = (items ?? []).filter((i) => i.type === "organic" && i.domain);
  if (organic.length === 0) return 50;

  const protocolDomains = protocolTokens(protocol).map((t) => `${t}.`);
  const official = organic.filter((i) =>
    protocolDomains.some((token) => (i.domain ?? "").includes(token.replace(".", ""))),
  ).length;

  const majorPublishers = organic.filter((i) =>
    /defillama|binance|coinbase|nansen|github|medium|reddit|youtube/.test(i.domain ?? ""),
  ).length;

  const dominance = ((official + majorPublishers) / organic.length) * 100;
  return pct1(Math.min(100, dominance));
}

function aiVisibilityScore(items: SerpItem[] | undefined): number {
  const hasAiOverview = (items ?? []).some((i) => i.type === "ai_overview");
  const organicCount = (items ?? []).filter((i) => i.type === "organic").length;
  if (hasAiOverview) return pct1(Math.min(100, 55 + organicCount * 3));
  return pct1(Math.min(100, organicCount * 4));
}

export function buildSeoMetrics(
  protocol: string,
  research: ResearchKeywordsResult,
  serp: SerpResultsPayload,
): SeoMetrics {
  const rows =
    research.results?.flatMap((r) => (r.ok ? r.rows ?? [] : [])) ?? [];

  if (rows.length === 0) {
    return neutralSeoMetrics();
  }

  const relevant = rows.filter((row) => rowMatchesProtocol(row, protocol));
  const pool = relevant.length > 0 ? relevant : rows.slice(0, 20);

  const searchDemandChangePct = pct1(avg(pool.map((r) => trendChangePct(r.trend))));
  const avgKd = avg(pool.map((r) => r.keywordDifficulty ?? 50));
  const avgVolume = avg(pool.map((r) => r.searchVolume ?? 0));
  const organicVisibility = pct1(Math.min(100, avgVolume / 100));
  const contentGapScore = pct1(
    Math.min(100, (avgVolume / 1000) * 20 + (100 - avgKd) * 0.6),
  );

  const devIntentHits = pool.filter(
    (r) =>
      DEV_INTENTS.has((r.intent ?? "").toLowerCase()) ||
      DEV_KEYWORDS.some((kw) => r.keyword.toLowerCase().includes(kw)),
  ).length;
  const developerIntentScore = pct1(
    Math.min(100, (devIntentHits / Math.max(pool.length, 1)) * 100),
  );

  const serpItems = serp.results?.find((r) => r.ok)?.items;
  const competitorSerpDom = competitorSerpDominance(serpItems, protocol);

  return {
    searchDemandChangePct,
    organicVisibility,
    contentGapScore,
    competitorSerpDominance: competitorSerpDom,
    developerIntentScore,
    aiVisibilityScore: aiVisibilityScore(serpItems),
  };
}
