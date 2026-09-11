import { PrivyClient } from "@privy-io/node";
import { createViemAccount } from "@privy-io/node/viem";
import type { AgentIdentity } from "@scout/schemas";
import {
  concat,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  keccak256,
  namehash,
  stringToHex,
  type Account,
  type Address,
  type Hex,
} from "viem";
import { normalize } from "viem/ens";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const ROLE_SET_TEXT = 1n << 4n;

const resolverAbi = [
  {
    type: "function",
    name: "setText",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "multicall",
    stateMutability: "nonpayable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
  {
    type: "function",
    name: "roles",
    stateMutability: "view",
    inputs: [
      { name: "resource", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "roleBitmap", type: "uint256" }],
  },
  {
    type: "function",
    name: "hasRootRoles",
    stateMutability: "view",
    inputs: [
      { name: "roleBitmap", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export interface ENSConfig {
  ensName: string;
  rpcUrl: string;
  account: Account;
  unauthorizedAccount?: Account;
}

function textResource(name: string, key: string): bigint {
  const node = namehash(normalize(name));
  const part = keccak256(stringToHex(key));
  return BigInt(keccak256(concat([node, part])));
}

export class ENSIdentityProvider implements AgentIdentity {
  private readonly publicClient;

  constructor(private readonly config: ENSConfig) {
    this.publicClient = createPublicClient({ chain: sepolia, transport: http(config.rpcUrl) });
  }

  private async resolverAddress(): Promise<Address> {
    const resolver = await this.publicClient.getEnsResolver({
      name: normalize(this.config.ensName),
    });
    if (!resolver) throw new Error(`${this.config.ensName} has no resolver`);
    return resolver;
  }

  private wallet(account = this.config.account) {
    return createWalletClient({
      account,
      chain: sepolia,
      transport: http(this.config.rpcUrl),
    });
  }

  async resolveName(): Promise<string> {
    const address = await this.publicClient.getEnsAddress({
      name: normalize(this.config.ensName),
    });
    if (!address) throw new Error(`${this.config.ensName} does not resolve to an address`);
    if (address.toLowerCase() !== this.config.account.address.toLowerCase()) {
      throw new Error(`${this.config.ensName} does not resolve to the configured ENS agent wallet`);
    }
    return this.config.ensName;
  }

  async getPermissions(): Promise<Record<string, boolean>> {
    const resolver = await this.resolverAddress();
    const [statusRoles, reportRoles, rootText] = await Promise.all([
      this.publicClient.readContract({
        address: resolver,
        abi: resolverAbi,
        functionName: "roles",
        args: [textResource(this.config.ensName, "research.status"), this.config.account.address],
      }),
      this.publicClient.readContract({
        address: resolver,
        abi: resolverAbi,
        functionName: "roles",
        args: [textResource(this.config.ensName, "research.lastReport"), this.config.account.address],
      }),
      this.publicClient.readContract({
        address: resolver,
        abi: resolverAbi,
        functionName: "hasRootRoles",
        args: [ROLE_SET_TEXT, this.config.account.address],
      }),
    ]);

    return {
      "text.research.status": (statusRoles & ROLE_SET_TEXT) === ROLE_SET_TEXT,
      "text.research.lastReport": (reportRoles & ROLE_SET_TEXT) === ROLE_SET_TEXT,
      "text.root": rootText,
    };
  }

  private async readText(key: string): Promise<string> {
    return (await this.publicClient.getEnsText({
      name: normalize(this.config.ensName),
      key,
    })) ?? "";
  }

  async getBudgetCap(): Promise<number | null> {
    const value = await this.readText("research.budget");
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async writeResearchStatus(
    status: string,
    reportHash?: string,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const resolver = await this.resolverAddress();
      const node = namehash(normalize(this.config.ensName));
      const calls = [
        encodeFunctionData({
          abi: resolverAbi,
          functionName: "setText",
          args: [node, "research.status", status],
        }),
      ];
      if (reportHash) {
        calls.push(encodeFunctionData({
          abi: resolverAbi,
          functionName: "setText",
          args: [node, "research.lastReport", reportHash],
        }));
      }

      const txHash = await this.wallet().writeContract({
        address: resolver,
        abi: resolverAbi,
        functionName: "multicall",
        args: [calls],
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return receipt.status === "success"
        ? { success: true, txHash }
        : { success: false, txHash, error: "ENSv2 status transaction reverted" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "ENSv2 write failed",
      };
    }
  }

  async attemptUnauthorizedWrite(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.unauthorizedAccount) {
      return { success: false, error: "An ENS unauthorized test wallet is required for a real denial test" };
    }
    try {
      const resolver = await this.resolverAddress();
      const txHash = await this.wallet(this.config.unauthorizedAccount).writeContract({
        address: resolver,
        abi: resolverAbi,
        functionName: "setText",
        args: [namehash(normalize(this.config.ensName)), "research.status", "unauthorized"],
        gas: 200_000n,
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return receipt.status === "reverted"
        ? { success: false, error: `Unauthorized ENSv2 write reverted on-chain (${txHash})` }
        : { success: true, error: `SECURITY FAILURE: unauthorized write succeeded (${txHash})` };
    } catch (error) {
      return {
        success: false,
        error: `Unauthorized ENSv2 write rejected: ${error instanceof Error ? error.message : "reverted"}`,
      };
    }
  }

  async getRecords(): Promise<Record<string, string>> {
    const keys = ["research.status", "research.budget", "research.lastReport", "agent.type", "agent.mcp"];
    const values = await Promise.all(keys.map(async (key) => [key, await this.readText(key)] as const));
    return Object.fromEntries(values.filter(([, value]) => value !== ""));
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for live ENSv2 integration`);
  return value;
}

function localAccount(name: string): Account | undefined {
  const key = process.env[name];
  if (!key) return undefined;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error(`${name} must be a 32-byte EVM private key`);
  return privateKeyToAccount(key as Hex);
}

function privyAccount(walletIdName: string, addressName: string): Account | undefined {
  const walletId = process.env[walletIdName];
  const address = process.env[addressName];
  if (!walletId && !address) return undefined;
  if (!walletId || !address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`${walletIdName} and a valid ${addressName} must both be set`);
  }
  const privy = new PrivyClient({
    appId: requiredEnv("NEXT_PUBLIC_PRIVY_APP_ID"),
    appSecret: requiredEnv("PRIVY_APP_SECRET"),
  });
  return createViemAccount(privy, { walletId, address: address as Address });
}

export function createENSIdentity(_projectName?: string, _budget = 0.5): ENSIdentityProvider {
  const account = privyAccount("ENS_AGENT_PRIVY_WALLET_ID", "ENS_AGENT_WALLET_ADDRESS")
    ?? localAccount("ENS_AGENT_PRIVATE_KEY");
  if (!account) {
    throw new Error("ENS agent wallet is required (Privy wallet ID/address or ENS_AGENT_PRIVATE_KEY)");
  }
  const unauthorizedAccount = privyAccount(
    "ENS_UNAUTHORIZED_PRIVY_WALLET_ID",
    "ENS_UNAUTHORIZED_WALLET_ADDRESS",
  ) ?? localAccount("ENS_UNAUTHORIZED_PRIVATE_KEY");

  return new ENSIdentityProvider({
    ensName: requiredEnv("ENS_AGENT_NAME"),
    rpcUrl: process.env.ENS_SEPOLIA_RPC_URL ?? "https://sepolia.gateway.tenderly.co",
    account,
    unauthorizedAccount,
  });
}
