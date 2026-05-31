import { describe, expect, it } from "vitest";
import { generateQuery } from "@/lib/query-engine/generator";
import { generateGraphQL } from "@/lib/query-engine/generator/graphql";
import { generateMongoDB } from "@/lib/query-engine/generator/mongo";
import { generateSQL } from "@/lib/query-engine/generator/sql";
import { createGroup, createRule } from "@/lib/query-engine/tree";
import type { QueryGroup, QueryRule } from "@/lib/query-engine/types";
import { USERS_SCHEMA } from "@/lib/schemas";

const makeRoot = (...children: (QueryGroup | QueryRule)[]): QueryGroup => ({
  ...createGroup("AND"),
  children,
});

// SQL
describe("generateSQL", () => {
  it("returns base SELECT for empty group", () => {
    const sql = generateSQL(createGroup("AND"), USERS_SCHEMA);
    expect(sql).toBe("SELECT * FROM users");
  });

  it("generates equals", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("country = 'Nigeria'");
  });

  it("generates greater_than for number", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("age > 18");
  });

  it("generates LIKE for contains", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "contains",
      value: "Ada",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("LIKE '%Ada%'");
  });

  it("generates LIKE for starts_with", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "starts_with",
      value: "A",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("LIKE 'A%'");
  });

  it("generates LIKE for ends_with", () => {
    const rule: QueryRule = {
      ...createRule("email"),
      operator: "ends_with",
      value: ".com",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("LIKE '%.com'");
  });

  it("generates IN for in_array", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "in_array",
      value: "active,pending",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("IN ('active', 'pending')");
  });

  it("generates BETWEEN", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "between",
      value: "18",
      valueTo: "65",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("BETWEEN 18 AND");
  });

  it("generates IS NULL", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_null" };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("IS NULL");
  });

  it("generates IS NOT NULL", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_not_null" };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("IS NOT NULL");
  });

  it("joins multiple rules with AND", () => {
    const r1: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const r2: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const sql = generateSQL(makeRoot(r1, r2), USERS_SCHEMA);
    expect(sql).toContain("AND");
    expect(sql).toContain("country = 'Nigeria'");
    expect(sql).toContain("age > 18");
  });

  it("wraps nested OR group in parentheses", () => {
    const r1: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "Ada",
    };
    const inner: QueryGroup = {
      ...createGroup("OR"),
      children: [
        { ...createRule("age"), operator: "equals", value: "25" } as QueryRule,
        { ...createRule("age"), operator: "equals", value: "30" } as QueryRule,
      ],
    };
    const sql = generateSQL(makeRoot(r1, inner), USERS_SCHEMA);
    expect(sql).toContain("(");
    expect(sql).toContain("OR");
  });

  it("escapes single quotes in string values", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "O'Brien",
    };
    const sql = generateSQL(makeRoot(rule), USERS_SCHEMA);
    expect(sql).toContain("O''Brien");
  });
});

// MONGODB
describe("generateMongoDB", () => {
  it("generates $eq for equals", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain('"$eq"');
    expect(out).toContain('"Nigeria"');
  });

  it("generates $gt for greater_than on number", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain('"$gt"');
    expect(out).toContain("18");
  });

  it("generates $regex for contains", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "contains",
      value: "Ada",
    };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain('"$regex"');
  });

  it("generates $in for in_array", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "in_array",
      value: "active,pending",
    };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain('"$in"');
  });

  it("generates $and for AND group", () => {
    const r1: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const r2: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const out = generateMongoDB(makeRoot(r1, r2), USERS_SCHEMA);
    expect(out).toContain('"$and"');
  });

  it("generates $or for OR group", () => {
    const r1: QueryRule = {
      ...createRule("status"),
      operator: "equals",
      value: "active",
    };
    const r2: QueryRule = {
      ...createRule("purchases"),
      operator: "greater_than",
      value: "10",
    };
    const group: QueryGroup = { ...createGroup("OR"), children: [r1, r2] };
    const root = makeRoot(group);
    const out = generateMongoDB(root, USERS_SCHEMA);
    expect(out).toContain('"$or"');
  });

  it("generates $eq null for is_null", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_null" };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("null");
  });

  it("wraps with db.collection.find()", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "x",
    };
    const out = generateMongoDB(makeRoot(rule), USERS_SCHEMA);
    expect(out).toMatch(/^db\.users\.find\(/);
  });
});

// GRAPHQL
describe("generateGraphQL", () => {
  it("generates eq for equals", () => {
    const rule: QueryRule = {
      ...createRule("country"),
      operator: "equals",
      value: "Nigeria",
    };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("eq:");
    expect(out).toContain('"Nigeria"');
  });

  it("generates gt for greater_than", () => {
    const rule: QueryRule = {
      ...createRule("age"),
      operator: "greater_than",
      value: "18",
    };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("gt:");
    expect(out).toContain("18");
  });

  it("generates contains for contains", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "contains",
      value: "Ada",
    };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("contains:");
  });

  it("generates in for in_array", () => {
    const rule: QueryRule = {
      ...createRule("status"),
      operator: "in_array",
      value: "active,pending",
    };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("in:");
  });

  it("generates isNull: true for is_null", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_null" };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("isNull: true");
  });

  it("generates isNull: false for is_not_null", () => {
    const rule: QueryRule = { ...createRule("name"), operator: "is_not_null" };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toContain("isNull: false");
  });

  it("wraps output in query { ... }", () => {
    const rule: QueryRule = {
      ...createRule("name"),
      operator: "equals",
      value: "x",
    };
    const out = generateGraphQL(makeRoot(rule), USERS_SCHEMA);
    expect(out).toMatch(/^query GetUsers/);
    expect(out).toContain("filter:");
  });
});

// unified generatequery
describe("generateQuery", () => {
  const rule: QueryRule = {
    ...createRule("name"),
    operator: "equals",
    value: "Ada",
  };
  const root = makeRoot(rule);

  it("delegates to SQL generator", () => {
    const out = generateQuery(root, USERS_SCHEMA, "sql");
    expect(out).toContain("SELECT");
  });

  it("delegates to MongoDB generator", () => {
    const out = generateQuery(root, USERS_SCHEMA, "mongodb");
    expect(out).toContain("db.users.find");
  });

  it("delegates to GraphQL generator", () => {
    const out = generateQuery(root, USERS_SCHEMA, "graphql");
    expect(out).toContain("query GetUsers");
  });
});
