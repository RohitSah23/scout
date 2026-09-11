import type { PaymentProvider, PaymentRequest, PaymentResult } from "@scout/schemas";

/**
 * Timeboxed Hedera Blocky402 adapter — swap PaymentProvider when Graph+ENS+Privy are solid.
 * Uses same interface as @scout/x402 for drop-in replacement.
 */
export class HederaBlocky402Provider implements PaymentProvider {
  constructor(private facilitatorUrl = "https://blocky402.testnet.hedera") {}

  async pay(_request: PaymentRequest): Promise<PaymentResult> {
    return {
      success: false,
      error: `Hedera payments are not implemented. Configure an official Blocky402 client for ${this.facilitatorUrl} before enabling this adapter.`,
    };
  }
}
