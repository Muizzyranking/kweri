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
import "./builder.css";

export function BuilderCanvas() {
  const root = useQueryStore((s) => s.root);
  const schemaName = useQueryStore((s) => s.schemaName);
  const moveNode = useQueryStore((s) => s.moveNode);

  const schema = useMemo(
    () => getSchemaByName(schemaName) ?? SCHEMAS[0],
    [schemaName],
  );

  const { errors } = useMemo(() => validateQuery(root, schema), [root, schema]);

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

      const findParentGroup = (_: string): string | null => {
        const walk = (g: typeof root): string | null => {
          for (let i = 0; i < g.children.length; i++) {
            const child = g.children[i];
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

      const targetGroupId = findParentGroup(String(over.id));
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

      <div className="builder-body">
        {/* Main canvas */}
        <main className="builder-main">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <QueryGroup
              group={root}
              schema={schema}
              errors={errors}
              isRoot
              depth={0}
            />
          </DndContext>

          {/* Validation summary */}
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
              <span>⚠</span>
              {errors.length} validation error{errors.length !== 1 ? "s" : ""} —
              fix them before running the query
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="builder-sidebar">
          <BuilderSidebar />
        </aside>
      </div>
    </div>
  );
}
