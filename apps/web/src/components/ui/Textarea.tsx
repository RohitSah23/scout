import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = "", id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block font-display text-xs uppercase tracking-widest text-ink/70">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full border-brutal bg-paper px-4 py-3 font-sans text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-signal ${className}`}
        {...props}
      />
    </div>
  );
}
