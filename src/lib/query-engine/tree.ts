import { v4 as uuidv4 } from "uuid";
import type {
  LogicOperator,
  Operator,
  QueryGroup,
  QueryNode,
  QueryRule,
} from "./types";

// FACTORIES
export function createRule(
  field: string,
  operator: Operator = "equals",
): QueryRule {
  return { id: uuidv4(), kind: "rule", field, operator, value: "" };
}

export function createGroup(logic: LogicOperator = "AND"): QueryGroup {
  return { id: uuidv4(), kind: "group", logic, children: [] };
}

export function createRootGroup(): QueryGroup {
  const group = createGroup("AND");
  group.children = [createRule("", "equals")];
  return group;
}

// IMMUTABLE TREE MUTATIONS
export function cloneNode<T extends QueryNode>(node: T): T {
  return JSON.parse(JSON.stringify(node));
}

/**
 * Walk the tree and apply `updater` to the node with the given id.
 * Returns a new root; original is untouched.
 */
export function updateNode(
  root: QueryGroup,
  id: string,
  updater: (node: QueryNode) => QueryNode,
): QueryGroup {
  if (root.id === id) {
    return updater(root) as QueryGroup;
  }
  return {
    ...root,
    children: root.children.map((child) => {
      if (child.id === id) return updater(child);
      if (child.kind === "group") return updateNode(child, id, updater);
      return child;
    }),
  };
}

export function removeNode(root: QueryGroup, id: string): QueryGroup {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => (child.kind === "group" ? removeNode(child, id) : child)),
  };
}

export function addChildToGroup(
  root: QueryGroup,
  groupId: string,
  child: QueryNode,
): QueryGroup {
  return updateNode(root, groupId, (node) => {
    if (node.kind !== "group") return node;
    return { ...node, children: [...node.children, child] };
  }) as QueryGroup;
}

// drag and drop suport
export function moveNode(
  root: QueryGroup,
  nodeId: string,
  targetGroupId: string,
  targetIndex: number,
): QueryGroup {
  let moved: QueryNode | null = null;
  const findAndRemove = (group: QueryGroup): QueryGroup => ({
    ...group,
    children: group.children
      .filter((c) => {
        if (c.id === nodeId) {
          moved = c;
          return false;
        }
        return true;
      })
      .map((c) => (c.kind === "group" ? findAndRemove(c) : c)),
  });

  const withoutNode = findAndRemove(root);
  if (!moved) return root;
  const toInsert = moved;

  // insert at target pos
  const insert = (group: QueryGroup): QueryGroup => {
    if (group.id === targetGroupId) {
      const children = [...group.children];
      const clampedIndex = Math.min(Math.max(0, targetIndex), children.length);
      children.splice(clampedIndex, 0, toInsert);
      return { ...group, children };
    }
    return {
      ...group,
      children: group.children.map((c) => (c.kind === "group" ? insert(c) : c)),
    };
  };

  return insert(withoutNode);
}

// traverse

// Collect all node ids in the tree (depth-first)
export function collectIds(root: QueryGroup): string[] {
  const ids: string[] = [root.id];
  for (const child of root.children) {
    if (child.kind === "group") ids.push(...collectIds(child));
    else ids.push(child.id);
  }
  return ids;
}

//  Find a node by id anywhere in the tree
export function findNode(root: QueryGroup, id: string): QueryNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    if (child.id === id) return child;
    if (child.kind === "group") {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Count total rules (leaf nodes) in tree
export function countRules(root: QueryGroup): number {
  let count = 0;
  for (const child of root.children) {
    if (child.kind === "rule") count++;
    else count += countRules(child);
  }
  return count;
}

// Get nesting depth of the tree
export function getDepth(node: QueryGroup): number {
  if (node.children.length === 0) return 1;
  const childDepths = node.children.map((c) =>
    c.kind === "group" ? getDepth(c) : 0,
  );
  return 1 + Math.max(...childDepths);
}
