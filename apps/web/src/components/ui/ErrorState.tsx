import { Button } from "./Button";

export function ErrorState({
  title = "SCOUT HIT A BLOCKER.",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-brutal border-error bg-paper p-8 space-y-4">
      <h2 className="font-display text-xl uppercase text-error">{title}</h2>
      <p className="text-ink/80">{message}</p>
      <p className="font-mono text-sm text-ink/60">No payment was made.</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
