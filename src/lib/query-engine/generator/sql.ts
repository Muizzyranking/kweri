import type { QueryGroup, QueryRule, Schema } from "../types";
import { escapeString, formatValue } from "./utils";

function ruleToSQL(rule: QueryRule, schema: Schema): string {
  const { field, operator, value = "", valueTo = "" } = rule;
  const fv = formatValue(rule, schema);

  switch (operator) {
    case "equals":
      return `${field} = ${fv}`;
    case "not_equals":
      return `${field} != ${fv}`;
    case "contains":
      return `${field} LIKE '%${value}%'`;
    case "not_contains":
      return `${field} NOT LIKE '%${value}%'`;
    case "starts_with":
      return `${field} LIKE '${value}%'`;
    case "ends_with":
      return `${field} LIKE '%${value}'`;
    case "greater_than":
      return `${field} > ${fv}`;
    case "less_than":
      return `${field} < ${fv}`;
    case "greater_than_or_equal":
      return `${field} >= ${fv}`;
    case "less_than_or_equal":
      return `${field} <= ${fv}`;
    case "in_array": {
      const vals = value
        .split(",")
        .map((v) => `'${escapeString(v.trim())}'`)
        .join(", ");
      return `${field} IN (${vals})`;
    }
    case "not_in_array": {
      const vals = value
        .split(",")
        .map((v) => `'${escapeString(v.trim())}'`)
        .join(", ");
      return `${field} NOT IN (${vals})`;
    }
    case "between":
      return `${field} BETWEEN ${fv} AND '${valueTo}'`;
    case "is_null":
      return `${field} IS NULL`;
    case "is_not_null":
      return `${field} IS NOT NULL`;
    case "regex":
      return `${field} ~ '${escapeString(value)}'`;
    case "before":
      return `${field} < '${value}'`;
    case "after":
      return `${field} > '${value}'`;
    case "on_date":
      return `DATE(${field}) = '${value}'`;
    default:
      return `${field} = ${fv}`;
  }
}

function groupToSQL(group: QueryGroup, schema: Schema, depth = 0): string {
  if (group.children.length === 0) return "";

  const indent = "  ".repeat(depth + 1);
  const parts = group.children
    .map((child) => {
      if (child.kind === "rule") return indent + ruleToSQL(child, schema);
      const inner = groupToSQL(child, schema, depth + 1);
      return `${indent}(\n${inner}\n${indent})`;
    })
    .join(`\n${indent}${group.logic}\n`);

  return parts;
}

export function generateSQL(root: QueryGroup, schema: Schema): string {
  const tableName = schema.name;
  const where = groupToSQL(root, schema, 0);
  if (!where.trim()) return `SELECT * FROM ${tableName}`;
  return `SELECT *\nFROM ${tableName}\nWHERE\n${where}`;
}
