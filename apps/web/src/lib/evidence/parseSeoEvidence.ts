import type { Source, SeoMetrics } from "@scout/schemas";
import { protocolFromSourceId } from "./format";

export interface KeywordEvidenceRow {
  keyword: string;
  volume: number;
  trendChangePct: number | null;
  difficulty: number | null;
  intent: string;
  cpc: number | null;
}

export interface SerpEvidenceRow {
  rank: number;
  type: string;
  domain: string;
  url: string;
}

export interface ParsedSeoEvidence {
  protocol: string;
  seed: string;
  live: boolean;
  metrics: SeoMetrics;
  keywords: KeywordEvidenceRow[];
  serp: SerpEvidenceRow[];
}

function trendChangePct(trend: Array<{ year: number; month: number; searchVolume: number }> | undefined): number | null {
  if (!trend || trend.length < 4) return null;
  const sorted = [...trend].sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  const recent = sorted.slice(0, 3).map((p) => p.searchVolume);
  const prior = sorted.slice(3, 6).map((p) => p.searchVolume);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const priorAvg = prior.reduce((a, b) => a + b, 0) / (prior.length || 1);
  if (priorAvg <= 0) return recentAvg > 0 ? 100 : 0;
  return Math.round(((recentAvg - priorAvg) / priorAvg) * 1000) / 10;
}

export function parseSeoEvidence(source: Source): ParsedSeoEvidence | null {
  const root = source.data as {
    live?: boolean;
    protocol?: string;
    seed?: string;
    metrics?: SeoMetrics;
    research?: {
      results?: Array<{
        ok: boolean;
        rows?: Array<{
          keyword: string;
          searchVolume?: number;
          trend?: Array<{ year: number; month: number; searchVolume: number }>;
          keywordDifficulty?: number;
          intent?: string;
          cpc?: number;
        }>;
      }>;
    };
    serp?: {
      results?: Array<{
        ok: boolean;
        keyword?: string;
        items?: Array<{
          rank?: number;
          type?: string;
          domain?: string | null;
          url?: string | null;
        }>;
      }>;
    };
  } | undefined;

  if (!root?.metrics) return null;

  const keywords: KeywordEvidenceRow[] =
    root.research?.results
      ?.flatMap((r) => (r.ok ? r.rows ?? [] : []))
      .map((row) => ({
        keyword: row.keyword,
        volume: row.searchVolume ?? 0,
        trendChangePct: trendChangePct(row.trend),
        difficulty: row.keywordDifficulty ?? null,
        intent: row.intent ?? "—",
        cpc: row.cpc ?? null,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 15) ?? [];

  const serp: SerpEvidenceRow[] =
    root.serp?.results
      ?.flatMap((r) => (r.ok ? r.items ?? [] : []))
      .map((item, i) => ({
        rank: item.rank ?? i + 1,
        type: item.type ?? "organic",
        domain: item.domain ?? "—",
        url: item.url ?? "",
      }))
      .slice(0, 12) ?? [];

  return {
    protocol: root.protocol ?? protocolFromSourceId(source.id),
    seed: root.seed ?? "",
    live: Boolean(root.live),
    metrics: root.metrics,
    keywords,
    serp,
  };
}
