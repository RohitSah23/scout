import { type HTMLAttributes } from "react";

type SectionVariant = "editorial" | "data" | "action";

const variants: Record<SectionVariant, string> = {
  editorial: "py-16 md:py-24",
  data: "py-8 border-t-2 border-ink",
  action: "py-8 bg-paper-muted border-brutal p-8",
};

export function Section({
  variant = "editorial",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { variant?: SectionVariant }) {
  return (
    <section className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </section>
  );
}
