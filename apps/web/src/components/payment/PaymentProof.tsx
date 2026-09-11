import type { PaymentReceipt } from "@scout/schemas";
import { Card } from "@/components/ui/Card";

function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

export function PaymentProof({ receipt }: { receipt: PaymentReceipt }) {
  return (
    <Card shadow>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-success">Verified settlement</p>
          <p className="font-mono text-2xl mt-2">${receipt.amount.toFixed(2)} {receipt.currency}</p>
        </div>
        <span className="border border-success px-2 py-1 font-mono text-xs text-success">
          {receipt.network}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-xs font-mono sm:grid-cols-2">
        <div>
          <dt className="uppercase text-ink/50">Privy wallet</dt>
          <dd className="mt-1" title={receipt.payer}>{short(receipt.payer)}</dd>
        </div>
        <div>
          <dt className="uppercase text-ink/50">Payee</dt>
          <dd className="mt-1" title={receipt.payee}>{short(receipt.payee)}</dd>
        </div>
        <div>
          <dt className="uppercase text-ink/50">Policy</dt>
          <dd className="mt-1 break-all">{receipt.policyId}</dd>
        </div>
        <div>
          <dt className="uppercase text-ink/50">Settled</dt>
          <dd className="mt-1">{new Date(receipt.settledAt).toLocaleString()}</dd>
        </div>
      </dl>

      <a
        href={receipt.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block font-mono text-xs text-signal underline break-all"
      >
        View transaction {short(receipt.txHash)} ↗
      </a>
    </Card>
  );
}
