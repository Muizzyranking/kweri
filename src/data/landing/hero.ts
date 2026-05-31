import type { Step } from "@/types/landing/hero";

export const STEPS: Step[] = [
  { kind: "group", logic: "AND", depth: 0 },
  { kind: "rule", field: "country", op: "=", value: "Nigeria", depth: 1 },
  { kind: "rule", field: "age", op: ">", value: "18", depth: 1 },
  { kind: "group", logic: "OR", depth: 1 },
  { kind: "rule", field: "status", op: "=", value: "active", depth: 2 },
  { kind: "rule", field: "purchases", op: ">", value: "10", depth: 2 },
];

export const SQL_LINES = [
  { text: "SELECT * FROM users", color: "var(--color-orange)" },
  { text: "WHERE", color: "var(--color-muted)" },
  { text: '  country = "Nigeria"', color: "var(--color-primary)" },
  { text: "  AND age > 18", color: "var(--color-primary)" },
  { text: "  AND (", color: "var(--color-muted)" },
  { text: '    status = "active"', color: "var(--color-primary)" },
  { text: "    OR purchases > 10", color: "var(--color-primary)" },
  { text: "  )", color: "var(--color-muted)" },
];
