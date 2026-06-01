"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo } from "react";
import { findNode } from "@/lib/query-engine/tree";
import { validateQuery } from "@/lib/query-engine/validator";
import { getSchemaByName, SCHEMAS } from "@/lib/schemas";
import { useQueryStore } from "@/store/query-store";
import { BuilderSidebar } from "./builder-sidebar";
import { BuilderTopbar } from "./builder-topbar";
import { QueryGroup } from "./query-group";
import { ResultsPanel } from "./results-panel";
import "./builder.css";
import "./results.css";

export function BuilderCanvas() {
  const root = useQueryStore((s) => s.root);
  const schemaName = useQueryStore((s) => s.schemaName);
  const moveNode = useQueryStore((s) => s.moveNode);

  const schema = useMemo(
    () => getSchemaByName(schemaName) ?? SCHEMAS[0],
    [schemaName],
  );

  const { errors } = useMemo(() => validateQuery(root, schema), [root, schema]);

  const errorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of errors) map[e.nodeId] = e.message;
    return map;
  }, [errors]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const findParentGroupId = (): string | null => {
        const walk = (g: typeof root): string | null => {
          for (const child of g.children) {
            if (child.id === over.id) return g.id;
            if (child.kind === "group") {
              const found = walk(child);
              if (found) return found;
            }
          }
          return null;
        };
        return walk(root);
      };

      const targetGroupId = findParentGroupId();
      if (!targetGroupId) return;

      const targetGroup = findNode(root, targetGroupId);
      if (!targetGroup || targetGroup.kind !== "group") return;

      const targetIndex = targetGroup.children.findIndex(
        (c) => c.id === over.id,
      );
      moveNode(String(active.id), targetGroupId, targetIndex);
    },
    [root, moveNode],
  );

  return (
    <div className="builder-page">
      <BuilderTopbar />

      <div
        className="builder-body"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gridTemplateRows: "1fr 340px",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Main canvas — top left */}
        <main className="builder-main" style={{ gridColumn: 1, gridRow: 1 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <QueryGroup
              group={root}
              schema={schema}
              errorMap={errorMap}
              isRoot
              depth={0}
            />
          </DndContext>

          {errors.length > 0 && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(229,62,62,0.06)",
                border: "1px solid rgba(229,62,62,0.2)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--color-error)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>!</span>
              {errors.length} validation error{errors.length !== 1 ? "s" : ""} —
              fix them before running the query
            </div>
          )}
        </main>

        {/* Sidebar — right column, full height */}
        <aside
          className="builder-sidebar"
          style={{ gridColumn: 2, gridRow: "1 / 3" }}
        >
          <BuilderSidebar />
        </aside>

        {/* Results panel — bottom left */}
        <div className="builder-lower" style={{ gridColumn: 1, gridRow: 2 }}>
          <div className="builder-lower__header">
            <span className="builder-lower__title">Results</span>
          </div>
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
}
