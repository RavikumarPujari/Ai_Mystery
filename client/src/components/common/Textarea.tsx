import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  minChars?: number;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount,
      minChars,
      maxChars,
      value,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const charCount = typeof value === "string" ? value.length : 0;
    const isUnderMin = minChars !== undefined && charCount > 0 && charCount < minChars;
    const isOverMax = maxChars !== undefined && charCount > maxChars;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              {label}
            </label>
          )}
          {showCharCount && (
            <span
              className={`text-xs font-mono font-medium ${
                isUnderMin || isOverMax
                  ? "text-rose-400 font-bold"
                  : "text-slate-400"
              }`}
            >
              {charCount}
              {maxChars ? ` / ${maxChars}` : ""} chars
              {minChars && charCount < minChars ? ` (min ${minChars})` : ""}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          className={`w-full rounded-xl bg-slate-900/90 border px-4 py-3 text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
            error || isUnderMin || isOverMax
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
              : "border-slate-700/80 focus:border-purple-500"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

