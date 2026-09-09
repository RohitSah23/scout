import { z } from "zod";

export const DimensionKeySchema = z.enum([
  "onchainGrowth",
  "userGrowth",
  "searchDemand",
  "competitiveGap",
  "seoOpportunity",
  "evidenceConfidence",
]);

export type DimensionKey = z.infer<typeof DimensionKeySchema>;

export const DimensionScoreSchema = z.object({
  key: DimensionKeySchema,
  weight: z.number(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
  evidenceIds: z.array(z.string()),
});

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const BudgetSchema = z.object({
  initial: z.number(),
  spent: z.number(),
  remaining: z.number(),
  currency: z.literal("USDC"),
  perRequestCap: z.number().default(0.1),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["onchain", "web", "paid"]),
  cost: z.number(),
  payment: z.string().optional(),
  txRef: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  provenance: z
    .object({
      subgraphId: z.string().optional(),
      deploymentId: z.string().optional(),
      schemaVersion: z.string().optional(),
      query: z.string().optional(),
    })
    .optional(),
});

export type Source = z.infer<typeof SourceSchema>;

export const OnchainMetricsSchema = z.object({
  tvlChangePct: z.number().optional(),
  volumeChangePct: z.number().optional(),
  txChangePct: z.number().optional(),
  activeAddressesChangePct: z.number().optional(),
  newUsersChangePct: z.number().optional(),
  returningUserRatio: z.number().optional(),
  priorPeriodGrowthPct: z.number().optional(),
});

export type OnchainMetrics = z.infer<typeof OnchainMetricsSchema>;

export const SeoMetricsSchema = z.object({
  searchDemandChangePct: z.number().optional(),
  organicVisibility: z.number().optional(),
  contentGapScore: z.number().optional(),
  competitorSerpDominance: z.number().optional(),
  developerIntentScore: z.number().optional(),
  aiVisibilityScore: z.number().optional(),
});

export type SeoMetrics = z.infer<typeof SeoMetricsSchema>;

export const CandidateSchema = z.object({
  id: z.string(),
  protocol: z.string(),
  chain: z.string(),
  onchainMetrics: OnchainMetricsSchema.optional(),
  seoMetrics: SeoMetricsSchema.optional(),
  deepAnalysis: z
    .object({
      walletGrowth: z.number().optional(),
      retention: z.number().optional(),
      whaleActivity: z.number().optional(),
      growthQuality: z.string().optional(),
      riskFactors: z.array(z.string()).optional(),
      confidenceBoost: z.number().optional(),
    })
    .optional(),
  provenance: z
    .object({
      subgraphId: z.string().optional(),
      deploymentId: z.string().optional(),
      schemaVersion: z.string().optional(),
      methodologyVersion: z.string().optional(),
    })
    .optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

export const CandidateScoreSchema = z.object({
  protocol: z.string(),
  chain: z.string(),
  dimensions: z.array(DimensionScoreSchema),
  composite: z.number(),
  opportunityScore: z.number(),
  riskScore: z.number(),
  rank: z.number(),
  momentum: z.enum(["heating", "stable", "cooling"]).optional(),
  gapSignal: z.string().optional(),
  flags: z.array(z.string()).optional(),
  sensitivityBand: z.tuple([z.number(), z.number()]).optional(),
});

export type CandidateScore = z.infer<typeof CandidateScoreSchema>;

export const ScoreBreakdownSchema = z.object({
  modelVersion: z.literal("scout-v1"),
  disclaimer: z.string(),
  candidates: z.array(CandidateScoreSchema),
  winner: z.string(),
  confidence: z.number(),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const RecommendationSchema = z.object({
  winner: z.string(),
  score: z.number(),
  riskScore: z.number(),
  summary: z.string(),
  why: z.array(z.string()),
  action: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const ResearchEventTypeSchema = z.enum([
  "mission.received",
  "plan.created",
  "graph.discovery",
  "graph.query",
  "graph.complete",
  "openseo.started",
  "openseo.complete",
  "candidates.updated",
  "scores.provisional",
  "uncertainty.detected",
  "payment.required",
  "payment.pending",
  "payment.settled",
  "deep_analysis.received",
  "recommendation.generated",
  "ens.updated",
  "research.completed",
  "research.failed",
]);

export type ResearchEventType = z.infer<typeof ResearchEventTypeSchema>;

export const DecisionLogEntrySchema = z.object({
  timestamp: z.string(),
  message: z.string(),
  level: z.enum(["info", "warn", "success", "payment"]).default("info"),
  eventType: ResearchEventTypeSchema.optional(),
  payload: z.record(z.unknown()).optional(),
});

export type DecisionLogEntry = z.infer<typeof DecisionLogEntrySchema>;

export const PaymentPendingSchema = z.object({
  amount: z.number(),
  reason: z.string(),
  targetProtocols: z.array(z.string()),
  confidence: z.number(),
  budgetBefore: z.number(),
  budgetAfter: z.number(),
  serviceName: z.string().default("Deep wallet-flow analysis"),
});

export type PaymentPending = z.infer<typeof PaymentPendingSchema>;

export const ResearchSessionSchema = z.object({
  researchId: z.string(),
  status: z.enum(["pending", "running", "awaiting_payment", "completed", "failed"]),
  request: z.string(),
  chain: z.string().optional(),
  category: z.string().optional(),
  agent: z.object({
    name: z.string().optional(),
    ensName: z.string().optional(),
    wallet: z.string().optional(),
  }),
  budget: BudgetSchema,
  sources: z.array(SourceSchema),
  candidates: z.array(CandidateSchema),
  scoreBreakdown: ScoreBreakdownSchema.optional(),
  recommendation: RecommendationSchema.optional(),
  confidence: z.number().optional(),
  paymentPending: PaymentPendingSchema.optional(),
  decisionLog: z.array(DecisionLogEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ResearchSession = z.infer<typeof ResearchSessionSchema>;

export interface DataProvider {
  name: string;
  capabilities: string[];
  execute(input: unknown): Promise<unknown>;
}

export interface WalletProvider {
  getBalance(): Promise<number>;
  signPayment(payment: unknown): Promise<{ success: boolean; txRef?: string; error?: string }>;
  getAddress(): Promise<string>;
}

export interface AgentIdentity {
  resolveName(): Promise<string>;
  getPermissions(): Promise<Record<string, boolean>>;
  getBudgetCap(): Promise<number | null>;
  writeResearchStatus(status: string, reportHash?: string): Promise<{ success: boolean; txHash?: string; error?: string }>;
  attemptUnauthorizedWrite(): Promise<{ success: boolean; error?: string }>;
}

export interface PaymentProvider {
  pay(request: PaymentRequest): Promise<PaymentResult>;
}

export interface PaymentRequest {
  url: string;
  amount: number;
  reason: string;
  recipient: string;
}

export interface PaymentResult {
  success: boolean;
  txRef?: string;
  data?: unknown;
  error?: string;
}

export const GraphQueryKindSchema = z.enum(["messari", "aave-v3", "compound-v3"]);

export type GraphQueryKind = z.infer<typeof GraphQueryKindSchema>;

export const MessariDeploymentSchema = z.object({
  protocol: z.string(),
  chain: z.string(),
  subgraphId: z.string(),
  deploymentId: z.string(),
  schemaVersion: z.string(),
  methodologyVersion: z.string().optional(),
  queryKind: GraphQueryKindSchema.default("messari"),
  category: z.literal("lending-cdp"),
  messariSlug: z.string().optional(),
});

export type MessariDeployment = z.infer<typeof MessariDeploymentSchema>;
