import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
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

const payToAddresses = [
  process.env.X402_PAY_TO_ADDRESS ?? "0xscoutdeepanalysis",
  "0xgraphgateway",
];

function researchEnvOpts() {
  return {
    graphApiKey: process.env.GRAPH_GATEWAY_API_KEY,
    openseoApiKey: process.env.OPENSEO_API_KEY,
    openseoProjectId: process.env.OPENSEO_PROJECT_ID,
    payToAddresses,
  };
}

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

app.get("/health", (c) => c.json({ ok: true, service: "scout-api" }));

app.get("/agent/identity", async (c) => {
  const ens = createENSIdentity("base", 0.5);
  const permissions = await ens.getPermissions();
  const records = ens.getRecords();
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
  const ens = createENSIdentity("base", 0.5);
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

app.get("/api/deep-protocol-analysis", async (c) => {
  const protocol = c.req.query("protocol") ?? "Unknown";
  const paymentHeader = c.req.header("Payment-Signature") ?? c.req.header("X-PAYMENT");

  if (!paymentHeader && process.env.X402_PAY_TO_ADDRESS) {
    return c.json(
      {
        x402Version: 2,
        accepts: [
          {
            scheme: "exact",
            network: "eip155:84532",
            maxAmountRequired: String(DEEP_ANALYSIS_PRICE_USD * 1e6),
            resource: "/api/deep-protocol-analysis",
            description: "Deep protocol analysis",
            mimeType: "application/json",
            payTo: process.env.X402_PAY_TO_ADDRESS,
            maxTimeoutSeconds: 300,
            asset: "0x036CbD53842c542663c2089728CEAE6de4804703",
          },
        ],
      },
      402,
    );
  }

  const result = runDeepAnalysis(protocol);
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
  const base = `http://localhost:${PORT}`;
  return c.json(buildRecipeManifest(base));
});

app.get("/mcp", (c) => {
  return c.json({
    name: "scout-research",
    tools: [
      {
        name: "protocol_opportunity_analysis",
        description: "Run full Scout protocol opportunity analysis using Graph + OpenSEO + scoring",
        inputSchema: {
          type: "object",
          properties: {
            chain: { type: "string" },
            request: { type: "string" },
          },
        },
      },
    ],
  });
});

console.log(`Scout API listening on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
