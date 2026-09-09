import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: boolean;
  dark?: boolean;
}

export function Card({ shadow, dark, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`border-brutal p-6 ${shadow ? "shadow-brutal" : ""} ${dark ? "bg-paper-dark text-paper" : "bg-paper"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
