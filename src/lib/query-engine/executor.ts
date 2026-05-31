import type {
  ExecuteOptions,
  ExecutionResult,
  QueryGroup,
  QueryNode,
  QueryRule,
  Schema,
} from "./types";

// VALUE MATCHERS
function matchRule(
  row: Record<string, unknown>,
  rule: QueryRule,
  schema: Schema,
): boolean {
  const field = schema.fields.find((f) => f.name === rule.field);
  if (!field) return false;

  const rawValue = row[rule.field];
  const value = rule.value ?? "";
  const valueTo = rule.valueTo ?? "";

  switch (rule.operator) {
    case "is_null":
      return rawValue === null || rawValue === undefined || rawValue === "";
    case "is_not_null":
      return rawValue !== null && rawValue !== undefined && rawValue !== "";
  }

  // Coerce row value for comparison
  const str = String(rawValue ?? "").toLowerCase();
  const val = value.toLowerCase();

  switch (rule.operator) {
    case "equals":
      if (field.type === "number") return Number(rawValue) === Number(value);
      if (field.type === "boolean") return String(rawValue) === value;
      return str === val;

    case "not_equals":
      if (field.type === "number") return Number(rawValue) !== Number(value);
      return str !== val;

    case "contains":
      return str.includes(val);

    case "not_contains":
      return !str.includes(val);

    case "starts_with":
      return str.startsWith(val);

    case "ends_with":
      return str.endsWith(val);

    case "greater_than":
      if (field.type === "date")
        return new Date(String(rawValue)) > new Date(value);
      return Number(rawValue) > Number(value);

    case "less_than":
      if (field.type === "date")
        return new Date(String(rawValue)) < new Date(value);
      return Number(rawValue) < Number(value);

    case "greater_than_or_equal":
      if (field.type === "date")
        return new Date(String(rawValue)) >= new Date(value);
      return Number(rawValue) >= Number(value);

    case "less_than_or_equal":
      if (field.type === "date")
        return new Date(String(rawValue)) <= new Date(value);
      return Number(rawValue) <= Number(value);

    case "in_array": {
      const vals = value.split(",").map((v) => v.trim().toLowerCase());
      return vals.includes(str);
    }

    case "not_in_array": {
      const vals = value.split(",").map((v) => v.trim().toLowerCase());
      return !vals.includes(str);
    }

    case "between":
      if (field.type === "date") {
        const d = new Date(String(rawValue));
        return d >= new Date(value) && d <= new Date(valueTo);
      }
      return (
        Number(rawValue) >= Number(value) && Number(rawValue) <= Number(valueTo)
      );

    case "regex":
      try {
        return new RegExp(value, "i").test(String(rawValue ?? ""));
      } catch {
        return false;
      }

    case "before":
      return new Date(String(rawValue)) < new Date(value);

    case "after":
      return new Date(String(rawValue)) > new Date(value);

    case "on_date": {
      const d = new Date(String(rawValue));
      const t = new Date(value);
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    }

    default:
      return false;
  }
}

// RECURSIVE GROUP MATCHER
function matchNode(
  row: Record<string, unknown>,
  node: QueryNode,
  schema: Schema,
): boolean {
  if (node.kind === "rule") return matchRule(row, node, schema);

  const { logic, children } = node;
  if (children.length === 0) return true;

  if (logic === "AND") return children.every((c) => matchNode(row, c, schema));
  return children.some((c) => matchNode(row, c, schema));
}

// PUBLIC API
export function executeQuery<T extends Record<string, unknown>>(
  data: T[],
  root: QueryGroup,
  schema: Schema,
  options: ExecuteOptions = {},
): ExecutionResult<T> {
  const { page = 1, pageSize = 20, sortField, sortDirection = "asc" } = options;

  const start = performance.now();

  // Filter
  const matched = data.filter((row) => matchNode(row, root, schema));

  // Sort
  if (sortField) {
    matched.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === bv) return 0;

      if (av == null || bv == null) return 0;

      if (typeof av === "number" && typeof bv === "number") {
        const gt = av > bv ? 1 : -1;
        return sortDirection === "asc" ? gt : -gt;
      }

      if (typeof av === "string" && typeof bv === "string") {
        const gt = av > bv ? 1 : -1;
        return sortDirection === "asc" ? gt : -gt;
      }

      if (av instanceof Date && bv instanceof Date) {
        const gt = av.getTime() > bv.getTime() ? 1 : -1;
        return sortDirection === "asc" ? gt : -gt;
      }

      const gt = String(av) > String(bv) ? 1 : -1;
      return sortDirection === "asc" ? gt : -gt;
    });
  }

  // Paginate
  const offset = (page - 1) * pageSize;
  const rows = matched.slice(offset, offset + pageSize);

  const end = performance.now();

  return {
    rows,
    total: data.length,
    matched: matched.length,
    executionTimeMs: Math.round((end - start) * 100) / 100,
  };
}
