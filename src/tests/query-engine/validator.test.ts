import { describe, expect, it } from "vitest";
import { createGroup, createRule } from "@/lib/query-engine/tree";
import type { QueryGroup, QueryRule } from "@/lib/query-engine/types";
import {
  getNodeError,
  nodeHasError,
  validateQuery,
} from "@/lib/query-engine/validator";
import { USERS_SCHEMA } from "@/lib/schemas";

const makeRoot = (...children: (QueryGroup | QueryRule)[]): QueryGroup => ({
  ...createGroup("AND"),
  children,
});

describe("validateQuery — empty group", () => {
  it("fails when root has no children", () => {
    const root = createGroup("AND");
    const result = validateQuery(root, USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].nodeId).toBe(root.id);
  });
});

describe("validateQuery — field validation", () => {
  it("fails when field is empty", () => {
    const rule: QueryRule = {
      ...createRule(""),
      operator: "equals",
      value: "x",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].nodeId).toBe(rule.id);
    expect(result.errors[0].message).toMatch(/select a field/i);
  });

  it("fails for unknown field", () => {
    const rule: QueryRule = {
      ...createRule("unknownField"),
      operator: "equals",
      value: "x",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/unknown field/i);
  });
});

describe("validateQuery — operator compatibility", () => {
  it("fails when using contains on a number field", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "contains",
      value: "5",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/not valid for number/i);
  });

  it("fails when using regex on a number field", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "regex",
      value: "\\d+",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
  });

  it("fails when using contains on a date field", () => {
    const rule: QueryRule = {
      ...createRule("createdAt"),
      operator: "contains",
      value: "2024",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
  });

  it("allows equals on enum field", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "equals",
      value: "active",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });
});

describe("validateQuery — value validation", () => {
  it("fails when value is empty for equals", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/value is required/i);
  });

  it("fails when number field has non-numeric value", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "equals",
      value: "abc",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/must be a number/i);
  });

  it("fails when date field has invalid date value", () => {
    const rule: QueryRule = {
      ...createRule("createdAt"),
      operator: "before",
      value: "not-a-date",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/valid date/i);
  });

  it("fails when regex value is invalid", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "regex",
      value: "[invalid",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/valid regular expression/i);
  });

  it("accepts valid regex", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "regex",
      value: "^[A-Z]",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });

  it("fails when in_array has empty value", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "in_array",
      value: "  ,  ",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/at least one value/i);
  });

  it("passes when in_array has valid comma-separated values", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "in_array",
      value: "Nigeria, Ghana",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });
});

describe("validateQuery — between operator", () => {
  it("fails when both values missing", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "between",
      value: "",
      valueTo: "",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it("fails when from >= to for numbers", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "between",
      value: "50",
      valueTo: "20",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/less than/i);
  });

  it("passes with valid number range", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "between",
      value: "18",
      valueTo: "65",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });

  it("fails when date range is invalid", () => {
    const rule: QueryRule = {
      ...createRule("createdAt"),
      operator: "between",
      value: "2024-12-01",
      valueTo: "2024-01-01",
    };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/before/i);
  });
});

describe("validateQuery — null operators", () => {
  it("passes is_null with no value", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_null" };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });

  it("passes is_not_null with no value", () => {
    const rule: QueryRule = { ...createRule("email"), operator: "is_not_null" };
    const result = validateQuery(makeRoot(rule), USERS_SCHEMA);
    expect(result.valid).toBe(true);
  });
});

describe("validateQuery — nested groups", () => {
  it("fails when a nested group is empty", () => {
    const inner = createGroup("OR");
    const root = makeRoot(inner);
    const result = validateQuery(root, USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].nodeId).toBe(inner.id);
  });

  it("validates all rules across nested groups", () => {
    const validRule: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "Ada",
    };
    const invalidRule: QueryRule = {
      ...createRule("age"),
      operator: "equals",
      value: "abc",
    };
    const inner: QueryGroup = { ...createGroup("OR"), children: [invalidRule] };
    const root = makeRoot(validRule, inner);
    const result = validateQuery(root, USERS_SCHEMA);
    expect(result.valid).toBe(false);
    expect(result.errors[0].nodeId).toBe(invalidRule.id);
  });

  it("passes a fully valid nested tree", () => {
    const r1: QueryRule = {
      ...createRule("name"),
      operator: "contains",
      value: "Ada",
    };
    const r2: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const r3: QueryRule = {
      ...createRule("status"),
      operator: "equals",
      value: "active",
    };
    const inner: QueryGroup = { ...createGroup("OR"), children: [r2, r3] };
    const root = makeRoot(r1, inner);
    const result = validateQuery(root, USERS_SCHEMA);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("getNodeError", () => {
  it("returns the message for a matching node", () => {
    const errors = [{ nodeId: "abc", message: "Value is required" }];
    expect(getNodeError(errors, "abc")).toBe("Value is required");
  });

  it("returns null when node has no error", () => {
    expect(getNodeError([], "abc")).toBeNull();
  });
});

describe("nodeHasError", () => {
  it("returns true when node has an error", () => {
    const errors = [{ nodeId: "abc", message: "oops" }];
    expect(nodeHasError(errors, "abc")).toBe(true);
  });

  it("returns false when node is clean", () => {
    expect(nodeHasError([], "abc")).toBe(false);
  });
});
