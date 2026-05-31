"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "w-9 h-9 rounded-md flex items-center justify-center",
        "bg-elevated border border-border",
        "hover:border-border-bright hover:bg-hover",
        "transition-all duration-200 active:scale-95 cursor-pointer",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun size={15} className="text-secondary" />
      ) : (
        <Moon size={15} className="text-secondary" />
      )}
    </button>
  );
}
