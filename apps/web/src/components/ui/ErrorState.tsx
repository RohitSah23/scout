import { Button } from "./Button";

export function ErrorState({
  title = "SCOUT HIT A BLOCKER.",
  message,
  note = "No payment was made.",
  onRetry,
  retryLabel = "Retry",
}: {
  title?: string;
  message: string;
  note?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="border-brutal border-error bg-paper p-8 space-y-4">
      <h2 className="font-display text-xl uppercase text-error">{title}</h2>
      <p className="text-ink/80">{message}</p>
      {note && <p className="font-mono text-sm text-ink/60">{note}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>}
    </div>
  );
}
