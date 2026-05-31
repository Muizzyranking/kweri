"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 active:scale-[0.97]";

    const variants = {
      primary:   "bg-orange text-white hover:bg-orange-dim shadow-orange",
      secondary: "bg-elevated text-primary border border-border hover:border-border-bright hover:bg-hover",
      ghost:     "text-secondary hover:text-primary hover:bg-elevated",
      danger:    "text-error border border-error hover:bg-error hover:text-white",
      teal:      "bg-teal text-white hover:bg-teal-bright shadow-teal",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-7",
      md: "text-sm px-4 py-2 h-9",
      lg: "text-base px-6 py-3 h-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
