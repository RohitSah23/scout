import { PrivyClient } from "@privy-io/node";
import { createViemAccount } from "@privy-io/node/viem";
import type { PaymentProvider, PaymentRequest, PaymentResult } from "@scout/schemas";
import { checkBudgetPolicy, type BudgetPolicyConfig } from "@scout/x402";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";

export interface PrivyX402Config extends BudgetPolicyConfig {
  appId: string;
  appSecret: string;
  walletId: string;
  expectedPolicyId: string;
}

function transactionReference(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["transaction", "transactionHash", "txHash", "tx", "hash"]) {
    if (typeof record[key] === "string" && record[key].startsWith("0x")) return record[key];
  }
  for (const child of Object.values(record)) {
    const found = transactionReference(child);
    if (found) return found;
  }
  return undefined;
}

/**
 * Pays an x402 v2 endpoint with a real Privy server wallet. Both the Privy
 * wallet policy and Scout's session budget policy must approve the request.
 * No local receipt or simulated transaction path exists.
 */
export class PrivyX402PaymentProvider implements PaymentProvider {
  constructor(private readonly config: PrivyX402Config) {}

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    const policy = checkBudgetPolicy(this.config, request.amount, request.recipient);
    if (!policy.allowed) return { success: false, error: policy.reason };

    if (!this.config.appId || !this.config.appSecret) {
      return { success: false, error: "Privy app credentials are required" };
    }
    if (!this.config.walletId || !this.config.expectedPolicyId) {
      return {
        success: false,
        error: "PRIVY_WALLET_ID and PRIVY_POLICY_ID are required for policy-enforced payments",
      };
    }

    try {
      const privy = new PrivyClient({
        appId: this.config.appId,
        appSecret: this.config.appSecret,
      });
      const wallet = await privy.wallets().get(this.config.walletId);
      if (wallet.chain_type !== "ethereum") {
        return { success: false, error: `Privy wallet ${wallet.id} is not an Ethereum wallet` };
      }
      if (!wallet.policy_ids.includes(this.config.expectedPolicyId)) {
        return {
          success: false,
          error: `Privy wallet ${wallet.id} does not enforce policy ${this.config.expectedPolicyId}`,
        };
      }

      const account = createViemAccount(privy, {
        walletId: wallet.id,
        address: wallet.address as `0x${string}`,
      });
      const client = new x402Client().register("eip155:*", new ExactEvmScheme(account));
      client.setSpendControls({ maxAmountPerPayment: `$${this.config.perRequestCap}` });
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

      const settlement = await new x402HTTPClient(client).processResponse(response.clone());
      const resource = await response.json();
      const txRef = transactionReference(settlement);
      if (!txRef) {
        return {
          success: false,
          error: "x402 response did not contain a verifiable settlement transaction",
        };
      }

      return {
        success: true,
        txRef,
        data: {
          resource,
          settlement,
          wallet: { id: wallet.id, address: wallet.address },
          policyId: this.config.expectedPolicyId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Privy x402 payment failed",
      };
    }
  }
}

export function createDefaultPolicy(
  allowlistedRecipients: string[],
  totalBudget: number,
  spent = 0,
  ensBudgetCap?: number | null,
): BudgetPolicyConfig {
  return {
    totalBudget,
    spent,
    perRequestCap: 0.1,
    allowlistedRecipients: allowlistedRecipients.map((address) => address.toLowerCase()),
    ensBudgetCap,
  };
}
