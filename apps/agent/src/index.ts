#!/usr/bin/env node
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
import { runResearch } from "@scout/agent-runtime";

const request =
  process.argv.slice(2).join(" ") ||
  "Analyze lending protocols on Base. Best developer opportunity?";

console.log("Scout Agent CLI");
console.log("Request:", request);

const session = await runResearch({
  request,
  chain: "base",
  graphApiKey: process.env.GRAPH_GATEWAY_API_KEY,
  openseoApiKey: process.env.OPENSEO_API_KEY,
  openseoProjectId: process.env.OPENSEO_PROJECT_ID,
  onLog: (e) => console.log(`[${e.level}] ${e.message}`),
});

console.log("\n--- Result ---");
if (session.status === "awaiting_payment") {
  console.log(JSON.stringify({ status: session.status, paymentPending: session.paymentPending }, null, 2));
  console.log("Provisional winner:", session.scoreBreakdown?.winner);
} else {
  console.log(JSON.stringify(session.recommendation, null, 2));
  console.log("Score:", session.scoreBreakdown?.winner, session.recommendation?.score);
}
