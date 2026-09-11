import { config } from "dotenv";
import { resolve } from "node:path";
import { GraphProvider } from "../packages/graph/dist/index.js";

config({ path: resolve(process.cwd(), ".env") });

const graph = new GraphProvider(process.env.GRAPH_GATEWAY_API_KEY);
const result = await graph.execute({ action: "query-all", chain: "base" });

console.log("discoveredCount:", result.discoveredCount);
console.log("protocolCount:", result.protocolCount);
console.log("messariProtocolCount:", result.messariProtocolCount);
console.log("composable:", result.composable, "| standard:", result.schemaStandard);
if (result.skipped?.length) console.log("skipped:", result.skipped.join("; "));
console.log("candidates:");
for (const c of result.candidates) {
  console.log(
    `  - ${c.protocol} (${c.chain}) tvlChange=${c.onchainMetrics?.tvlChangePct}% vol=${c.onchainMetrics?.volumeChangePct}%`,
  );
}
console.log("sources:", result.sources.map((s) => s.id).join(", ") || "none");

if (result.candidates.length === 0) {
  process.exit(1);
}
