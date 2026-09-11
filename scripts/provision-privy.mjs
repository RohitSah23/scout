import { PrivyClient } from "@privy-io/node";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;
const payTo = process.env.X402_PAY_TO_ADDRESS;
const existingWalletId = process.env.PRIVY_WALLET_ID;
const baseSepoliaUsdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
if (!appId || !appSecret || !payTo || !/^0x[0-9a-fA-F]{40}$/.test(payTo)) {
  throw new Error("Privy credentials and a valid X402_PAY_TO_ADDRESS are required");
}

const transferAuthorization = {
  primary_type: "TransferWithAuthorization",
  types: {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  },
};

const privy = new PrivyClient({ appId, appSecret });
const policy = await privy.policies().create({
  chain_type: "ethereum",
  name: "Scout Base Sepolia x402 policy",
  version: "1.0",
  rules: [
    {
      name: "Allow Base Sepolia USDC x402 authorizations",
      action: "ALLOW",
      method: "eth_signTypedData_v4",
      conditions: [
        {
          field_source: "ethereum_typed_data_domain",
          field: "chain_id",
          operator: "eq",
          value: "84532",
        },
        {
          field_source: "ethereum_typed_data_domain",
          field: "verifying_contract",
          operator: "eq",
          value: baseSepoliaUsdc,
        },
        {
          field_source: "ethereum_typed_data_message",
          field: "to",
          operator: "eq",
          value: payTo,
          typed_data: transferAuthorization,
        },
        {
          field_source: "ethereum_typed_data_message",
          field: "value",
          operator: "lte",
          value: "100000",
          typed_data: transferAuthorization,
        },
      ],
    },
  ],
  "privy-idempotency-key": "scout-base-sepolia-x402-policy-v2",
});

const wallet = existingWalletId
  ? await privy.wallets().update(existingWalletId, { policy_ids: [policy.id] })
  : await privy.wallets().create({
      chain_type: "ethereum",
      display_name: "Scout x402 payer",
      external_id: "scout-x402-payer-v1",
      policy_ids: [policy.id],
      "privy-idempotency-key": "scout-base-sepolia-x402-wallet-v1",
    });

console.log(JSON.stringify({
  PRIVY_WALLET_ID: wallet.id,
  PRIVY_WALLET_ADDRESS: wallet.address,
  PRIVY_POLICY_ID: policy.id,
}, null, 2));
