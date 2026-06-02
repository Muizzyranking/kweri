import type { Step } from "@/types/landing/hero";

export const STEPS: Step[] = [
  { kind: "group", logic: "AND", depth: 0 },
  { kind: "rule", field: "faction", op: "=", value: "nova_guard", depth: 1 },
  { kind: "rule", field: "rank", op: ">", value: "40", depth: 1 },
  { kind: "group", logic: "OR", depth: 1 },
  { kind: "rule", field: "class", op: "=", value: "voidwalker", depth: 2 },
  { kind: "rule", field: "xp", op: ">", value: "250000", depth: 2 },
];

export const SQL_LINES = [
  { text: "SELECT * FROM players", color: "var(--color-orange)" },
  { text: "WHERE", color: "var(--color-muted)" },
  { text: '  faction = "nova_guard"', color: "var(--color-primary)" },
  { text: "  AND rank > 40", color: "var(--color-primary)" },
  { text: "  AND (", color: "var(--color-muted)" },
  { text: '    class = "voidwalker"', color: "var(--color-primary)" },
  { text: "    OR xp > 250000", color: "var(--color-primary)" },
  { text: "  )", color: "var(--color-muted)" },
];
