import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "alert" | "success" | "easy" | "medium" | "hard" | "outline" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: BadgeProps): React.ReactElement {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-slate-800/80 text-slate-300 border border-slate-700/80",
    accent: "bg-purple-950/70 text-purple-300 border border-purple-500/40 font-bold shadow-sm",
    purple: "bg-purple-950/80 text-purple-200 border border-purple-500/50 font-bold",
    alert: "bg-rose-950/70 text-rose-300 border border-rose-500/40 font-bold",
    success: "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold",
    easy: "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold",
    medium: "bg-purple-950/60 text-purple-300 border border-purple-500/40 font-bold",
    hard: "bg-rose-950/60 text-rose-300 border border-rose-500/40 font-bold",
    outline: "bg-transparent text-slate-400 border border-slate-700/70",
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-sans rounded-md tracking-wider uppercase ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

