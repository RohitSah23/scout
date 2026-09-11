import type { PaymentProvider, PaymentRequest, PaymentResult } from "@scout/schemas";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

export const DEEP_ANALYSIS_PRICE = 0.03;
export const GRAPH_QUERY_PRICE = 0.01;
export const PER_REQUEST_CAP = 0.1;

export interface BudgetPolicyConfig {
  totalBudget: number;
  spent: number;
  perRequestCap: number;
  allowlistedRecipients: string[];
  ensBudgetCap?: number | null;
}

export function checkBudgetPolicy(
  config: BudgetPolicyConfig,
  amount: number,
  recipient: string,
): { allowed: boolean; reason: string } {
  const remaining = config.totalBudget - config.spent;
  if (remaining < amount) {
    return { allowed: false, reason: `Budget insufficient: $${remaining.toFixed(2)} remaining` };
  }
  if (amount > config.perRequestCap) {
    return { allowed: false, reason: `Exceeds per-request cap of $${config.perRequestCap}` };
  }
  if (!config.allowlistedRecipients.includes(recipient.toLowerCase())) {
    return { allowed: false, reason: `Recipient ${recipient} not in allowlist` };
  }
  if (config.ensBudgetCap != null && config.spent + amount > config.ensBudgetCap) {
    return { allowed: false, reason: `Would exceed ENS budget cap of $${config.ensBudgetCap}` };
  }
  return { allowed: true, reason: "Policy check passed" };
}

function transactionReference(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["transaction", "transactionHash", "txHash", "tx", "hash"]) {
    if (typeof record[key] === "string") return record[key];
  }
  for (const child of Object.values(record)) {
    const found = transactionReference(child);
    if (found) return found;
  }
  return undefined;
}

/** Real x402 v2 EVM payer. It never falls back to a simulated receipt. */
export class X402PaymentProvider implements PaymentProvider {
  constructor(
    private readonly privateKey: string,
    private readonly maxAmountPerPayment = PER_REQUEST_CAP,
  ) {}

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    if (!/^0x[0-9a-fA-F]{64}$/.test(this.privateKey)) {
      return {
        success: false,
        error: "X402_PRIVATE_KEY must be a 32-byte EVM private key (0x + 64 hex characters)",
      };
    }

    try {
      const account = privateKeyToAccount(this.privateKey as `0x${string}`);
      const client = new x402Client();
      client.setSpendControls({ maxAmountPerPayment: `$${this.maxAmountPerPayment}` });
      client.register("eip155:*", new ExactEvmScheme(account));

      const paidFetch = wrapFetchWithPayment(fetch, client);
      const response = await paidFetch(request.url, {
        method: request.method ?? "GET",
        headers: request.body === undefined ? undefined : { "Content-Type": "application/json" },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Paid service returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
        };
      }

      const paymentResult = await new x402HTTPClient(client).processResponse(response);
      const responseData = await response.json();
      const txRef = transactionReference(paymentResult);
      if (!txRef) {
        return { success: false, error: "x402 response did not contain a verifiable settlement transaction" };
      }

      return {
        success: true,
        txRef,
        data: { resource: responseData, settlement: paymentResult },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "x402 payment failed",
      };
    }
  }
}

export const GRAPH_X402_TESTNET = "https://testnet.gateway.thegraph.com/api/x402";
