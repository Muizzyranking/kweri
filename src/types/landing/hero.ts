export type Step =
  | { kind: "group"; logic: "AND" | "OR"; depth: number }
  | { kind: "rule"; field: string; op: string; value: string; depth: number };
