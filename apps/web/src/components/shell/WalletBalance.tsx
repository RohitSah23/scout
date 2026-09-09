"use client";

interface WalletBalanceProps {
  balance: number;
  onClick?: () => void;
}

export function WalletBalance({ balance, onClick }: WalletBalanceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-sm border-brutal px-3 py-1.5 bg-paper hover:shadow-brutal-hover transition-all"
    >
      {balance.toFixed(2)} USDC
    </button>
  );
}
