import type { Step } from "@/types/landing/hero";

export const STEPS: Step[] = [
  { kind: "group", logic: "AND", depth: 0 },
  { kind: "rule", field: "role", op: "=", value: "architect", depth: 1 },
  { kind: "rule", field: "rank", op: ">", value: "70", depth: 1 },
  { kind: "group", logic: "OR", depth: 1 },
  { kind: "rule", field: "rankTier", op: "=", value: "mythic", depth: 2 },
  { kind: "rule", field: "mentorScore", op: ">", value: "80", depth: 2 },
];

export const SQL_LINES = [
  { text: "SELECT * FROM players", color: "var(--color-orange)" },
  { text: "WHERE", color: "var(--color-muted)" },
  { text: '  role = "architect"', color: "var(--color-primary)" },
  { text: "  AND rank > 70", color: "var(--color-primary)" },
  { text: "  AND (", color: "var(--color-muted)" },
  { text: '    rankTier = "mythic"', color: "var(--color-primary)" },
  { text: "    OR mentorScore > 80", color: "var(--color-primary)" },
  { text: "  )", color: "var(--color-muted)" },
];
