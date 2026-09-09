import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const key = process.env.OPENSEO_API_KEY;
const url = "https://app.openseo.so/mcp";

async function call(method, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() }),
  });
  const text = await res.text();
  console.log(`\n=== ${method} ===`);
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2).slice(0, 4000));
    return json;
  } catch {
    console.log(text.slice(0, 2000));
    return text;
  }
}

const list = await call("tools/list", {});
const researchTool = list?.result?.tools?.find((t) => t.name === "research_keywords");
console.log("\nresearch_keywords schema:", JSON.stringify(researchTool?.inputSchema, null, 2));

const projects = await call("tools/call", { name: "list_projects", arguments: {} });
const projectId = projects?.result?.content?.[0]?.text
  ? JSON.parse(projects.result.content[0].text).projects?.[0]?.id
  : null;
console.log("\nprojectId:", projectId);

if (projectId) {
  await call("tools/call", {
    name: "research_keywords",
    arguments: {
      projectId,
      seeds: [{ keyword: "compound v3 lending" }],
      limit: 20,
    },
  });
  await call("tools/call", {
    name: "get_serp_results",
    arguments: { projectId, keyword: "compound v3 lending" },
  });
}
