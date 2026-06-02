import type { Schema } from "@/lib/query-engine/types";

export const PLAYERS_SCHEMA: Schema = {
  name: "players",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "callsign", type: "string", label: "Callsign" },
    {
      name: "role",
      type: "enum",
      label: "Role",
      enumValues: ["architect", "apprentice", "wanderer"],
    },
    {
      name: "rankTier",
      type: "enum",
      label: "Rank Tier",
      enumValues: ["initiate", "adept", "elite", "mythic"],
    },
    { name: "originWorld", type: "string", label: "Origin World" },
    { name: "sector", type: "string", label: "Sector" },
    { name: "guild", type: "string", label: "Guild" },
    { name: "rank", type: "number", label: "Rank" },
    { name: "xp", type: "number", label: "XP" },
    { name: "missionsCompleted", type: "number", label: "Missions" },
    { name: "mentorScore", type: "number", label: "Mentor Score" },
    { name: "apprenticeScore", type: "number", label: "Apprentice Score" },
    { name: "signalIntegrity", type: "number", label: "Signal Integrity" },
    { name: "credits", type: "number", label: "Credits" },
    { name: "mentorCallsign", type: "string", label: "Mentor" },
    { name: "active", type: "boolean", label: "Active" },
    { name: "joinedAt", type: "date", label: "Joined At" },
    { name: "lastSignal", type: "date", label: "Last Signal" },
  ],
};

export const PLANETS_SCHEMA: Schema = {
  name: "planets",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "name", type: "string", label: "Name" },
    {
      name: "biome",
      type: "enum",
      label: "Biome",
      enumValues: ["desert", "ice", "ocean", "volcanic", "jungle", "nebula"],
    },
    { name: "sector", type: "string", label: "Sector" },
    { name: "distanceLy", type: "number", label: "Distance (LY)" },
    { name: "gravity", type: "number", label: "Gravity" },
    { name: "hazardLevel", type: "number", label: "Hazard Level" },
    { name: "colonized", type: "boolean", label: "Colonized" },
    { name: "discoveredAt", type: "date", label: "Discovered At" },
  ],
};

export const MISSIONS_SCHEMA: Schema = {
  name: "missions",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "codeName", type: "string", label: "Code Name" },
    {
      name: "objective",
      type: "enum",
      label: "Objective",
      enumValues: ["recon", "salvage", "defense", "extraction", "terraform"],
    },
    { name: "targetPlanet", type: "string", label: "Target Planet" },
    {
      name: "status",
      type: "enum",
      label: "Status",
      enumValues: ["queued", "active", "failed", "complete", "classified"],
    },
    { name: "threatScore", type: "number", label: "Threat Score" },
    { name: "rewardCredits", type: "number", label: "Reward Credits" },
    { name: "crewRequired", type: "number", label: "Crew Required" },
    { name: "startsAt", type: "date", label: "Starts At" },
  ],
};

export const WEAPONS_SCHEMA: Schema = {
  name: "weapons",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "name", type: "string", label: "Name" },
    {
      name: "type",
      type: "enum",
      label: "Type",
      enumValues: ["plasma", "railgun", "laser", "ion", "gravity", "drone"],
    },
    { name: "damage", type: "number", label: "Damage" },
    { name: "rangeKm", type: "number", label: "Range (KM)" },
    { name: "energyCost", type: "number", label: "Energy Cost" },
    {
      name: "rarity",
      type: "enum",
      label: "Rarity",
      enumValues: ["common", "rare", "epic", "legendary", "prototype"],
    },
    { name: "experimental", type: "boolean", label: "Experimental" },
    { name: "forgedAt", type: "date", label: "Forged At" },
  ],
};

export const SCHEMAS: Schema[] = [
  PLAYERS_SCHEMA,
  PLANETS_SCHEMA,
  MISSIONS_SCHEMA,
  WEAPONS_SCHEMA,
];

export function getSchemaByName(name: string): Schema | undefined {
  return SCHEMAS.find((s) => s.name === name);
}
