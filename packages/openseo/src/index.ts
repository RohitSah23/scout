import type { Candidate, DataProvider, SeoMetrics, Source } from "@scout/schemas";
import {
  buildSeoMetrics,
  neutralSeoMetrics,
  type ResearchKeywordsResult,
  type SerpResultsPayload,
} from "./metrics.js";
import { MCP_URL, OpenSEOMcpClient, OpenSEOMcpError } from "./mcp.js";

export class OpenSEOProvider implements DataProvider {
  name = "OpenSEO";
  capabilities = ["keyword-research", "serp", "competitor", "ai-visibility"];

  constructor(
    private apiKey?: string,
    private projectId?: string,
  ) {}

  private client(): OpenSEOMcpClient {
    if (!this.apiKey) {
      throw new OpenSEOMcpError(
        "OPENSEO_API_KEY is required. Get one at app.openseo.so → Settings → API keys.",
      );
    }
    return new OpenSEOMcpClient({ apiKey: this.apiKey, projectId: this.projectId });
  }

  async execute(input: unknown): Promise<unknown> {
    const { action, protocol } = input as { action: string; protocol: string };
    if (action === "enrich-candidates") {
      return this.enrichCandidates((input as { candidates: Candidate[] }).candidates);
    }
    return this.researchProtocol(protocol);
  }

  async researchProtocol(protocol: string): Promise<SeoMetrics> {
    const client = this.client();
    const projectId = await client.getProjectId();
    const seed = `${protocol} lending defi`;

    const research = await client.callTool<ResearchKeywordsResult>("research_keywords", {
      projectId,
      seeds: [{ seed }],
      resultLimit: 150,
    });

    const serp = await client.callTool<SerpResultsPayload>("get_serp_results", {
      projectId,
      queries: [{ keyword: `${protocol} lending` }],
      depth: 10,
    });

    return buildSeoMetrics(protocol, research, serp);
  }

  async enrichCandidates(candidates: Candidate[]): Promise<{
    candidates: Candidate[];
    sources: Source[];
    sparse: string[];
    unavailable?: boolean;
  }> {
    const sources: Source[] = [];
    const enriched: Candidate[] = [];
    const sparse: string[] = [];
    const client = this.client();

    let projectId: string;
    try {
      projectId = await client.getProjectId();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      for (const c of candidates) {
        sparse.push(c.protocol);
        const sourceId = `openseo-${c.protocol.toLowerCase().replace(/\s+/g, "-")}-${c.chain}`;
        sources.push({
          id: sourceId,
          name: "OpenSEO",
          type: "web",
          cost: 0,
          data: {
            live: false,
            sparse: true,
            unavailable: true,
            protocol: c.protocol,
            error: message,
            metrics: neutralSeoMetrics(),
          },
        });
        enriched.push({ ...c, seoMetrics: neutralSeoMetrics() });
      }
      return { candidates: enriched, sources, sparse, unavailable: true };
    }

    for (const c of candidates) {
      const seoSubject =
        c.assetSymbol && c.sourceProtocol
          ? `${c.assetSymbol} ${c.sourceProtocol}`
          : c.protocol;
      const seed = `${seoSubject} ${c.chain} lending defi`;
      const sourceId = `openseo-${c.id}`;

      try {
        const research = await client.callTool<ResearchKeywordsResult>("research_keywords", {
          projectId,
          seeds: [{ seed }],
          resultLimit: 150,
        });
        const serp = await client.callTool<SerpResultsPayload>("get_serp_results", {
          projectId,
          queries: [{ keyword: `${seoSubject} lending` }],
          depth: 10,
        });

        const keywordRows =
          research.results?.flatMap((r) => (r.ok ? r.rows ?? [] : [])) ?? [];
        const hasKeywordData = keywordRows.length > 0;
        const seo = hasKeywordData
          ? buildSeoMetrics(seoSubject, research, serp)
          : neutralSeoMetrics();

        if (!hasKeywordData) {
          sparse.push(c.protocol);
        }

        sources.push({
          id: sourceId,
          name: "OpenSEO",
          type: "web",
          cost: 0,
          data: {
            live: hasKeywordData,
            sparse: !hasKeywordData,
            protocol: c.protocol,
            seed,
            research,
            serp,
            metrics: seo,
          },
        });
        enriched.push({ ...c, seoMetrics: seo });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        sparse.push(c.protocol);
        sources.push({
          id: sourceId,
          name: "OpenSEO",
          type: "web",
          cost: 0,
          data: {
            live: false,
            sparse: true,
            protocol: c.protocol,
            seed,
            error: message,
            metrics: neutralSeoMetrics(),
          },
        });
        enriched.push({ ...c, seoMetrics: neutralSeoMetrics() });
      }
    }

    return { candidates: enriched, sources, sparse };
  }
}

export { MCP_URL, OpenSEOMcpError };
export { neutralSeoMetrics } from "./metrics.js";
