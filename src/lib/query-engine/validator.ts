import type {
  FieldType,
  QueryGroup,
  QueryRule,
  Schema,
  ValidationError,
  ValidationResult,
} from "./types";
import { OPERATOR_DEFINITIONS, OPERATORS_BY_TYPE } from "./types";

function getFieldType(schema: Schema, fieldName: string): FieldType | null {
  const field = schema.fields.find((f) => f.name === fieldName);
  return field?.type ?? null;
}

function isValidDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function isValidNumber(value: string): boolean {
  return value !== "" && !Number.isNaN(Number(value));
}

function isValidRegex(value: string): boolean {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

// rule validation
function validateRule(rule: QueryRule, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Field must be selected
  if (!rule.field) {
    errors.push({ nodeId: rule.id, message: "Select a field" });
    return errors; // no point continuing without a field
  }

  const fieldType = getFieldType(schema, rule.field);
  if (!fieldType) {
    errors.push({ nodeId: rule.id, message: `Unknown field: "${rule.field}"` });
    return errors;
  }

  // Operator must be valid for this field type
  const allowedOperators = OPERATORS_BY_TYPE[fieldType];
  if (!allowedOperators.includes(rule.operator)) {
    errors.push({
      nodeId: rule.id,
      message: `Operator "${rule.operator}" is not valid for ${fieldType} fields`,
    });
    return errors;
  }

  const opDef = OPERATOR_DEFINITIONS[rule.operator];

  if (opDef.arity === 0) return errors;

  if (opDef.arity === 1) {
    if (rule.value === undefined || rule.value === "") {
      errors.push({ nodeId: rule.id, message: "Value is required" });
      return errors;
    }

    if (fieldType === "number") {
      if (!isValidNumber(rule.value)) {
        errors.push({ nodeId: rule.id, message: "Value must be a number" });
      }
    }

    if (
      fieldType === "date" ||
      ["before", "after", "on_date"].includes(rule.operator)
    ) {
      if (!isValidDate(rule.value)) {
        errors.push({ nodeId: rule.id, message: "Value must be a valid date" });
      }
    }

    if (rule.operator === "regex") {
      if (!isValidRegex(rule.value)) {
        errors.push({
          nodeId: rule.id,
          message: "Value must be a valid regular expression",
        });
      }
    }

    if (rule.operator === "in_array" || rule.operator === "not_in_array") {
      const parts = rule.value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        errors.push({
          nodeId: rule.id,
          message: "Provide at least one value (comma-separated)",
        });
      }
    }
  }

  if (opDef.arity === 2) {
    if (!rule.value || rule.value === "") {
      errors.push({ nodeId: rule.id, message: "From value is required" });
    }
    if (!rule.valueTo || rule.valueTo === "") {
      errors.push({ nodeId: rule.id, message: "To value is required" });
    }

    if (rule.value && rule.valueTo) {
      if (fieldType === "number") {
        if (!isValidNumber(rule.value) || !isValidNumber(rule.valueTo)) {
          errors.push({
            nodeId: rule.id,
            message: "Both values must be numbers",
          });
        } else if (Number(rule.value) >= Number(rule.valueTo)) {
          errors.push({
            nodeId: rule.id,
            message: "From value must be less than To value",
          });
        }
      }
      if (fieldType === "date") {
        if (!isValidDate(rule.value) || !isValidDate(rule.valueTo)) {
          errors.push({
            nodeId: rule.id,
            message: "Both values must be valid dates",
          });
        } else if (new Date(rule.value) >= new Date(rule.valueTo)) {
          errors.push({
            nodeId: rule.id,
            message: "From date must be before To date",
          });
        }
      }
    }
  }

  return errors;
}

// GROUP VALIDATION
function validateGroup(group: QueryGroup, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  if (group.children.length === 0) {
    errors.push({
      nodeId: group.id,
      message: "Group must have at least one condition",
    });
    return errors;
  }

  for (const child of group.children) {
    if (child.kind === "rule") {
      errors.push(...validateRule(child, schema));
    } else {
      errors.push(...validateGroup(child, schema));
    }
  }

  return errors;
}

// exported funs

export function validateQuery(
  root: QueryGroup,
  schema: Schema,
): ValidationResult {
  const errors = validateGroup(root, schema);
  return { valid: errors.length === 0, errors };
}

export function getNodeError(
  errors: ValidationError[],
  nodeId: string,
): string | null {
  return errors.find((e) => e.nodeId === nodeId)?.message ?? null;
}

export function nodeHasError(
  errors: ValidationError[],
  nodeId: string,
): boolean {
  return errors.some((e) => e.nodeId === nodeId);
}
