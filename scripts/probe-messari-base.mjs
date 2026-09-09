import { config } from "dotenv";
import { resolve } from "node:path";
import { GraphProvider } from "../packages/graph/dist/index.js";

config({ path: resolve(process.cwd(), ".env") });

const graph = new GraphProvider(process.env.GRAPH_GATEWAY_API_KEY);

for (const chain of ["base", "ethereum", "arbitrum", "optimism", "polygon"]) {
  console.log(`\n========== ${chain.toUpperCase()} ==========`);
  try {
    const result = await graph.queryAllLending(chain);
    console.log(
      `OK: ${result.protocolCount} protocols (${result.messariProtocolCount} messari-composable)`,
    );
    for (const c of result.candidates) {
      console.log(
        `  - ${c.protocol}: TVL ${c.onchainMetrics?.tvlChangePct}% vol ${c.onchainMetrics?.volumeChangePct}%`,
      );
    }
    if (result.skipped.length) {
      console.log("  skipped:", result.skipped.join("; "));
    }
  } catch (err) {
    console.log("FAIL:", err.message);
  }
}
