import { PrivyClient } from "@privy-io/node";
import { createViemAccount } from "@privy-io/node/viem";
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  http,
  keccak256,
  namehash,
  parseAbi,
  parseEventLogs,
  stringToHex,
  toHex,
} from "viem";
import { packetToBytes } from "viem/ens";
import { sepolia } from "viem/chains";

const FACTORY = "0x10dc6333cdfe1fcef624c6e0a8221b91804cd7ef";
const RESOLVER_IMPL = "0x9eae5c2730a7dd16bdd1dee6421a1b91e3b0365e";
const ETH_REGISTRAR = "0xa88553f454b77203b0d036a05c894d555eaaa2cc";
const MOCK_USDC = "0x768f42455a2d082e23ceef7d51e5787c82d67a39";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = `0x${"00".repeat(32)}`;
const ALL_ROLES = 0x1111111111111111111111111111111111111111111111111111111111111111n;

const factoryAbi = parseAbi([
  "function deployProxy(address implementation, uint256 salt, bytes data)",
  "event ProxyDeployed(address indexed sender, address indexed proxyAddress, uint256 salt, address implementation)",
]);
const resolverAbi = parseAbi([
  "function initialize(address admin, uint256 roleBitmap, bytes[] setters)",
  "function setAddr(bytes32 node, address addr_)",
  "function setText(bytes32 node, string key, string value)",
  "function multicall(bytes[] data) returns (bytes[])",
  "function authorizeTextRoles(bytes toName, string key, address account, bool grant)",
]);
const registrarAbi = parseAbi([
  "function isAvailable(string label) view returns (bool)",
  "function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)",
  "function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) view returns (bytes32)",
  "function commit(bytes32 commitment)",
  "function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256 tokenId)",
  "function MIN_COMMITMENT_AGE() view returns (uint256)",
]);
const mintAbi = parseAbi(["function mint(address to, uint256 amount)"]);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const appId = required("NEXT_PUBLIC_PRIVY_APP_ID");
const appSecret = required("PRIVY_APP_SECRET");
const ensName = required("ENS_AGENT_NAME");
if (!ensName.endsWith(".eth") || ensName.split(".").length !== 2) {
  throw new Error("ENS_AGENT_NAME must be a second-level .eth name");
}
const label = ensName.slice(0, -4);
const rpcUrl = process.env.ENS_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const privy = new PrivyClient({ appId, appSecret });
const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

async function account(walletIdName, addressName) {
  const wallet = await privy.wallets().get(required(walletIdName));
  const configuredAddress = required(addressName);
  if (wallet.address.toLowerCase() !== configuredAddress.toLowerCase()) {
    throw new Error(`${addressName} does not match the Privy wallet`);
  }
  return createViemAccount(privy, { walletId: wallet.id, address: wallet.address });
}

const [owner, agent, unauthorized] = await Promise.all([
  account("ENS_OWNER_PRIVY_WALLET_ID", "ENS_OWNER_WALLET_ADDRESS"),
  account("ENS_AGENT_PRIVY_WALLET_ID", "ENS_AGENT_WALLET_ADDRESS"),
  account("ENS_UNAUTHORIZED_PRIVY_WALLET_ID", "ENS_UNAUTHORIZED_WALLET_ADDRESS"),
]);
const ownerClient = createWalletClient({ account: owner, chain: sepolia, transport: http(rpcUrl) });
const agentClient = createWalletClient({ account: agent, chain: sepolia, transport: http(rpcUrl) });
const unauthorizedClient = createWalletClient({ account: unauthorized, chain: sepolia, transport: http(rpcUrl) });

const balances = await Promise.all(
  [owner, agent, unauthorized].map((entry) => publicClient.getBalance({ address: entry.address })),
);
const minimumOwnerBalance = 40_000_000_000_000_000n;
if (balances[0] < minimumOwnerBalance) {
  console.log(JSON.stringify({
    status: "FUNDING_REQUIRED",
    network: "Ethereum Sepolia (chain 11155111)",
    address: owner.address,
    requestedEth: "0.050",
    note: "The owner wallet will automatically fund the agent and unauthorized-test wallets.",
  }, null, 2));
  process.exitCode = 2;
} else {
  const receipt = async (hash, labelText) => {
    const value = await publicClient.waitForTransactionReceipt({ hash });
    if (value.status !== "success") throw new Error(`${labelText} reverted: ${hash}`);
    console.log(`${labelText}: ${hash}`);
    return value;
  };

  const participantMinimums = [
    { account: agent, balance: balances[1], minimum: 3_000_000_000_000_000n, label: "agent" },
    { account: unauthorized, balance: balances[2], minimum: 1_000_000_000_000_000n, label: "unauthorized test" },
  ];
  for (const participant of participantMinimums) {
    if (participant.balance < participant.minimum) {
      await receipt(await ownerClient.sendTransaction({
        to: participant.account.address,
        value: participant.minimum - participant.balance,
      }), `Funded ${participant.label} wallet`);
    }
  }

  const available = await publicClient.readContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "isAvailable",
    args: [label],
  });
  if (!available) throw new Error(`${ensName} is no longer available`);

  const version = 0n;
  const resolverSalt = BigInt(keccak256(encodeAbiParameters(
    [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
    [keccak256(stringToHex("OwnedResolver")), owner.address, version],
  )));
  const resolverInitData = encodeFunctionData({
    abi: resolverAbi,
    functionName: "initialize",
    args: [owner.address, ALL_ROLES, []],
  });
  const resolverDeployHash = await ownerClient.writeContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: "deployProxy",
    args: [RESOLVER_IMPL, resolverSalt, resolverInitData],
  });
  const resolverReceipt = await receipt(resolverDeployHash, "Resolver proxy deployed");
  const [resolverLog] = parseEventLogs({
    abi: factoryAbi,
    eventName: "ProxyDeployed",
    logs: resolverReceipt.logs,
  });
  if (!resolverLog) throw new Error("Resolver deployment event was not found");
  const resolver = resolverLog.args.proxyAddress;

  await receipt(await ownerClient.writeContract({
    address: MOCK_USDC,
    abi: mintAbi,
    functionName: "mint",
    args: [owner.address, 100_000_000n],
  }), "MockUSDC minted");

  const duration = 31_536_000n;
  const [base, premium] = await publicClient.readContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "getRegisterPrice",
    args: [label, duration, MOCK_USDC],
  });
  await receipt(await ownerClient.writeContract({
    address: MOCK_USDC,
    abi: erc20Abi,
    functionName: "approve",
    args: [ETH_REGISTRAR, base + premium],
  }), "MockUSDC approved");

  const secret = keccak256(toHex(crypto.randomUUID()));
  const commitment = await publicClient.readContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "makeCommitment",
    args: [label, owner.address, secret, ZERO_ADDRESS, resolver, duration, ZERO_HASH],
  });
  await receipt(await ownerClient.writeContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "commit",
    args: [commitment],
  }), "Registration committed");
  const minimumAge = await publicClient.readContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "MIN_COMMITMENT_AGE",
  });
  console.log(`Waiting ${minimumAge + 2n}s for the real commit-reveal window…`);
  await new Promise((resolve) => setTimeout(resolve, Number(minimumAge + 2n) * 1_000));

  await receipt(await ownerClient.writeContract({
    address: ETH_REGISTRAR,
    abi: registrarAbi,
    functionName: "register",
    args: [label, owner.address, secret, ZERO_ADDRESS, resolver, duration, MOCK_USDC, ZERO_HASH],
  }), `${ensName} registered`);

  const node = namehash(ensName);
  const apiUrl = process.env.PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const setupCalls = [
    encodeFunctionData({ abi: resolverAbi, functionName: "setAddr", args: [node, agent.address] }),
    encodeFunctionData({ abi: resolverAbi, functionName: "setText", args: [node, "agent.type", "autonomous-research"] }),
    encodeFunctionData({ abi: resolverAbi, functionName: "setText", args: [node, "agent.mcp", `${apiUrl}/mcp`] }),
    encodeFunctionData({ abi: resolverAbi, functionName: "setText", args: [node, "research.budget", "0.50"] }),
  ];
  await receipt(await ownerClient.writeContract({
    address: resolver,
    abi: resolverAbi,
    functionName: "multicall",
    args: [setupCalls],
  }), "Identity records initialized");

  const dnsName = toHex(packetToBytes(ensName));
  for (const key of ["research.status", "research.lastReport"]) {
    await receipt(await ownerClient.writeContract({
      address: resolver,
      abi: resolverAbi,
      functionName: "authorizeTextRoles",
      args: [dnsName, key, agent.address, true],
    }), `Delegated ${key}`);
  }

  const authorizedCalls = [
    encodeFunctionData({ abi: resolverAbi, functionName: "setText", args: [node, "research.status", "ready"] }),
    encodeFunctionData({ abi: resolverAbi, functionName: "setText", args: [node, "research.lastReport", "provisioning-proof"] }),
  ];
  const authorizedHash = await agentClient.writeContract({
    address: resolver,
    abi: resolverAbi,
    functionName: "multicall",
    args: [authorizedCalls],
  });
  await receipt(authorizedHash, "Scoped agent write succeeded");

  const unauthorizedHash = await unauthorizedClient.writeContract({
    address: resolver,
    abi: resolverAbi,
    functionName: "setText",
    args: [node, "research.status", "unauthorized"],
    gas: 200_000n,
  });
  const unauthorizedReceipt = await publicClient.waitForTransactionReceipt({ hash: unauthorizedHash });
  if (unauthorizedReceipt.status !== "reverted") {
    throw new Error(`SECURITY FAILURE: unauthorized write succeeded: ${unauthorizedHash}`);
  }
  console.log(`Unauthorized write reverted on-chain: ${unauthorizedHash}`);

  const resolved = await publicClient.getEnsAddress({ name: ensName });
  if (resolved?.toLowerCase() !== agent.address.toLowerCase()) {
    throw new Error(`Forward resolution verification failed: ${String(resolved)}`);
  }

  console.log(JSON.stringify({
    status: "COMPLETE",
    ENS_AGENT_NAME: ensName,
    ENS_PERMISSIONED_RESOLVER_ADDRESS: resolver,
    authorizedWriteTx: authorizedHash,
    unauthorizedRevertTx: unauthorizedHash,
    explorer: `https://sepolia.etherscan.io/address/${agent.address}`,
  }, null, 2));
}
