import type { Candidate, DataProvider, SeoMetrics, Source } from "@scout/schemas";
import { buildSeoMetrics, type ResearchKeywordsResult, type SerpResultsPayload } from "./metrics.js";
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
  }> {
    const sources: Source[] = [];
    const enriched: Candidate[] = [];
    const client = this.client();
    const projectId = await client.getProjectId();

    for (const c of candidates) {
      const seed = `${c.protocol} lending defi`;
      const research = await client.callTool<ResearchKeywordsResult>("research_keywords", {
        projectId,
        seeds: [{ seed }],
        resultLimit: 150,
      });
      const serp = await client.callTool<SerpResultsPayload>("get_serp_results", {
        projectId,
        queries: [{ keyword: `${c.protocol} lending` }],
        depth: 10,
      });

      const seo = buildSeoMetrics(c.protocol, research, serp);
      const sourceId = `openseo-${c.protocol.toLowerCase().replace(/\s+/g, "-")}-${c.chain}`;

      sources.push({
        id: sourceId,
        name: "OpenSEO",
        type: "web",
        cost: 0,
        data: {
          live: true,
          protocol: c.protocol,
          seed,
          research,
          serp,
          metrics: seo,
        },
      });
      enriched.push({ ...c, seoMetrics: seo });
    }

    return { candidates: enriched, sources };
  }
}

export { MCP_URL, OpenSEOMcpError };
