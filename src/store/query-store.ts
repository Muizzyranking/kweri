import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { generateQuery } from "@/lib/query-engine/generator";
import {
  addChildToGroup,
  createGroup,
  createRule,
  moveNode,
  removeNode,
  updateNode,
} from "@/lib/query-engine/tree";
import type {
  LogicOperator,
  PreviewFormat,
  QueryGroup,
  QueryRule,
  QuerySnapshot,
  Schema,
} from "@/lib/query-engine/types";
import { validateQuery } from "@/lib/query-engine/validator";
import { getSchemaByName, SCHEMAS } from "@/lib/schemas";

export interface QueryStore {
  root: QueryGroup;
  schemaName: string;
  previewFormat: PreviewFormat;

  customSchemas: Schema[];

  history: QuerySnapshot[];
  presets: QuerySnapshot[];

  selectedNodeId: string | null;

  // schemas
  setSchema: (name: string) => void;
  getSchema: () => Schema;
  uploadSchema: (json: string) => { success: boolean; error?: string };
  deleteCustomSchema: (name: string) => void;
  getAllSchemas: () => Schema[];

  addRule: (groupId: string) => void;
  addGroup: (groupId: string, logic?: LogicOperator) => void;
  removeNode: (id: string) => void;
  updateRule: (
    id: string,
    patch: Partial<Omit<QueryRule, "id" | "kind">>,
  ) => void;
  updateGroupLogic: (id: string, logic: LogicOperator) => void;
  toggleGroupCollapsed: (id: string) => void;
  moveNode: (
    nodeId: string,
    targetGroupId: string,
    targetIndex: number,
  ) => void;

  setPreviewFormat: (format: PreviewFormat) => void;
  getPreviewQuery: () => string;

  getValidation: () => ReturnType<typeof validateQuery>;

  pushHistory: (name?: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteHistory: (id: string) => void;

  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  exportJSON: () => string;
  importJSON: (json: string) => { success: boolean; error?: string };

  resetQuery: () => void;

  setSelectedNode: (id: string | null) => void;
}

// INITIAL STATE

const DEFAULT_SCHEMA = SCHEMAS[0].name; // "users"

function makeInitialRoot(schemaName?: string): QueryGroup {
  const schema = getSchemaByName(schemaName ?? DEFAULT_SCHEMA) ?? SCHEMAS[0];
  const firstField = schema.fields[0]?.name ?? "";
  const group = createGroup("AND");
  group.children = [createRule(firstField, "equals")];
  return group;
}

// store

export const useQueryStore = create<QueryStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        root: makeInitialRoot(),
        schemaName: DEFAULT_SCHEMA,
        previewFormat: "sql",
        history: [],
        presets: getDefaultPresets(),
        customSchemas: [],
        selectedNodeId: null,

        setSchema(name) {
          set({ schemaName: name, root: makeInitialRoot(name) });
        },
        getSchema() {
          const { schemaName, customSchemas } = get();
          return (
            customSchemas.find((s) => s.name === schemaName) ??
            getSchemaByName(schemaName) ??
            SCHEMAS[0]
          );
        },
        getAllSchemas() {
          return [...SCHEMAS, ...get().customSchemas];
        },
        uploadSchema(json) {
          try {
            const parsed = JSON.parse(json);
            if (!parsed.name || typeof parsed.name !== "string") {
              return {
                success: false,
                error: 'Schema must have a "name" field',
              };
            }
            if (!Array.isArray(parsed.fields) || parsed.fields.length === 0) {
              return {
                success: false,
                error: 'Schema must have a non-empty "fields" array',
              };
            }
            const validTypes = ["string", "number", "boolean", "date", "enum"];
            for (const f of parsed.fields) {
              if (!f.name || !f.type) {
                return {
                  success: false,
                  error: `Each field must have "name" and "type"`,
                };
              }
              if (!validTypes.includes(f.type)) {
                return {
                  success: false,
                  error: `Invalid field type: "${f.type}". Must be one of: ${validTypes.join(", ")}`,
                };
              }
            }
            const schema: Schema = { name: parsed.name, fields: parsed.fields };
            set((s) => ({
              customSchemas: [
                ...s.customSchemas.filter((c) => c.name !== schema.name),
                schema,
              ],
              schemaName: schema.name,
              root: makeInitialRoot(schema.name),
            }));
            return { success: true };
          } catch {
            return { success: false, error: "Invalid JSON" };
          }
        },
        deleteCustomSchema(name) {
          set((s) => ({
            customSchemas: s.customSchemas.filter((c) => c.name !== name),
            schemaName: s.schemaName === name ? SCHEMAS[0].name : s.schemaName,
            root:
              s.schemaName === name ? makeInitialRoot(SCHEMAS[0].name) : s.root,
          }));
        },

        addRule(groupId) {
          const schema = get().getSchema();
          const firstField = schema.fields[0]?.name ?? "";
          const rule = createRule(firstField, "equals");
          set((s) => ({ root: addChildToGroup(s.root, groupId, rule) }));
        },

        addGroup(groupId, logic = "AND") {
          const schema = get().getSchema();
          const firstField = schema.fields[0]?.name ?? "";
          const group = createGroup(logic);
          group.children = [createRule(firstField, "equals")];
          set((s) => ({ root: addChildToGroup(s.root, groupId, group) }));
        },

        removeNode(id) {
          set((s) => ({ root: removeNode(s.root, id) }));
        },

        updateRule(id, patch) {
          set((s) => ({
            root: updateNode(s.root, id, (node) => {
              if (node.kind !== "rule") return node;
              const updated = { ...node, ...patch } as QueryRule;
              // Reset value when operator changes arity
              if (patch.operator && patch.operator !== node.operator) {
                updated.value = "";
                updated.valueTo = "";
              }
              return updated;
            }),
          }));
        },

        updateGroupLogic(id, logic) {
          set((s) => ({
            root: updateNode(s.root, id, (node) => {
              if (node.kind !== "group") return node;
              return { ...node, logic };
            }),
          }));
        },

        toggleGroupCollapsed(id) {
          set((s) => ({
            root: updateNode(s.root, id, (node) => {
              if (node.kind !== "group") return node;
              return { ...node, collapsed: !node.collapsed };
            }),
          }));
        },

        moveNode(nodeId, targetGroupId, targetIndex) {
          set((s) => ({
            root: moveNode(s.root, nodeId, targetGroupId, targetIndex),
          }));
        },

        // ── PREVIEW ──
        setPreviewFormat(format) {
          set({ previewFormat: format });
        },

        getPreviewQuery() {
          const { root, previewFormat, getSchema } = get();
          return generateQuery(root, getSchema(), previewFormat);
        },

        // ── VALIDATION ──
        getValidation() {
          const { root, getSchema } = get();
          return validateQuery(root, getSchema());
        },

        // ── HISTORY ──
        pushHistory(name) {
          const { root, schemaName, history } = get();
          const snapshot: QuerySnapshot = {
            id: uuidv4(),
            name,
            schemaName,
            root: JSON.parse(JSON.stringify(root)),
            createdAt: new Date().toISOString(),
          };
          // keep last 50 history entries
          set({ history: [snapshot, ...history].slice(0, 50) });
        },

        restoreSnapshot(id) {
          const { history, presets } = get();
          const snap = [...history, ...presets].find((s) => s.id === id);
          if (!snap) return;
          set({
            root: JSON.parse(JSON.stringify(snap.root)),
            schemaName: snap.schemaName,
          });
        },

        deleteHistory(id) {
          set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
        },

        // ── PRESETS ──
        savePreset(name) {
          const { root, schemaName, presets } = get();
          const preset: QuerySnapshot = {
            id: uuidv4(),
            name,
            schemaName,
            root: JSON.parse(JSON.stringify(root)),
            createdAt: new Date().toISOString(),
            isPreset: true,
          };
          set({ presets: [preset, ...presets] });
        },

        loadPreset(id) {
          get().restoreSnapshot(id);
        },

        deletePreset(id) {
          set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }));
        },

        exportJSON() {
          const { root, schemaName } = get();
          return JSON.stringify({ schemaName, root }, null, 2);
        },

        importJSON(json) {
          try {
            const parsed = JSON.parse(json);
            if (!parsed.root || typeof parsed.root !== "object") {
              return {
                success: false,
                error: "Invalid query JSON: missing root",
              };
            }
            if (!parsed.root.kind || parsed.root.kind !== "group") {
              return {
                success: false,
                error: "Invalid query JSON: root must be a group node",
              };
            }
            if (!parsed.schemaName) {
              return { success: false, error: `Missing schemaName` };
            }
            const { customSchemas } = get();
            const schemaExists =
              getSchemaByName(parsed.schemaName) ||
              customSchemas.find((s) => s.name === parsed.schemaName);
            if (!schemaExists) {
              return {
                success: false,
                error: `Unknown schema: "${parsed.schemaName}"`,
              };
            }
            set({ root: parsed.root, schemaName: parsed.schemaName });
            return { success: true };
          } catch {
            return { success: false, error: "Invalid JSON" };
          }
        },

        resetQuery() {
          set((s) => ({
            root: makeInitialRoot(s.schemaName),
            selectedNodeId: null,
          }));
        },

        // ── SELECTION ──
        setSelectedNode(id) {
          set({ selectedNodeId: id });
        },
      }),
      {
        name: "kweri-store",
        partialize: (s) => ({
          customSchemas: s.customSchemas,
          history: s.history,
          presets: s.presets,
        }),
      },
    ),
  ),
);

// ─────────────────────────────────────────────
// DEFAULT PRESETS
// ─────────────────────────────────────────────

function getDefaultPresets(): QuerySnapshot[] {
  const r1 = {
    ...createRule("country", "equals"),
    value: "Nigeria",
  } as QueryRule;
  const r2 = { ...createRule("age", "greater_than"), value: "18" } as QueryRule;
  const r3 = {
    ...createRule("status", "equals"),
    value: "active",
  } as QueryRule;
  const root1: QueryGroup = { ...createGroup("AND"), children: [r1, r2, r3] };

  const r4 = {
    ...createRule("purchases", "greater_than"),
    value: "10",
  } as QueryRule;
  const r5 = {
    ...createRule("status", "equals"),
    value: "active",
  } as QueryRule;
  const root2: QueryGroup = { ...createGroup("AND"), children: [r4, r5] };

  return [
    {
      id: "preset-1",
      name: "Active Nigerian users over 18",
      schemaName: "users",
      root: root1,
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
    {
      id: "preset-2",
      name: "High-value active customers",
      schemaName: "users",
      root: root2,
      createdAt: new Date().toISOString(),
      isPreset: true,
    },
  ];
}
