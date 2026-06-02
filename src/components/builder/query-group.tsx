"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Plus,
  Trash2,
} from "lucide-react";
import { memo, useCallback } from "react";
import type {
  LogicOperator,
  QueryGroup as QueryGroupType,
  QueryNode,
  Schema,
} from "@/lib/query-engine/types";
import { useQueryStore } from "@/store/query-store";
import { QueryRule } from "./query-rule";
import "./builder.css";

interface Props {
  group: QueryGroupType;
  schema: Schema;
  errorMap: Record<string, string>;
  isRoot?: boolean;
  depth?: number;
}

export const QueryGroup = memo(function QueryGroup({
  group,
  schema,
  errorMap,
  isRoot = false,
  depth = 0,
}: Props) {
  const addRule = useQueryStore((s) => s.addRule);
  const addGroup = useQueryStore((s) => s.addGroup);
  const removeNode = useQueryStore((s) => s.removeNode);
  const updateNodeConnector = useQueryStore((s) => s.updateNodeConnector);
  const toggleGroupCollapsed = useQueryStore((s) => s.toggleGroupCollapsed);

  const hasError = Boolean(errorMap[group.id]);
  const groupError = errorMap[group.id] ?? null;
  const isCollapsed = group.collapsed ?? false;

  const handleConnectorToggle = useCallback(
    (node: QueryNode) => {
      const connector: LogicOperator =
        (node.connector ?? group.logic) === "AND" ? "OR" : "AND";
      updateNodeConnector(node.id, connector);
    },
    [group.logic, updateNodeConnector],
  );

  const childIds = group.children.map((c) => c.id);

  return (
    <div
      className={[
        "query-group",
        isRoot ? "query-group--root" : "",
        hasError ? "query-group--error" : "",
        depth > 0 ? "query-group__nested" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header */}
      <div className="query-group__header">
        <span className="query-group__meta">
          {group.children.length} condition
          {group.children.length !== 1 ? "s" : ""}
          {depth > 0 && ` · depth ${depth}`}
        </span>

        <div className="query-group__actions">
          <button
            type="button"
            className="query-group__collapse-btn"
            onClick={() => toggleGroupCollapsed(group.id)}
            aria-label={isCollapsed ? "Expand group" : "Collapse group"}
          >
            {isCollapsed ? (
              <ChevronRight size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>

          {!isRoot && (
            <button
              type="button"
              className="query-group__collapse-btn"
              onClick={() => removeNode(group.id)}
              aria-label="Remove group"
              style={{ color: "var(--color-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-muted)";
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <>
          <div className="query-group__body">
            <SortableContext
              items={childIds}
              strategy={verticalListSortingStrategy}
            >
              {group.children.map((child, index) => (
                <div key={child.id} className="query-node-row">
                  {index > 0 && (
                    <button
                      type="button"
                      className={`query-node-row__connector query-group__logic-btn query-group__logic-btn--${(child.connector ?? group.logic).toLowerCase()}`}
                      onClick={() => handleConnectorToggle(child)}
                      title="Toggle how this condition joins the previous node"
                    >
                      {child.connector ?? group.logic}
                    </button>
                  )}
                  {child.kind === "rule" ? (
                    <QueryRule
                      rule={child}
                      schema={schema}
                      errorMap={errorMap}
                      groupId={group.id}
                    />
                  ) : (
                    <QueryGroup
                      group={child}
                      schema={schema}
                      errorMap={errorMap}
                      isRoot={false}
                      depth={depth + 1}
                    />
                  )}
                </div>
              ))}
            </SortableContext>

            {group.children.length === 0 && (
              <div
                className="builder-empty"
                style={{ padding: "20px", minHeight: "unset" }}
              >
                <span className="builder-empty__desc">
                  No conditions yet — add one below
                </span>
              </div>
            )}
          </div>

          <div className="query-group__footer">
            <button
              type="button"
              className="query-group__add-btn"
              onClick={() => addRule(group.id)}
            >
              <Plus size={12} />
              Add condition
            </button>

            {depth < 4 && (
              <button
                type="button"
                className="query-group__add-btn query-group__add-btn--group"
                onClick={() => addGroup(group.id)}
              >
                <FolderPlus size={12} />
                Add group
              </button>
            )}
          </div>
        </>
      )}

      {groupError && <div className="query-group__error">{groupError}</div>}
    </div>
  );
});
