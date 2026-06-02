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
  FieldDefinition,
  LogicOperator,
  Operator,
  PreviewFormat,
  QueryGroup,
  QueryNode,
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
  getSchemaByName: (name: string) => Schema | undefined;
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
  updateNodeConnector: (id: string, connector: LogicOperator) => void;
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

const DEFAULT_SCHEMA = SCHEMAS[0].name;

function makeInitialRoot(schemaName?: string): QueryGroup {
  const schema = getSchemaByName(schemaName ?? DEFAULT_SCHEMA) ?? SCHEMAS[0];
  const firstField = schema.fields[0]?.name ?? "";
  const group = createGroup("AND");
  group.children = [createRule(firstField, "equals")];
  return group;
}

const HISTORY_NAME_LIMIT = 96;
const HISTORY_NODE_LIMIT = 3;

const HISTORY_OPERATOR_LABELS: Record<Operator, string> = {
  equals: "=",
  not_equals: "!=",
  contains: "contains",
  not_contains: "excludes",
  starts_with: "starts with",
  ends_with: "ends with",
  greater_than: ">",
  less_than: "<",
  greater_than_or_equal: ">=",
  less_than_or_equal: "<=",
  in_array: "in",
  not_in_array: "not in",
  between: "between",
  is_null: "is empty",
  is_not_null: "is not empty",
  regex: "matches",
  before: "before",
  after: "after",
  on_date: "on",
};

export function generateHistoryName(root: QueryGroup, schema: Schema): string {
  const summary = summarizeGroup(root, schema, HISTORY_NODE_LIMIT);
  const schemaName = toTitleLabel(schema.name);

  if (!summary.text) return `All ${schema.name}`;

  const suffix = summary.remaining > 0 ? ` +${summary.remaining} more` : "";
  return truncateText(
    `${schemaName}: ${summary.text}${suffix}`,
    HISTORY_NAME_LIMIT,
  );
}

function summarizeGroup(
  group: QueryGroup,
  schema: Schema,
  limit: number,
): { text: string; remaining: number } {
  const parts: string[] = [];
  let remaining = 0;

  for (const child of group.children) {
    const childText = summarizeNode(child, schema);
    if (!childText) continue;

    if (parts.length >= limit) {
      remaining += countSummarizableRules(child, schema);
      continue;
    }

    const connector =
      parts.length === 0 ? "" : `${child.connector ?? group.logic} `;
    parts.push(`${connector}${childText}`);
  }

  return { text: parts.join(" "), remaining };
}

function summarizeNode(node: QueryNode, schema: Schema): string {
  if (node.kind === "rule") return summarizeRule(node, schema);

  const summary = summarizeGroup(node, schema, 2);
  if (!summary.text) return "";

  const suffix = summary.remaining > 0 ? ` +${summary.remaining} more` : "";
  return `(${summary.text}${suffix})`;
}

function summarizeRule(rule: QueryRule, schema: Schema): string {
  const field = schema.fields.find((f) => f.name === rule.field);
  if (!field || !rule.field || !hasMeaningfulValue(rule)) return "";

  const fieldLabel = getFieldLabel(field);
  const operatorLabel = HISTORY_OPERATOR_LABELS[rule.operator];

  if (rule.operator === "is_null" || rule.operator === "is_not_null") {
    return `${fieldLabel} ${operatorLabel}`;
  }

  if (rule.operator === "between") {
    return `${fieldLabel} ${operatorLabel} ${formatRangeValue(rule)}`;
  }

  return `${fieldLabel} ${operatorLabel} ${formatSingleValue(rule.value)}`;
}

function hasMeaningfulValue(rule: QueryRule): boolean {
  if (rule.operator === "is_null" || rule.operator === "is_not_null") {
    return true;
  }

  if (rule.operator === "between") {
    return Boolean(rule.value?.trim() || rule.valueTo?.trim());
  }

  return Boolean(rule.value?.trim());
}

function countSummarizableRules(node: QueryNode, schema: Schema): number {
  if (node.kind === "rule") return summarizeRule(node, schema) ? 1 : 0;
  return node.children.reduce(
    (count, child) => count + countSummarizableRules(child, schema),
    0,
  );
}

function getFieldLabel(field: FieldDefinition): string {
  return field.label?.trim() || toTitleLabel(field.name);
}

function formatRangeValue(rule: QueryRule): string {
  const from = formatSingleValue(rule.value);
  const to = formatSingleValue(rule.valueTo);

  if (from && to) return `${from} to ${to}`;
  return from || to;
}

function formatSingleValue(value: string | undefined): string {
  return truncateText(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", "),
    28,
  );
}

function toTitleLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function mergePersistedStore(
  persisted: unknown,
  current: QueryStore,
): QueryStore {
  if (!persisted || typeof persisted !== "object") return current;

  const persistedState = persisted as Partial<QueryStore>;
  return {
    ...current,
    ...persistedState,
    presets: mergeDefaultPresets(persistedState.presets, current.presets),
  };
}

function mergeDefaultPresets(
  savedPresets: QuerySnapshot[] | undefined,
  defaultPresets: QuerySnapshot[],
): QuerySnapshot[] {
  const saved = Array.isArray(savedPresets) ? savedPresets : [];
  const defaultIds = new Set(defaultPresets.map((preset) => preset.id));
  const userPresets = saved.filter((preset) => !defaultIds.has(preset.id));

  return [...userPresets, ...defaultPresets];
}

export function getBuiltInPresetsForTests(): QuerySnapshot[] {
  return getDefaultPresets();
}

export function mergePresetsForTests(
  savedPresets: QuerySnapshot[] | undefined,
  defaultPresets: QuerySnapshot[],
): QuerySnapshot[] {
  return mergeDefaultPresets(savedPresets, defaultPresets);
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
        getSchemaByName(name) {
          return (
            get().customSchemas.find((s) => s.name === name) ??
            getSchemaByName(name)
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
            const firstField = schema.fields[0]?.name ?? "";
            const root = createGroup("AND");
            root.children = [createRule(firstField, "equals")];
            set((s) => ({
              customSchemas: [
                ...s.customSchemas.filter((c) => c.name !== schema.name),
                schema,
              ],
              schemaName: schema.name,
              root,
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
        updateNodeConnector(id, connector) {
          set((s) => ({
            root: updateNode(s.root, id, (node) => ({
              ...node,
              connector,
            })),
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
          const { root, schemaName, history, getSchema } = get();
          const snapshot: QuerySnapshot = {
            id: uuidv4(),
            name: name?.trim() || generateHistoryName(root, getSchema()),
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
          root: s.root,
          schemaName: s.schemaName,
          previewFormat: s.previewFormat,
          customSchemas: s.customSchemas,
          history: s.history,
          presets: s.presets,
        }),
        merge: mergePersistedStore,
      },
    ),
  ),
);

// ─────────────────────────────────────────────
// DEFAULT PRESETS
// ─────────────────────────────────────────────

function getDefaultPresets(): QuerySnapshot[] {
  const createdAt = new Date().toISOString();

  return [
    makePreset(
      "preset-1",
      "Active elite architects",
      "players",
      presetGroup("AND", [
        presetRule("role", "equals", "architect"),
        presetRule("rank", "greater_than", "70"),
        presetRule("active", "equals", "true"),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-players-apprentice-review",
      "Apprentices needing review",
      "players",
      presetGroup("AND", [
        presetRule("role", "equals", "apprentice"),
        presetRule("active", "equals", "true"),
        presetRule("apprenticeScore", "between", "35", "100"),
        presetRule("missionsCompleted", "less_than", "160"),
        presetGroup("OR", [
          presetRule("mentorCallsign", "equals", "Abdul Tsx"),
          presetRule("mentorCallsign", "equals", "Coded Libra"),
          presetRule("mentorCallsign", "equals", "Explorer"),
          presetRule("mentorCallsign", "equals", "The Shinobi"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-players-wanderer-scouts",
      "High-value wanderer scouts",
      "players",
      presetGroup("AND", [
        presetRule("role", "equals", "wanderer"),
        presetRule("active", "equals", "true"),
        presetRule("rankTier", "not_equals", "initiate"),
        presetGroup("OR", [
          presetRule("credits", "greater_than", "100000"),
          presetRule("xp", "greater_than", "900000"),
        ]),
        presetGroup("OR", [
          presetRule("sector", "equals", "Vela Expanse"),
          presetRule("sector", "equals", "Crab Veil"),
          presetRule("sector", "equals", "Zenith Belt"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-2",
      "Distant high-risk worlds",
      "planets",
      presetGroup("AND", [
        presetRule("distanceLy", "greater_than", "300"),
        presetRule("hazardLevel", "greater_than", "6"),
        presetRule("colonized", "equals", "true"),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-planets-expansion",
      "Safe expansion worlds",
      "planets",
      presetGroup("AND", [
        presetRule("colonized", "equals", "false"),
        presetRule("hazardLevel", "less_than_or_equal", "4"),
        presetRule("distanceLy", "between", "600", "690"),
        presetRule("gravity", "between", "1.4", "2.6"),
        presetGroup("OR", [
          presetRule("biome", "equals", "ocean"),
          presetRule("biome", "equals", "jungle"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-planets-anomaly-scan",
      "Frontier anomaly scan",
      "planets",
      presetGroup("AND", [
        presetRule("colonized", "equals", "false"),
        presetRule("discoveredAt", "before", "2418-10-01"),
        presetGroup("OR", [
          presetRule("sector", "equals", "Vela Expanse"),
          presetRule("sector", "equals", "Helix Gate"),
          presetRule("sector", "equals", "Sable Quadrant"),
        ]),
        presetGroup("OR", [
          presetRule("biome", "equals", "nebula"),
          presetRule("hazardLevel", "greater_than_or_equal", "8"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-3",
      "Active threat missions",
      "missions",
      presetGroup("AND", [
        presetRule("status", "equals", "active"),
        presetRule("threatScore", "greater_than", "70"),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-missions-classified-reward",
      "High-reward classified ops",
      "missions",
      presetGroup("AND", [
        presetRule("threatScore", "greater_than_or_equal", "60"),
        presetRule("rewardCredits", "greater_than", "40000"),
        presetRule("crewRequired", "greater_than_or_equal", "4"),
        presetRule("startsAt", "after", "2427-02-01"),
        presetGroup("OR", [
          presetRule("status", "equals", "active"),
          presetRule("status", "equals", "classified"),
          presetRule("status", "equals", "queued"),
        ]),
        presetGroup("OR", [
          presetRule("objective", "equals", "salvage"),
          presetRule("objective", "equals", "terraform"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-missions-salvage-terraform",
      "Salvage terraform candidates",
      "missions",
      presetGroup("AND", [
        presetRule("status", "not_equals", "failed"),
        presetRule("threatScore", "between", "30", "80"),
        presetRule("crewRequired", "between", "4", "8"),
        presetGroup("OR", [
          presetRule("objective", "equals", "salvage"),
          presetRule("objective", "equals", "terraform"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-4",
      "Prototype weapons lab",
      "weapons",
      presetGroup("AND", [
        presetRule("rarity", "equals", "prototype"),
        presetRule("experimental", "equals", "true"),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-weapons-long-range",
      "Long-range efficient weapons",
      "weapons",
      presetGroup("AND", [
        presetRule("rangeKm", "greater_than", "20000"),
        presetRule("energyCost", "less_than", "100"),
        presetRule("damage", "greater_than_or_equal", "250"),
        presetRule("experimental", "equals", "false"),
        presetGroup("OR", [
          presetRule("type", "equals", "railgun"),
          presetRule("type", "equals", "laser"),
          presetRule("type", "equals", "drone"),
        ]),
      ]),
      createdAt,
    ),
    makePreset(
      "preset-weapons-unstable-heavy",
      "Unstable heavy prototypes",
      "weapons",
      presetGroup("AND", [
        presetRule("experimental", "equals", "true"),
        presetRule("damage", "between", "300", "900"),
        presetRule("energyCost", "greater_than", "100"),
        presetRule("forgedAt", "before", "2424-09-01"),
        presetGroup("OR", [
          presetRule("type", "equals", "gravity"),
          presetRule("type", "equals", "plasma"),
          presetRule("type", "equals", "ion"),
        ]),
      ]),
      createdAt,
    ),
  ];
}

function makePreset(
  id: string,
  name: string,
  schemaName: string,
  root: QueryGroup,
  createdAt: string,
): QuerySnapshot {
  return {
    id,
    name,
    schemaName,
    root,
    createdAt,
    isPreset: true,
  };
}

function presetGroup(
  logic: LogicOperator,
  children: QueryNode[],
  connector?: LogicOperator,
): QueryGroup {
  return { ...createGroup(logic, connector), children };
}

function presetRule(
  field: string,
  operator: Operator,
  value?: string,
  valueTo?: string,
  connector?: LogicOperator,
): QueryRule {
  return {
    ...createRule(field, operator, connector),
    value: value ?? "",
    valueTo,
  };
}
