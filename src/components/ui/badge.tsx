import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "orange" | "teal" | "success" | "error" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-elevated text-secondary border border-border",
    orange:  "bg-orange-glow text-orange border border-orange/30",
    teal:    "bg-teal-glow text-teal-bright border border-teal-bright/30",
    success: "bg-success/10 text-success border border-success/30",
    error:   "bg-error/10 text-error border border-error/30",
    warning: "bg-warning/10 text-warning border border-warning/30",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
