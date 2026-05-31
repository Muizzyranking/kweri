import type { QueryGroup, QueryRule, Schema } from "../types";

function ruleToGraphQL(rule: QueryRule, schema: Schema): string {
  const { field, operator, value = "", valueTo = "" } = rule;
  const field_ = schema.fields.find((f) => f.name === field);
  const type = field_?.type ?? "string";

  const fv = (v: string) =>
    type === "number" || type === "boolean" ? v : `"${v}"`;

  switch (operator) {
    case "equals":
      return `${field}: { eq: ${fv(value)} }`;
    case "not_equals":
      return `${field}: { neq: ${fv(value)} }`;
    case "contains":
      return `${field}: { contains: ${fv(value)} }`;
    case "not_contains":
      return `${field}: { notContains: ${fv(value)} }`;
    case "starts_with":
      return `${field}: { startsWith: ${fv(value)} }`;
    case "ends_with":
      return `${field}: { endsWith: ${fv(value)} }`;
    case "greater_than":
      return `${field}: { gt: ${fv(value)} }`;
    case "less_than":
      return `${field}: { lt: ${fv(value)} }`;
    case "greater_than_or_equal":
      return `${field}: { gte: ${fv(value)} }`;
    case "less_than_or_equal":
      return `${field}: { lte: ${fv(value)} }`;
    case "in_array": {
      const vals = value
        .split(",")
        .map((v) => fv(v.trim()))
        .join(", ");
      return `${field}: { in: [${vals}] }`;
    }
    case "not_in_array": {
      const vals = value
        .split(",")
        .map((v) => fv(v.trim()))
        .join(", ");
      return `${field}: { notIn: [${vals}] }`;
    }
    case "between":
      return `${field}: { between: { from: ${fv(value)}, to: ${fv(valueTo)} } }`;
    case "is_null":
      return `${field}: { isNull: true }`;
    case "is_not_null":
      return `${field}: { isNull: false }`;
    case "regex":
      return `${field}: { regex: "${value}" }`;
    case "before":
      return `${field}: { lt: ${fv(value)} }`;
    case "after":
      return `${field}: { gt: ${fv(value)} }`;
    case "on_date":
      return `${field}: { eq: ${fv(value)} }`;
    default:
      return `${field}: { eq: ${fv(value)} }`;
  }
}

function groupToGraphQL(group: QueryGroup, schema: Schema, indent = 2): string {
  if (group.children.length === 0) return "";

  const pad = " ".repeat(indent);
  const logic = group.logic === "AND" ? "AND" : "OR";

  const parts = group.children.map((child) => {
    if (child.kind === "rule") return `${pad}  ${ruleToGraphQL(child, schema)}`;
    const inner = groupToGraphQL(child, schema, indent + 4);
    return `${pad}  ${logic}: {\n${inner}\n${pad}  }`;
  });

  const joined = parts.join("\n");
  if (group.children.length === 1) return joined;
  return `${pad}${logic}: {\n${joined}\n${pad}}`;
}

export function generateGraphQL(root: QueryGroup, schema: Schema): string {
  const filter = groupToGraphQL(root, schema, 2);
  const name = schema.name;
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return `query Get${capitalized} {\n  ${name}(\n    filter: {\n${filter}\n    }\n  ) {\n    id\n    # ...fields\n  }\n}`;
}
