import { describe, expect, it } from "vitest";
import { getDataBySchema } from "@/lib/mock-data";
import { executeQuery } from "@/lib/query-engine/executor";
import { createGroup, createRule } from "@/lib/query-engine/tree";
import type { QueryGroup, QueryRule } from "@/lib/query-engine/types";
import { getSchemaByName, PLAYERS_SCHEMA } from "@/lib/schemas";
import { generateHistoryName, useQueryStore } from "@/store/query-store";

const makeRoot = (...children: (QueryGroup | QueryRule)[]): QueryGroup => ({
  ...createGroup("AND"),
  children,
});

describe("generateHistoryName", () => {
  it("names empty or unfinished queries as all rows for the schema", () => {
    const blankRule = createRule("id", "equals");

    expect(generateHistoryName(makeRoot(blankRule), PLAYERS_SCHEMA)).toBe(
      "All players",
    );
  });

  it("summarizes the current query conditions", () => {
    const role = { ...createRule("role", "equals"), value: "architect" };
    const rank = { ...createRule("rank", "greater_than"), value: "70" };
    const active = { ...createRule("active", "equals"), value: "true" };

    expect(
      generateHistoryName(makeRoot(role, rank, active), PLAYERS_SCHEMA),
    ).toBe("Players: Role = architect AND Rank > 70 AND Active = true");
  });

  it("summarizes nested groups without overlong titles", () => {
    const role = { ...createRule("role", "equals"), value: "wanderer" };
    const rankTier = {
      ...createRule("rankTier", "equals"),
      value: "mythic",
    };
    const xp = { ...createRule("xp", "greater_than"), value: "900000" };
    const credits = {
      ...createRule("credits", "greater_than"),
      value: "100000",
    };
    const group: QueryGroup = {
      ...createGroup("OR"),
      children: [rankTier, xp, credits],
    };

    expect(generateHistoryName(makeRoot(role, group), PLAYERS_SCHEMA)).toBe(
      "Players: Role = wanderer AND (Rank Tier = mythic OR XP > 900000 +1 more)",
    );
  });
});

describe("default presets", () => {
  it("includes multiple built-in presets for each schema", () => {
    const presets = useQueryStore.getState().presets;

    for (const schemaName of ["players", "planets", "missions", "weapons"]) {
      expect(
        presets.filter(
          (preset) => preset.isPreset && preset.schemaName === schemaName,
        ),
      ).toHaveLength(3);
    }
  });

  it("matches at least one row for every built-in preset", () => {
    const presets = useQueryStore.getState().presets.filter((p) => p.isPreset);
    const emptyPresets: string[] = [];

    for (const preset of presets) {
      const schema = getSchemaByName(preset.schemaName);
      expect(schema).toBeTruthy();

      if (!schema) continue;

      const result = executeQuery(
        getDataBySchema(preset.schemaName),
        preset.root,
        schema,
      );

      if (result.matched === 0) emptyPresets.push(preset.name ?? preset.id);
    }

    expect(emptyPresets).toEqual([]);
  });
});
