import type { Recommendation, ScoreBreakdown } from "@scout/schemas";
import { chatCompletion } from "./openrouter.js";

export interface NarrationInput {
  userRequest: string;
  scoreBreakdown: ScoreBreakdown;
  winnerProtocol: string;
  opportunityScore: number;
  riskScore: number;
}

export interface NarrationResult {
  summary: string;
  why: string[];
  action: string;
  source: "openrouter" | "template";
}

function winnerLabel(winner: NarrationInput["scoreBreakdown"]["candidates"][number] | undefined): string {
  if (!winner) return "";
  if (winner.assetSymbol && winner.sourceProtocol) {
    return `${winner.assetSymbol} on ${winner.sourceProtocol}`;
  }
  return winner.protocol;
}

function templateNarration(input: NarrationInput): NarrationResult {
  const winner = input.scoreBreakdown.candidates[0];
  const label = winnerLabel(winner) || input.winnerProtocol;
  return {
    summary: `Top lending asset: ${label}`,
    why: [
      winner?.gapSignal ? `Gap signal: ${winner.gapSignal}` : "Strongest composite score",
      winner?.windowLabel ? `Evidence window: ${winner.windowLabel}` : "Cross-protocol asset rank",
      `Momentum: ${winner?.momentum ?? "stable"}`,
      winner?.flags?.length ? `Flags: ${winner.flags.join(", ")}` : "Clean evidence profile",
      `Opportunity ${input.opportunityScore}/100, risk ${input.riskScore}/100`,
    ],
    action: `Build developer analytics or liquidity tooling around ${label}.`,
    source: "template",
  };
}

export class NarrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NarrationError";
  }
}

export async function narrateRecommendation(input: NarrationInput): Promise<NarrationResult> {
  const winner = input.scoreBreakdown.candidates[0];

  const label = winnerLabel(winner) || input.winnerProtocol;

  const systemPrompt = `You are Scout, an autonomous Web3 lending asset research agent.
You narrate cross-protocol token/market rankings. You do NOT invent scores — use only the provided score breakdown.
Respond with valid JSON only:
{"summary":"one line","why":["bullet1","bullet2","bullet3"],"action":"one concrete recommendation"}`;

  const userPrompt = `User request: ${input.userRequest}

Winning asset: ${label}
Source protocol: ${winner?.sourceProtocol ?? "unknown"}
Asset symbol: ${winner?.assetSymbol ?? winner?.protocol}
Evidence window: ${winner?.windowLabel ?? "mixed"}
Opportunity score: ${input.opportunityScore}/100 (fixed — do not change)
Risk score: ${input.riskScore}/100 (fixed — do not change)
Gap signal: ${winner?.gapSignal ?? "none"}
Momentum: ${winner?.momentum ?? "stable"}
Flags: ${winner?.flags?.join(", ") ?? "none"}
Dimension scores: ${winner?.dimensions.map((d) => `${d.key}=${d.score}`).join(", ")}

Write a concise recommendation for a developer looking to build around the winning lending asset.`;

  const raw = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  if (!raw) {
    throw new NarrationError(
      "OPENROUTER_API_KEY is required for LLM narration. Set it in .env (see docs/API_KEYS.md).",
    );
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new NarrationError("OpenRouter returned a non-JSON narration response");
    }
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      why?: string[];
      action?: string;
    };
    if (!parsed.summary || !parsed.action) {
      throw new NarrationError("OpenRouter narration JSON missing summary or action");
    }
    const fallback = templateNarration(input);
    return {
      summary: parsed.summary,
      why: Array.isArray(parsed.why) && parsed.why.length > 0 ? parsed.why : fallback.why,
      action: parsed.action,
      source: "openrouter",
    };
  } catch (err) {
    if (err instanceof NarrationError) throw err;
    throw new NarrationError(
      err instanceof Error ? err.message : "Failed to parse OpenRouter narration",
    );
  }
}

export function toRecommendation(
  narration: NarrationResult,
  winner: string,
  score: number,
  riskScore: number,
): Recommendation {
  return {
    winner,
    score,
    riskScore,
    summary: narration.summary,
    why: narration.why,
    action: narration.action,
  };
}
