import type { QueryGroup, QueryRule, Schema } from "../types";

function ruleToMongo(rule: QueryRule, schema: Schema): Record<string, unknown> {
  const { field, operator, value = "", valueTo = "" } = rule;
  const field_ = schema.fields.find((f) => f.name === field);
  const type = field_?.type ?? "string";

  const coerce = (v: string): unknown => {
    if (type === "number") return Number(v);
    if (type === "boolean") return v === "true";
    if (type === "date") return { $date: v };
    return v;
  };

  switch (operator) {
    case "equals":
      return { [field]: { $eq: coerce(value) } };
    case "not_equals":
      return { [field]: { $ne: coerce(value) } };
    case "contains":
      return { [field]: { $regex: value, $options: "i" } };
    case "not_contains":
      return { [field]: { $not: { $regex: value, $options: "i" } } };
    case "starts_with":
      return { [field]: { $regex: `^${value}`, $options: "i" } };
    case "ends_with":
      return { [field]: { $regex: `${value}$`, $options: "i" } };
    case "greater_than":
      return { [field]: { $gt: coerce(value) } };
    case "less_than":
      return { [field]: { $lt: coerce(value) } };
    case "greater_than_or_equal":
      return { [field]: { $gte: coerce(value) } };
    case "less_than_or_equal":
      return { [field]: { $lte: coerce(value) } };
    case "in_array": {
      const vals = value.split(",").map((v) => coerce(v.trim()));
      return { [field]: { $in: vals } };
    }
    case "not_in_array": {
      const vals = value.split(",").map((v) => coerce(v.trim()));
      return { [field]: { $nin: vals } };
    }
    case "between":
      return { [field]: { $gte: coerce(value), $lte: coerce(valueTo) } };
    case "is_null":
      return { [field]: { $eq: null } };
    case "is_not_null":
      return { [field]: { $ne: null } };
    case "regex":
      return { [field]: { $regex: value } };
    case "before":
      return { [field]: { $lt: coerce(value) } };
    case "after":
      return { [field]: { $gt: coerce(value) } };
    case "on_date":
      return { [field]: { $eq: coerce(value) } };
    default:
      return { [field]: { $eq: coerce(value) } };
  }
}

function groupToMongo(
  group: QueryGroup,
  schema: Schema,
): Record<string, unknown> {
  if (group.children.length === 0) return {};

  const parts = group.children.map((child) =>
    child.kind === "rule"
      ? ruleToMongo(child, schema)
      : groupToMongo(child, schema),
  );

  if (parts.length === 1) return parts[0];
  return { [`$${group.logic.toLowerCase()}`]: parts };
}

export function generateMongoDB(root: QueryGroup, schema: Schema): string {
  const filter = groupToMongo(root, schema);
  return `db.${schema.name}.find(\n${JSON.stringify(filter, null, 2)}\n)`;
}
