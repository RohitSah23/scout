import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:shadow-brutal-hover",
  secondary: "bg-paper text-ink hover:shadow-brutal-hover",
  danger: "bg-signal text-paper hover:shadow-brutal-hover",
  ghost: "bg-transparent text-ink hover:bg-paper-muted",
};

export function Button({
  variant = "primary",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border-brutal px-6 py-3 font-display text-sm uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
