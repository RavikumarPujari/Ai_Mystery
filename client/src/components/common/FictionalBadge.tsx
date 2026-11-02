import React from "react";
import { Sparkles } from "lucide-react";

interface FictionalBadgeProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function FictionalBadge({
  label = "AI INVESTIGATION SIMULATION • FICTIONAL RECORD",
  size = "md",
  className = "",
}: FictionalBadgeProps): React.ReactElement {
  const isSmall = size === "sm";

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 backdrop-blur-sm ${
        isSmall ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1 text-xs"
      } ${className}`}
      role="note"
      aria-label="Fictional AI Content Disclaimer"
    >
      <Sparkles className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-purple-400 shrink-0`} />
      <span>{label}</span>
    </div>
  );
}

