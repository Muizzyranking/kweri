import { describe, expect, it } from "vitest";
import { executeQuery } from "@/lib/query-engine/executor";
import { createGroup, createRule } from "@/lib/query-engine/tree";
import type { QueryGroup, QueryRule } from "@/lib/query-engine/types";
import { USERS_DATA, USERS_SCHEMA } from "./fixtures";

const makeRoot = (...children: (QueryGroup | QueryRule)[]): QueryGroup => ({
  ...createGroup("AND"),
  children,
});

describe("executeQuery — basic filtering", () => {
  it("returns all rows for empty group", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
    );
    expect(result.matched).toBe(USERS_DATA.length);
  });

  it("filters by equals on string field", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => r.country === "Nigeria")).toBe(true);
  });

  it("filters by greater_than on number", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "40",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => Number(r.age) > 40)).toBe(true);
  });

  it("filters by less_than on number", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "less_than",
      value: "25",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => Number(r.age) < 25)).toBe(true);
  });

  it("filters by contains on string", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "contains",
      value: "ada",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(
      result.rows.every((r) => String(r.name).toLowerCase().includes("ada")),
    ).toBe(true);
  });

  it("filters by starts_with", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "starts_with",
      value: "A",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(
      result.rows.every((r) => String(r.name).toLowerCase().startsWith("a")),
    ).toBe(true);
  });

  it("filters by ends_with", () => {
    const rule: QueryRule = {
      ...createRule("email"),
      operator: "ends_with",
      value: ".com",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => String(r.email).endsWith(".com"))).toBe(
      true,
    );
  });

  it("filters by not_equals", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "not_equals",
      value: "active",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => r.status !== "active")).toBe(true);
  });

  it("filters by in_array", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "in_array",
      value: "Nigeria,Ghana",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(
      result.rows.every((r) =>
        ["Nigeria", "Ghana"].includes(String(r.country)),
      ),
    ).toBe(true);
    expect(result.matched).toBeGreaterThan(0);
  });

  it("filters by not_in_array", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "not_in_array",
      value: "banned,inactive",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(
      result.rows.every(
        (r) => !["banned", "inactive"].includes(String(r.status)),
      ),
    ).toBe(true);
  });

  it("filters by between on number", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "between",
      value: "20",
      valueTo: "30",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(
      result.rows.every((r) => Number(r.age) >= 20 && Number(r.age) <= 30),
    ).toBe(true);
  });

  it("filters by regex", () => {
    const rule: QueryRule = {
      ...createRule("email"),
      operator: "regex",
      value: "@example",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.rows.every((r) => /@example/i.test(String(r.email)))).toBe(
      true,
    );
  });
});

describe("executeQuery — AND / OR logic", () => {
  it("applies AND logic — all conditions must match", () => {
    const r1: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const r2: QueryRule = {
      ...createRule("status"),
      operator: "equals",
      value: "active",
    };
    const root = makeRoot(r1, r2);
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      root,
      USERS_SCHEMA,
    );
    expect(
      result.rows.every(
        (r) => r.country === "Nigeria" && r.status === "active",
      ),
    ).toBe(true);
  });

  it("applies OR logic — at least one condition must match", () => {
    const r1: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const r2: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Ghana",
    };
    const root: QueryGroup = { ...createGroup("OR"), children: [r1, r2] };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      root,
      USERS_SCHEMA,
    );
    expect(
      result.rows.every(
        (r) => r.country === "Nigeria" || r.country === "Ghana",
      ),
    ).toBe(true);
    expect(result.matched).toBeGreaterThan(0);
  });

  it("handles nested AND inside OR", () => {
    const r1: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const r2: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "30",
    };
    const r3: QueryRule = {
      ...createRule("status"),
      operator: "equals",
      value: "active",
    };
    const andGroup: QueryGroup = { ...createGroup("AND"), children: [r2, r3] };
    const root: QueryGroup = { ...createGroup("OR"), children: [r1, andGroup] };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      root,
      USERS_SCHEMA,
    );
    expect(result.matched).toBeGreaterThanOrEqual(0);
    result.rows.forEach((r) => {
      const passesR1 = r.country === "Nigeria";
      const passesAnd = Number(r.age) > 30 && r.status === "active";
      expect(passesR1 || passesAnd).toBe(true);
    });
  });
});

describe("executeQuery — result metadata", () => {
  it("reports correct total count", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.total).toBe(USERS_DATA.length);
  });

  it("reports executionTimeMs as a non-negative number", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
    );
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe("executeQuery — pagination", () => {
  it("paginates results correctly", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { page: 1, pageSize: 10 },
    );
    expect(result.rows).toHaveLength(10);
  });

  it("returns correct second page", () => {
    const page1 = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { page: 1, pageSize: 5 },
    );
    const page2 = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { page: 2, pageSize: 5 },
    );
    expect(page1.rows[0].id).not.toBe(page2.rows[0].id);
  });

  it("returns empty array when page exceeds results", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { page: 999, pageSize: 20 },
    );
    expect(result.rows).toHaveLength(0);
  });
});

describe("executeQuery — sorting", () => {
  it("sorts ascending by field", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { sortField: "age", sortDirection: "asc" },
    );
    for (let i = 1; i < result.rows.length; i++) {
      expect(Number(result.rows[i].age)).toBeGreaterThanOrEqual(
        Number(result.rows[i - 1].age),
      );
    }
  });

  it("sorts descending by field", () => {
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      createGroup("AND"),
      USERS_SCHEMA,
      { sortField: "age", sortDirection: "desc" },
    );
    for (let i = 1; i < result.rows.length; i++) {
      expect(Number(result.rows[i].age)).toBeLessThanOrEqual(
        Number(result.rows[i - 1].age),
      );
    }
  });
});

describe("executeQuery — edge cases", () => {
  it("handles empty dataset gracefully", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const result = executeQuery([], makeRoot(rule), USERS_SCHEMA);
    expect(result.matched).toBe(0);
    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("returns zero matches for impossible query", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "equals",
      value: "9999",
    };
    const result = executeQuery(
      USERS_DATA as Record<string, unknown>[],
      makeRoot(rule),
      USERS_SCHEMA,
    );
    expect(result.matched).toBe(0);
  });

  it("handles invalid regex gracefully without throwing", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "regex",
      value: "[invalid",
    };
    expect(() =>
      executeQuery(
        USERS_DATA as Record<string, unknown>[],
        makeRoot(rule),
        USERS_SCHEMA,
      ),
    ).not.toThrow();
  });
});
