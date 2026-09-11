"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { ResearchSession } from "@scout/schemas";

const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export interface WalletButtonProps {
  session?: ResearchSession | null;
  onOpenTreasury?: () => void;
}

function PrivyWalletButton({ session, onOpenTreasury }: WalletButtonProps) {
  const { ready, authenticated, user, login } = usePrivy();
  const balance = session?.budget?.remaining ?? 0.5;

  if (!authenticated) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={login}
          disabled={!ready}
          className="font-display text-xs uppercase tracking-widest px-3 py-1.5 border-brutal bg-ink text-paper hover:bg-signal hover:text-ink transition-all shadow-brutal hover:shadow-brutal-hover"
        >
          Connect Wallet
        </button>
        {onOpenTreasury && (
          <button
            type="button"
            onClick={onOpenTreasury}
            className="hidden lg:flex items-center gap-1.5 font-mono text-xs border-brutal px-2.5 py-1.5 bg-paper hover:bg-paper-muted transition-colors"
            title="Scout Treasury"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            <span>${balance.toFixed(2)}</span>
          </button>
        )}
      </div>
    );
  }

  const address = user?.wallet?.address;
  const networkLabel = "Base Sepolia";

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : user?.email?.address ?? "Connected";

  return (
    <button
      type="button"
      onClick={onOpenTreasury}
      className="font-mono text-xs border-brutal px-3 py-1.5 bg-paper hover:bg-paper-muted transition-all flex items-center gap-2 shadow-brutal hover:shadow-brutal-hover"
      title="View Treasury & Wallet Account"
    >
      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
      <span className="font-bold">{shortAddress}</span>
      <span className="text-[10px] px-1.5 py-0.2 border border-ink/30 bg-paper-muted uppercase font-sans font-semibold">
        {networkLabel}
      </span>
      <span className="text-ink/30">|</span>
      <span className="text-signal font-bold">${balance.toFixed(2)}</span>
    </button>
  );
}

function FallbackWalletButton({ session, onOpenTreasury }: WalletButtonProps) {
  const balance = session?.budget?.remaining ?? 0.5;

  return (
    <button
      type="button"
      onClick={onOpenTreasury}
      className="font-mono text-xs border-brutal px-3 py-1.5 bg-paper hover:bg-paper-muted transition-all flex items-center gap-2 shadow-brutal hover:shadow-brutal-hover"
      title="View Scout Treasury"
    >
      <span className="h-2 w-2 rounded-full bg-success" />
      <span className="font-display uppercase tracking-wider text-[11px]">Treasury</span>
      <span className="text-signal font-bold">${balance.toFixed(2)}</span>
    </button>
  );
}

export function WalletButton(props: WalletButtonProps) {
  if (hasPrivy) {
    return <PrivyWalletButton {...props} />;
  }
  return <FallbackWalletButton {...props} />;
}
