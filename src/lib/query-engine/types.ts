// FIELD TYPES
export type FieldType = "string" | "number" | "boolean" | "date" | "enum";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  enumValues?: string[];
  label?: string;
}

export interface Schema {
  name: string;
  fields: FieldDefinition[];
}

// OPERATORS
export type Operator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "in_array"
  | "not_in_array"
  | "between"
  | "is_null"
  | "is_not_null"
  | "regex"
  | "before"
  | "after"
  | "on_date";

export interface OperatorDefinition {
  value: Operator;
  label: string;
  /** How many value inputs this operator needs: 0 = none, 1 = single, 2 = range */
  arity: 0 | 1 | 2;
}

/** Which operators are valid for each field type */
export const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  string: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "in_array",
    "not_in_array",
    "is_null",
    "is_not_null",
    "regex",
  ],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "between",
    "in_array",
    "not_in_array",
    "is_null",
    "is_not_null",
  ],
  boolean: ["equals", "is_null", "is_not_null"],
  date: [
    "equals",
    "not_equals",
    "before",
    "after",
    "on_date",
    "between",
    "is_null",
    "is_not_null",
  ],
  enum: [
    "equals",
    "not_equals",
    "in_array",
    "not_in_array",
    "is_null",
    "is_not_null",
  ],
};

export const OPERATOR_DEFINITIONS: Record<Operator, OperatorDefinition> = {
  equals: { value: "equals", label: "equals", arity: 1 },
  not_equals: { value: "not_equals", label: "does not equal", arity: 1 },
  contains: { value: "contains", label: "contains", arity: 1 },
  not_contains: { value: "not_contains", label: "does not contain", arity: 1 },
  starts_with: { value: "starts_with", label: "starts with", arity: 1 },
  ends_with: { value: "ends_with", label: "ends with", arity: 1 },
  greater_than: { value: "greater_than", label: "greater than", arity: 1 },
  less_than: { value: "less_than", label: "less than", arity: 1 },
  greater_than_or_equal: {
    value: "greater_than_or_equal",
    label: "≥",
    arity: 1,
  },
  less_than_or_equal: { value: "less_than_or_equal", label: "≤", arity: 1 },
  in_array: { value: "in_array", label: "is one of", arity: 1 },
  not_in_array: { value: "not_in_array", label: "is not one of", arity: 1 },
  between: { value: "between", label: "is between", arity: 2 },
  is_null: { value: "is_null", label: "is empty", arity: 0 },
  is_not_null: { value: "is_not_null", label: "is not empty", arity: 0 },
  regex: { value: "regex", label: "matches regex", arity: 1 },
  before: { value: "before", label: "is before", arity: 1 },
  after: { value: "after", label: "is after", arity: 1 },
  on_date: { value: "on_date", label: "is on", arity: 1 },
};

export type LogicOperator = "AND" | "OR";

export interface QueryRule {
  id: string;
  kind: "rule";
  connector?: LogicOperator;
  field: string;
  operator: Operator;
  /** Single value for arity=1, undefined for arity=0 */
  value?: string;
  /** Second value for arity=2 (between) */
  valueTo?: string;
}

export interface QueryGroup {
  id: string;
  kind: "group";
  connector?: LogicOperator;
  logic: LogicOperator;
  children: QueryNode[];
  collapsed?: boolean;
}

export type QueryNode = QueryRule | QueryGroup;

export interface QueryState {
  root: QueryGroup;
  schemaName: string;
}

export type PreviewFormat = "sql" | "mongodb" | "graphql";

export interface ValidationError {
  nodeId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ExecutionResult<T = Record<string, unknown>> {
  rows: T[];
  total: number;
  matched: number;
  executionTimeMs: number;
}

export interface QuerySnapshot {
  id: string;
  name?: string;
  schemaName: string;
  root: QueryGroup;
  createdAt: string;
  isPreset?: boolean;
}

export interface ExecuteOptions {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}
