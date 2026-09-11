import { PrivyClient } from "@privy-io/node";
import { createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;
if (!appId || !appSecret) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET are required");
}

const privy = new PrivyClient({ appId, appSecret });
const rpc = process.env.ENS_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const publicClient = createPublicClient({ chain: sepolia, transport: http(rpc) });

async function ensureWallet(existingId, displayName, externalId) {
  if (existingId) return privy.wallets().get(existingId);
  return privy.wallets().create({
    chain_type: "ethereum",
    display_name: displayName,
    external_id: externalId,
    "privy-idempotency-key": externalId,
  });
}

const [owner, agent, unauthorized] = await Promise.all([
  ensureWallet(process.env.ENS_OWNER_PRIVY_WALLET_ID, "Scout ENSv2 owner", "scout-ens-owner-v1"),
  ensureWallet(process.env.ENS_AGENT_PRIVY_WALLET_ID, "Scout ENSv2 agent", "scout-ens-agent-v1"),
  ensureWallet(
    process.env.ENS_UNAUTHORIZED_PRIVY_WALLET_ID,
    "Scout ENSv2 unauthorized test",
    "scout-ens-unauthorized-v1",
  ),
]);

const balances = await Promise.all(
  [owner, agent, unauthorized].map((wallet) =>
    publicClient.getBalance({ address: wallet.address }),
  ),
);

console.log(JSON.stringify({
  network: "Ethereum Sepolia (chain 11155111)",
  ENS_OWNER_PRIVY_WALLET_ID: owner.id,
  ENS_OWNER_WALLET_ADDRESS: owner.address,
  ENS_OWNER_BALANCE_ETH: formatEther(balances[0]),
  ENS_AGENT_PRIVY_WALLET_ID: agent.id,
  ENS_AGENT_WALLET_ADDRESS: agent.address,
  ENS_AGENT_BALANCE_ETH: formatEther(balances[1]),
  ENS_UNAUTHORIZED_PRIVY_WALLET_ID: unauthorized.id,
  ENS_UNAUTHORIZED_WALLET_ADDRESS: unauthorized.address,
  ENS_UNAUTHORIZED_BALANCE_ETH: formatEther(balances[2]),
}, null, 2));
