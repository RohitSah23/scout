import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { PrivyClient } from "@privy-io/node";
import {
  authorizePaymentAndComplete,
  denyPaymentAndComplete,
  runResearch,
} from "@scout/agent-runtime";
import { runDeepAnalysis, DEEP_ANALYSIS_PRICE_USD } from "@scout/deep-analysis";
import { buildRecipeManifest } from "@scout/bazantic";
import { createENSIdentity } from "@scout/ens";
import type { DecisionLogEntry, ResearchSession } from "@scout/schemas";
import { emitLog, getSession, listSessions, saveSession, subscribeToLogs } from "./store.js";

const app = new Hono();
const PORT = parseInt(process.env.API_PORT ?? "3001", 10);
const requirePrivyAuth = process.env.PRIVY_REQUIRE_AUTH === "true";

async function verifyPrivyRequest(authorization?: string): Promise<string | undefined> {
  if (!requirePrivyAuth) return undefined;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!token || !appId || !appSecret) throw new Error("Privy authentication is required");
  const privy = new PrivyClient({ appId, appSecret });
  const verified = await privy.utils().auth().verifyAccessToken(token);
  return verified.user_id;
}

const payToAddress = process.env.X402_PAY_TO_ADDRESS;
const payToAddresses = payToAddress ? [payToAddress] : [];

function researchEnvOpts() {
  return {
    graphApiKey: process.env.GRAPH_GATEWAY_API_KEY,
    openseoApiKey: process.env.OPENSEO_API_KEY,
    openseoProjectId: process.env.OPENSEO_PROJECT_ID,
    payToAddresses,
    deepAnalysisUrl:
      process.env.DEEP_ANALYSIS_URL ?? `http://127.0.0.1:${PORT}/api/deep-protocol-analysis`,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privyAppSecret: process.env.PRIVY_APP_SECRET,
    privyWalletId: process.env.PRIVY_WALLET_ID,
    privyPolicyId: process.env.PRIVY_POLICY_ID,
  };
}

const mcpServer = new McpServer({ name: "scout-research", version: "0.1.0" });
mcpServer.registerTool(
  "protocol_opportunity_analysis",
  {
    description:
      "Run Scout's live lending opportunity research using The Graph, OpenSEO, deterministic scoring, and an optional x402 uncertainty gate.",
    inputSchema: {
      chain: z.string().default("base"),
      request: z.string().min(1),
      budget: z.number().positive().max(10).default(0.5),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ chain, request, budget }) => {
    const session = await runResearch({
      request,
      budget,
      chain,
      ...researchEnvOpts(),
    });
    return {
      content: [{ type: "text", text: JSON.stringify(session, null, 2) }],
      structuredContent: session as unknown as Record<string, unknown>,
    };
  },
);
const mcpTransport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableJsonResponse: true,
});
await mcpServer.connect(mcpTransport);

function attachLogHandlers(researchId: string) {
  const onLog = (entry: DecisionLogEntry) => {
    emitLog(researchId, entry);
    const s = getSession(researchId);
    if (s) {
      s.decisionLog.push(entry);
      saveSession(s);
    }
  };

  const onSessionUpdate = (session: ResearchSession) => {
    saveSession({ ...session, researchId });
  };

  return { onLog, onSessionUpdate };
}

function isTerminalStatus(status: ResearchSession["status"]) {
  return status === "completed" || status === "failed";
}

app.use("/*", cors({ origin: "*" }));

if (payToAddress && /^0x[0-9a-fA-F]{40}$/.test(payToAddress)) {
  const facilitator = new HTTPFacilitatorClient({
    url: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator",
  });
  const resourceServer = new x402ResourceServer(facilitator).register(
    "eip155:84532",
    new ExactEvmScheme(),
  );
  app.use(
    paymentMiddleware(
      {
        "POST /api/deep-protocol-analysis": {
          accepts: {
            scheme: "exact",
            price: `$${DEEP_ANALYSIS_PRICE_USD}`,
            network: "eip155:84532",
            payTo: payToAddress,
          },
          description: "Candidate-specific protocol risk diagnostics",
          mimeType: "application/json",
        },
      },
      resourceServer,
    ),
  );
}

app.get("/health", (c) => c.json({ ok: true, service: "scout-api" }));

app.get("/agent/identity", async (c) => {
  let ens;
  try {
    ens = createENSIdentity("base", 0.5);
  } catch (error) {
    return c.json({
      name: "scout",
      status: "UNCONFIGURED",
      error: error instanceof Error ? error.message : "ENSv2 is not configured",
    }, 503);
  }
  const permissions = await ens.getPermissions();
  const records = await ens.getRecords();
  return c.json({
    name: "scout",
    ensName: await ens.resolveName(),
    status: "ACTIVE",
    budgetCap: await ens.getBudgetCap(),
    permissions,
    records,
    capabilities: [
      "The Graph Messari Lending/CDP standard queries",
      "OpenSEO keyword and SERP intelligence",
      "Deterministic 6-dimension scoring",
      "x402 machine-native micropayments",
      "ENSv2 identity & delegated permission enforcement",
    ],
  });
});

app.post("/agent/test-eac", async (c) => {
  const body = await c.req.json<{ action: "authorized" | "unauthorized" }>();
  let ens;
  try {
    ens = createENSIdentity("base", 0.5);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "ENSv2 is not configured" },
      503,
    );
  }
  if (body.action === "unauthorized") {
    const res = await ens.attemptUnauthorizedWrite();
    return c.json(res, 403);
  }
  const res = await ens.writeResearchStatus("idle");
  return c.json(res);
});

app.get("/research", (c) => {
  const status = c.req.query("status") as ResearchSession["status"] | undefined;
  const sessions = listSessions(status ? { status } : undefined);
  return c.json({
    sessions: sessions.map((s) => ({
      researchId: s.researchId,
      status: s.status,
      request: s.request,
      chain: s.chain,
      category: s.category,
      winner: s.recommendation?.winner ?? s.scoreBreakdown?.winner,
      score: s.recommendation?.score ?? s.scoreBreakdown?.candidates[0]?.composite,
      confidence: s.confidence,
      spent: s.budget.spent,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      candidateCount: s.candidates.length,
    })),
  });
});

app.post("/research", async (c) => {
  try {
    await verifyPrivyRequest(c.req.header("Authorization"));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Unauthorized" }, 401);
  }
  const body = await c.req.json<{
    request: string;
    budget?: number;
    chain?: string;
    category?: string;
    projectName?: string;
  }>();

  const researchId = crypto.randomUUID();
  const partial: ResearchSession = {
    researchId,
    status: "running",
    request: body.request,
    chain: body.chain ?? "base",
    category: body.category ?? "lending",
    agent: {},
    budget: {
      initial: body.budget ?? 0.5,
      spent: 0,
      remaining: body.budget ?? 0.5,
      currency: "USDC",
      perRequestCap: 0.1,
    },
    sources: [],
    candidates: [],
    decisionLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveSession(partial);

  const { onLog, onSessionUpdate } = attachLogHandlers(researchId);

  runResearch({
    researchId,
    request: body.request,
    budget: body.budget ?? 0.5,
    chain: body.chain ?? "base",
    category: body.category ?? "lending",
    ...researchEnvOpts(),
    onLog,
    onSessionUpdate,
  }).catch((err) => {
    const s = getSession(researchId);
    if (s) {
      const message = err instanceof Error ? err.message : "Research failed";
      const entry: DecisionLogEntry = {
        timestamp: new Date().toISOString(),
        message: `Research failed: ${message}`,
        level: "warn",
        eventType: "research.failed",
        payload: { error: message },
      };
      s.decisionLog.push(entry);
      s.status = "failed";
      saveSession(s);
      emitLog(researchId, entry);
    }
  });

  return c.json({ researchId, status: "running" });
});

app.post("/research/:id/authorize-payment", async (c) => {
  try {
    await verifyPrivyRequest(c.req.header("Authorization"));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Unauthorized" }, 401);
  }
  const researchId = c.req.param("id");
  const session = getSession(researchId);
  if (!session) return c.json({ error: "Not found" }, 404);
  if (session.status !== "awaiting_payment") {
    return c.json({ error: "Session is not awaiting payment" }, 400);
  }

  const { onLog, onSessionUpdate } = attachLogHandlers(researchId);

  try {
    const completed = await authorizePaymentAndComplete(session, {
      ...researchEnvOpts(),
      onLog,
      onSessionUpdate,
    });
    saveSession({ ...completed, researchId });
    return c.json(completed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authorization failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/research/:id/deny-payment", async (c) => {
  try {
    await verifyPrivyRequest(c.req.header("Authorization"));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Unauthorized" }, 401);
  }
  const researchId = c.req.param("id");
  const session = getSession(researchId);
  if (!session) return c.json({ error: "Not found" }, 404);
  if (session.status !== "awaiting_payment") {
    return c.json({ error: "Session is not awaiting payment" }, 400);
  }

  const { onLog, onSessionUpdate } = attachLogHandlers(researchId);

  try {
    const completed = await denyPaymentAndComplete(session, { onLog, onSessionUpdate });
    saveSession({ ...completed, researchId });
    return c.json(completed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Denial failed";
    return c.json({ error: message }, 500);
  }
});

app.get("/research/:id", (c) => {
  const session = getSession(c.req.param("id"));
  if (!session) return c.json({ error: "Not found" }, 404);
  return c.json(session);
});

app.get("/research/:id/stream", (c) => {
  const researchId = c.req.param("id");
  return streamSSE(c, async (stream) => {
    const session = getSession(researchId);
    if (session) {
      for (const entry of session.decisionLog) {
        await stream.writeSSE({
          event: entry.eventType ?? "message",
          data: JSON.stringify(entry),
        });
      }
      if (isTerminalStatus(session.status)) {
        await stream.writeSSE({
          event: "done",
          data: JSON.stringify({ status: session.status }),
        });
        return;
      }
      if (session.status === "awaiting_payment") {
        await stream.writeSSE({
          event: "awaiting_payment",
          data: JSON.stringify({ status: session.status, paymentPending: session.paymentPending }),
        });
      }
    }

    const unsub = subscribeToLogs(researchId, async (entry) => {
      await stream.writeSSE({
        event: entry.eventType ?? "message",
        data: JSON.stringify(entry),
      });
      const s = getSession(researchId);
      if (s?.status === "awaiting_payment") {
        await stream.writeSSE({
          event: "awaiting_payment",
          data: JSON.stringify({ status: s.status, paymentPending: s.paymentPending }),
        });
      }
      if (isTerminalStatus(s?.status ?? "running")) {
        await stream.writeSSE({
          event: "done",
          data: JSON.stringify({ status: s!.status }),
        });
      }
    });

    const poll = setInterval(async () => {
      const s = getSession(researchId);
      if (s?.status === "awaiting_payment") {
        await stream.writeSSE({
          event: "awaiting_payment",
          data: JSON.stringify({ status: s.status, paymentPending: s.paymentPending }),
        });
      }
      if (isTerminalStatus(s?.status ?? "running")) {
        await stream.writeSSE({
          event: "done",
          data: JSON.stringify({ status: s!.status }),
        });
        clearInterval(poll);
        unsub();
      }
    }, 500);

    await new Promise((r) => setTimeout(r, 120000));
    clearInterval(poll);
    unsub();
  });
});

app.post("/api/deep-protocol-analysis", async (c) => {
  if (!payToAddress || !/^0x[0-9a-fA-F]{40}$/.test(payToAddress)) {
    return c.json({ error: "x402 pay-to address is not configured" }, 503);
  }
  const body = await c.req.json<{
    protocol?: string;
    candidate?: ResearchSession["candidates"][number];
  }>();
  if (!body.protocol || !body.candidate || body.candidate.protocol !== body.protocol) {
    return c.json({ error: "protocol and its candidate evidence are required" }, 400);
  }
  const result = runDeepAnalysis(body.protocol, body.candidate);
  return c.json(result);
});

app.get("/api/protocol-opportunity", async (c) => {
  const chain = c.req.query("chain") ?? "base";
  const request = c.req.query("request") ?? `Analyze lending protocols on ${chain}`;

  const session = await runResearch({
    request,
    budget: 0.5,
    chain,
    ...researchEnvOpts(),
  });

  return c.json({
    chain,
    winner: session.recommendation?.winner,
    opportunityScore: session.recommendation?.score,
    riskScore: session.recommendation?.riskScore,
    scoreBreakdown: session.scoreBreakdown,
    recommendation: session.recommendation,
    sources: session.sources.map((s) => ({ id: s.id, name: s.name, type: s.type })),
  });
});

app.get("/bazantic/recipe", (c) => {
  const base = process.env.PUBLIC_API_URL ?? `http://localhost:${PORT}`;
  return c.json(buildRecipeManifest(base));
});

app.get("/openapi.json", (c) =>
  c.json({
    openapi: "3.1.0",
    info: { title: "Scout Research API", version: "0.1.0" },
    servers: [{ url: process.env.PUBLIC_API_URL ?? `http://localhost:${PORT}` }],
    paths: {
      "/api/protocol-opportunity": {
        get: {
          summary: "Run live protocol opportunity research",
          parameters: [
            { name: "chain", in: "query", schema: { type: "string", default: "base" } },
            { name: "request", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Research result" } },
        },
      },
      "/api/deep-protocol-analysis": {
        post: {
          summary: "Buy candidate-specific diagnostics over x402 on Base Sepolia",
          requestBody: { required: true },
          responses: {
            "200": { description: "Paid diagnostics and x402 settlement response" },
            "402": { description: "x402 payment requirements" },
          },
        },
      },
    },
  }),
);

app.all("/mcp", (c) => mcpTransport.handleRequest(c.req.raw));

console.log(`Scout API listening on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
