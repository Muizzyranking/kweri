import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
}

export function KweriLogoMark({ size = 32, className }: Props) {
  const s = size;
  const r = s * 0.25;

  return (
    <svg
      aria-hidden="true"
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Kweri logo"
    >
      <rect width="32" height="32" rx={r} />
      <rect x="4" y="7" width="24" height="4" rx="2" fill="#117E93" />
      <rect x="7" y="14" width="18" height="4" rx="2" fill="#FFB000" />
      <rect x="10" y="21" width="9" height="4" rx="2" fill="#FFB000" />
      <circle cx="23" cy="23" r="3" fill="#117E93" />
    </svg>
  );
}

export function KweriWordmark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <KweriLogoMark size={size} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size * 0.56,
          fontWeight: 700,
          color: "var(--color-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        Kweri
      </span>
    </span>
  );
}
