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
  Schema,
  ValidationError,
} from "@/lib/query-engine/types";
import { getNodeError, nodeHasError } from "@/lib/query-engine/validator";
import { useQueryStore } from "@/store/query-store";
import { QueryRule } from "./query-rule";
import "./builder.css";

interface Props {
  group: QueryGroupType;
  schema: Schema;
  errors: ValidationError[];
  isRoot?: boolean;
  depth?: number;
}

export const QueryGroup = memo(function QueryGroup({
  group,
  schema,
  errors,
  isRoot = false,
  depth = 0,
}: Props) {
  const {
    addRule,
    addGroup,
    removeNode,
    updateGroupLogic,
    toggleGroupCollapsed,
  } = useQueryStore();

  const hasError = nodeHasError(errors, group.id);
  const groupError = getNodeError(errors, group.id);
  const isCollapsed = group.collapsed ?? false;

  const handleLogicToggle = useCallback(() => {
    const next: LogicOperator = group.logic === "AND" ? "OR" : "AND";
    updateGroupLogic(group.id, next);
  }, [group.id, group.logic, updateGroupLogic]);

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
        {/* Logic toggle */}
        <button
          type="button"
          className={`query-group__logic-btn query-group__logic-btn--${group.logic.toLowerCase()}`}
          onClick={handleLogicToggle}
          title="Click to toggle AND / OR"
        >
          {group.logic}
        </button>

        {/* Meta */}
        <span className="query-group__meta">
          {group.children.length} condition
          {group.children.length !== 1 ? "s" : ""}
          {depth > 0 && ` · depth ${depth}`}
        </span>

        {/* Actions */}
        <div className="query-group__actions">
          {/* Collapse toggle */}
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

          {/* Remove group (not root) */}
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

      {/* Body — collapsible */}
      {!isCollapsed && (
        <>
          <div className="query-group__body">
            <SortableContext
              items={childIds}
              strategy={verticalListSortingStrategy}
            >
              {group.children.map((child) => {
                if (child.kind === "rule") {
                  return (
                    <QueryRule
                      key={child.id}
                      rule={child}
                      schema={schema}
                      errors={errors}
                      groupId={group.id}
                    />
                  );
                }
                // Recursive group rendering
                return (
                  <QueryGroup
                    key={child.id}
                    group={child}
                    schema={schema}
                    errors={errors}
                    isRoot={false}
                    depth={depth + 1}
                  />
                );
              })}
            </SortableContext>

            {group.children.length === 0 && (
              <div
                className="builder-empty"
                style={{ padding: "20px", minHeight: "unset" }}
              >
                <span className="builder-empty__desc">
                  No conditions yet — add a rule or group below
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
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

      {/* Group-level error */}
      {groupError && <div className="query-group__error">{groupError}</div>}
    </div>
  );
});
