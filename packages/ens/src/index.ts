import type { AgentIdentity } from "@scout/schemas";
import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
  type Address,
  type Hex,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const resolverAbi = [
  {
    type: "function",
    name: "text",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
  },
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
] as const;

export interface ENSConfig {
  ensName: string;
  resolverAddress: Address;
  budgetCap: number;
  rpcUrl: string;
  privateKey: Hex;
  unauthorizedPrivateKey?: Hex;
}

export class ENSIdentityProvider implements AgentIdentity {
  private readonly publicClient;
  private readonly account;
  private readonly walletClient;
  private statusWriteProven = false;

  constructor(private readonly config: ENSConfig) {
    this.account = privateKeyToAccount(config.privateKey);
    this.publicClient = createPublicClient({ chain: sepolia, transport: http(config.rpcUrl) });
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(config.rpcUrl),
    });
  }

  async resolveName(): Promise<string> {
    return this.config.ensName;
  }

  async getPermissions(): Promise<Record<string, boolean>> {
    return {
      "text.research.status.configured": true,
      "text.research.status.writeProven": this.statusWriteProven,
      "transfer": false,
      "resolver.change": false,
      "owner.change": false,
    };
  }

  private async readText(key: string): Promise<string> {
    return this.publicClient.readContract({
      address: this.config.resolverAddress,
      abi: resolverAbi,
      functionName: "text",
      args: [namehash(this.config.ensName), key],
    });
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
      const node = namehash(this.config.ensName);
      const txHash = await this.walletClient.writeContract({
        address: this.config.resolverAddress,
        abi: resolverAbi,
        functionName: "setText",
        args: [node, "research.status", status],
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        return { success: false, txHash, error: "ENSv2 status transaction reverted" };
      }
      this.statusWriteProven = true;

      if (reportHash) {
        const reportTx = await this.walletClient.writeContract({
          address: this.config.resolverAddress,
          abi: resolverAbi,
          functionName: "setText",
          args: [node, "research.lastReport", reportHash],
        });
        const reportReceipt = await this.publicClient.waitForTransactionReceipt({ hash: reportTx });
        if (reportReceipt.status !== "success") {
          return { success: false, txHash: reportTx, error: "ENSv2 report transaction reverted" };
        }
      }

      return { success: true, txHash };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "ENSv2 write failed",
      };
    }
  }

  async attemptUnauthorizedWrite(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.unauthorizedPrivateKey) {
      return { success: false, error: "ENS_UNAUTHORIZED_PRIVATE_KEY is required for a real denial test" };
    }
    try {
      const unauthorized = privateKeyToAccount(this.config.unauthorizedPrivateKey);
      const client = createWalletClient({
        account: unauthorized,
        chain: sepolia,
        transport: http(this.config.rpcUrl),
      });
      const txHash = await client.writeContract({
        address: this.config.resolverAddress,
        abi: resolverAbi,
        functionName: "setText",
        args: [namehash(this.config.ensName), "research.status", "unauthorized"],
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return receipt.status === "reverted"
        ? { success: false, error: `Unauthorized ENSv2 write reverted (${txHash})` }
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

export function createENSIdentity(_projectName?: string, budget = 0.5): ENSIdentityProvider {
  const ensName = requiredEnv("ENS_AGENT_NAME");
  const resolverAddress = requiredEnv("ENS_PERMISSIONED_RESOLVER_ADDRESS");
  const privateKey = requiredEnv("ENS_AGENT_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{40}$/.test(resolverAddress)) {
    throw new Error("ENS_PERMISSIONED_RESOLVER_ADDRESS must be a valid EVM address");
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("ENS_AGENT_PRIVATE_KEY must be a 32-byte EVM private key");
  }
  const unauthorizedPrivateKey = process.env.ENS_UNAUTHORIZED_PRIVATE_KEY;
  if (unauthorizedPrivateKey && !/^0x[0-9a-fA-F]{64}$/.test(unauthorizedPrivateKey)) {
    throw new Error("ENS_UNAUTHORIZED_PRIVATE_KEY must be a 32-byte EVM private key");
  }

  return new ENSIdentityProvider({
    ensName,
    resolverAddress: resolverAddress as Address,
    budgetCap: budget,
    rpcUrl: process.env.ENS_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
    privateKey: privateKey as Hex,
    unauthorizedPrivateKey: unauthorizedPrivateKey as Hex | undefined,
  });
}
