export function ReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-2">
      <p className="font-display text-xs uppercase tracking-widest text-success">Research Complete</p>
      <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight">{title}</h1>
      {subtitle && <p className="text-ink/70">{subtitle}</p>}
    </div>
  );
}
