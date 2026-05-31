import type { QueryRule, Schema } from "../types";

export function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

export function formatValue(rule: QueryRule, schema: Schema): string {
  const field = schema.fields.find((f) => f.name === rule.field);
  const type = field?.type ?? "string";
  const v = rule.value ?? "";

  if (type === "number" || type === "boolean") return v;
  if (type === "date") return `'${v}'`;
  return `'${escapeString(v)}'`;
}
