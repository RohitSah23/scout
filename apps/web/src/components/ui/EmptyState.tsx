import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="border-brutal border-dashed p-12 text-center space-y-4">
      <h2 className="font-display text-2xl uppercase tracking-wide">{title}</h2>
      <p className="text-ink/70 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
