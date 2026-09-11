export const PROTOCOL_OPPORTUNITY_RECIPE = {
  name: "Protocol Opportunity Analysis",
  description:
    "Compare on-chain lending adoption (The Graph Messari schema) with web demand (Scout scoring) for a scored opportunity assessment.",
  useWhen: [
    "You have a blockchain protocol or contract",
    "You want to compare on-chain adoption with online demand",
    "You need a scored opportunity assessment",
  ],
  input: {
    protocol: "string (optional)",
    chain: "string (default: base)",
    category: "string (default: lending)",
  },
  output: {
    onchainGrowth: "number",
    searchDemand: "number",
    opportunityScore: "number",
    riskScore: "number",
    recommendation: "string",
  },
  cost: "Base research is free; optional diagnostics cost 0.03 USDC over x402",
  steps: [
    "Query The Graph Messari Lending/CDP standardized subgraphs via Scout Graph provider",
    "Enrich with OpenSEO web intelligence",
    "Run Scout scoring pipeline",
    "Return ranked opportunity report",
  ],
  sponsorApis: ["The Graph", "Scout Research API"],
};

export const BAZANTIC_GATEWAY_CONFIG = {
  gatewayName: "scout-research-gateway",
  mcpToolName: "protocol_opportunity_analysis",
  endpoint: "/api/protocol-opportunity",
  paidEndpoint: "/api/deep-protocol-analysis",
  x402Enabled: false,
};

export function buildRecipeManifest(apiBaseUrl: string) {
  return {
    status: "integration-template",
    activationRequired: "Import /openapi.json into a deployed Bazantic gateway and publish the recipe from a Bazantic account.",
    recipe: PROTOCOL_OPPORTUNITY_RECIPE,
    gateway: {
      ...BAZANTIC_GATEWAY_CONFIG,
      endpoint: `${apiBaseUrl}${BAZANTIC_GATEWAY_CONFIG.endpoint}`,
    },
    mcp: {
      url: `${apiBaseUrl}/mcp`,
      tools: ["protocol_opportunity_analysis"],
    },
  };
}
