import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "panel" | "interactive";
  bordered?: boolean;
}

export function Card({
  children,
  variant = "default",
  bordered = true,
  className = "",
  ...props
}: CardProps): React.ReactElement {
  const variantStyles = {
    default: "bg-detective-surface/90 backdrop-blur-md border border-detective-border/80 shadow-xl",
    panel: "bg-detective-panel/80 backdrop-blur-md border border-detective-border shadow-xl",
    interactive:
      "bg-detective-surface/90 backdrop-blur-md border border-detective-border/80 hover:border-purple-500/50 hover:bg-detective-panel/90 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-950/30 group",
  };

  return (
    <div
      className={`rounded-xl overflow-hidden ${variantStyles[variant]} ${
        bordered ? "" : "border-0"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div className={`p-4 sm:p-5 border-b border-detective-border/70 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={`p-4 sm:p-5 border-t border-detective-border/70 bg-detective-panel/40 ${className}`}
    >
      {children}
    </div>
  );
}

