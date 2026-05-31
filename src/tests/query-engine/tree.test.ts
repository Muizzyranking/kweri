import { describe, expect, it } from "vitest";
import {
  addChildToGroup,
  collectIds,
  countRules,
  createGroup,
  createRootGroup,
  createRule,
  findNode,
  getDepth,
  moveNode,
  removeNode,
  updateNode,
} from "@/lib/query-engine/tree";
import type { QueryGroup, QueryRule } from "@/lib/query-engine/types";

describe("createRule", () => {
  it("creates a rule with the given field and operator", () => {
    const rule = createRule("age", "greater_than");
    expect(rule.kind).toBe("rule");
    expect(rule.field).toBe("age");
    expect(rule.operator).toBe("greater_than");
    expect(rule.id).toBeTruthy();
  });

  it("defaults operator to equals", () => {
    const rule = createRule("name");
    expect(rule.operator).toBe("equals");
  });

  it("generates unique ids", () => {
    const a = createRule("x");
    const b = createRule("x");
    expect(a.id).not.toBe(b.id);
  });
});

describe("createGroup", () => {
  it("creates a group with the given logic", () => {
    const group = createGroup("OR");
    expect(group.kind).toBe("group");
    expect(group.logic).toBe("OR");
    expect(group.children).toEqual([]);
  });

  it("defaults logic to AND", () => {
    const group = createGroup();
    expect(group.logic).toBe("AND");
  });
});

describe("createRootGroup", () => {
  it("creates an AND group with one empty rule", () => {
    const root = createRootGroup();
    expect(root.logic).toBe("AND");
    expect(root.children).toHaveLength(1);
    expect(root.children[0].kind).toBe("rule");
  });
});

describe("updateNode", () => {
  it("updates the root node itself", () => {
    const root = createGroup("AND");
    const updated = updateNode(
      root,
      root.id,
      (n) =>
        ({
          ...n,
          logic: "OR",
        }) as QueryGroup,
    );
    expect((updated as QueryGroup).logic).toBe("OR");
  });

  it("updates a direct child rule", () => {
    const rule = createRule("name");
    const root: QueryGroup = { ...createGroup(), children: [rule] };
    const updated = updateNode(root, rule.id, (n) => ({
      ...(n as QueryRule),
      field: "email",
    }));
    expect((updated.children[0] as QueryRule).field).toBe("email");
  });

  it("updates a deeply nested rule", () => {
    const rule = createRule("age");
    const inner: QueryGroup = { ...createGroup("OR"), children: [rule] };
    const root: QueryGroup = { ...createGroup("AND"), children: [inner] };

    const updated = updateNode(root, rule.id, (n) => ({
      ...(n as QueryRule),
      value: "25",
    }));

    const updatedRule = (updated.children[0] as QueryGroup)
      .children[0] as QueryRule;
    expect(updatedRule.value).toBe("25");
  });

  it("does not mutate the original tree", () => {
    const rule = createRule("name");
    const root: QueryGroup = { ...createGroup(), children: [rule] };
    updateNode(root, rule.id, (n) => ({ ...(n as QueryRule), field: "email" }));
    expect((root.children[0] as QueryRule).field).toBe("name");
  });
});

describe("removeNode", () => {
  it("removes a direct child", () => {
    const rule = createRule("name");
    const root: QueryGroup = { ...createGroup(), children: [rule] };
    const updated = removeNode(root, rule.id);
    expect(updated.children).toHaveLength(0);
  });

  it("removes a nested child", () => {
    const rule = createRule("age");
    const inner: QueryGroup = { ...createGroup("OR"), children: [rule] };
    const root: QueryGroup = { ...createGroup("AND"), children: [inner] };
    const updated = removeNode(root, rule.id);
    expect((updated.children[0] as QueryGroup).children).toHaveLength(0);
  });

  it("does nothing if id not found", () => {
    const rule = createRule("name");
    const root: QueryGroup = { ...createGroup(), children: [rule] };
    const updated = removeNode(root, "nonexistent-id");
    expect(updated.children).toHaveLength(1);
  });
});

describe("addChildToGroup", () => {
  it("adds a rule to the target group", () => {
    const root = createGroup("AND");
    const newRule = createRule("email");
    const updated = addChildToGroup(root, root.id, newRule);
    expect(updated.children).toHaveLength(1);
    expect(updated.children[0].id).toBe(newRule.id);
  });

  it("appends to existing children", () => {
    const existing = createRule("name");
    const root: QueryGroup = { ...createGroup(), children: [existing] };
    const newRule = createRule("age");
    const updated = addChildToGroup(root, root.id, newRule);
    expect(updated.children).toHaveLength(2);
    expect(updated.children[1].id).toBe(newRule.id);
  });
});

describe("moveNode", () => {
  it("moves a rule from one group to another", () => {
    const rule = createRule("name");
    const groupA: QueryGroup = { ...createGroup("AND"), children: [rule] };
    const groupB: QueryGroup = { ...createGroup("OR"), children: [] };
    const root: QueryGroup = {
      ...createGroup("AND"),
      children: [groupA, groupB],
    };

    const updated = moveNode(root, rule.id, groupB.id, 0);
    const updatedA = updated.children[0] as QueryGroup;
    const updatedB = updated.children[1] as QueryGroup;

    expect(updatedA.children).toHaveLength(0);
    expect(updatedB.children).toHaveLength(1);
    expect(updatedB.children[0].id).toBe(rule.id);
  });
});

describe("collectIds", () => {
  it("collects all ids including nested", () => {
    const rule = createRule("name");
    const inner: QueryGroup = { ...createGroup(), children: [rule] };
    const root: QueryGroup = { ...createGroup(), children: [inner] };
    const ids = collectIds(root);
    expect(ids).toContain(root.id);
    expect(ids).toContain(inner.id);
    expect(ids).toContain(rule.id);
    expect(ids).toHaveLength(3);
  });
});

describe("findNode", () => {
  it("finds the root", () => {
    const root = createGroup();
    expect(findNode(root, root.id)).toBe(root);
  });

  it("finds a nested rule", () => {
    const rule = createRule("age");
    const inner: QueryGroup = { ...createGroup(), children: [rule] };
    const root: QueryGroup = { ...createGroup(), children: [inner] };
    expect(findNode(root, rule.id)).toEqual(rule);
  });

  it("returns null for missing id", () => {
    const root = createGroup();
    expect(findNode(root, "ghost")).toBeNull();
  });
});

describe("countRules", () => {
  it("counts zero for empty group", () => {
    expect(countRules(createGroup())).toBe(0);
  });

  it("counts direct rules", () => {
    const root: QueryGroup = {
      ...createGroup(),
      children: [createRule("a"), createRule("b")],
    };
    expect(countRules(root)).toBe(2);
  });

  it("counts nested rules", () => {
    const inner: QueryGroup = {
      ...createGroup(),
      children: [createRule("x"), createRule("y")],
    };
    const root: QueryGroup = {
      ...createGroup(),
      children: [createRule("a"), inner],
    };
    expect(countRules(root)).toBe(3);
  });
});

describe("getDepth", () => {
  it("returns 1 for empty group", () => {
    expect(getDepth(createGroup())).toBe(1);
  });

  it("returns 1 for flat rules only", () => {
    const root: QueryGroup = { ...createGroup(), children: [createRule("a")] };
    expect(getDepth(root)).toBe(1);
  });

  it("returns correct depth for nested groups", () => {
    const inner: QueryGroup = { ...createGroup(), children: [createRule("x")] };
    const root: QueryGroup = { ...createGroup(), children: [inner] };
    expect(getDepth(root)).toBe(2);
  });
});
