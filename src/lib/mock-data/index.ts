const PLANET_NAMES = [
  "Virelia-9",
  "Kepler Rift",
  "Astra Prime",
  "Nyx Hollow",
  "Eos Drifts",
  "Caldera Vox",
  "Lumen Reach",
  "Obsidian Ark",
  "Thalassa Verge",
  "Cryon Delta",
];

const PLAYER_CALLSIGNS = [
  "Nova Lynx",
  "Iron Vega",
  "Pulse Warden",
  "Rift Sable",
  "Echo Vale",
  "Solar Kite",
  "Cipher Atlas",
  "Ghost Meridian",
  "Ion Ember",
  "Zenith Flux",
  "Apex Nyx",
  "Comet Rook",
  "Void Kestrel",
  "Signal Knox",
  "Halo Strider",
  "Rune Vortex",
  "Titan Sol",
  "Orbit Cinder",
  "Neon Quasar",
  "Argon Wake",
  "Drift Aegis",
  "Helix Storm",
  "Flux Runner",
  "Vector Ash",
  "Prism Echo",
  "Shard Ranger",
  "Cobalt Wing",
  "Zero Horizon",
  "Lunar Pike",
  "Omega Trace",
];

const PLAYER_CLASSES = [
  "vanguard",
  "scout",
  "engineer",
  "medic",
  "voidwalker",
] as const;
const FACTIONS = [
  "nova_guard",
  "orion_pact",
  "riftborn",
  "atlas_union",
] as const;

export const PLAYERS_DATA = PLAYER_CALLSIGNS.map((callsign, i) => ({
  id: i + 1,
  callsign,
  class: PLAYER_CLASSES[i % PLAYER_CLASSES.length],
  rank: 1 + Math.floor(Math.abs(Math.sin(i * 4.7) * 99)),
  homePlanet: PLANET_NAMES[i % PLANET_NAMES.length],
  faction: FACTIONS[i % FACTIONS.length],
  xp: Math.floor(Math.abs(Math.cos(i * 2.9) * 850_000) + 5_000),
  active: i % 5 !== 0,
  lastSignal: new Date(2426, i % 12, (i % 28) + 1).toISOString().split("T")[0],
}));

const BIOMES = [
  "desert",
  "ice",
  "ocean",
  "volcanic",
  "jungle",
  "nebula",
] as const;
const SECTORS = [
  "Orion Spur",
  "Vela Expanse",
  "Perseus Arm",
  "Helix Gate",
  "Crab Veil",
  "Sable Quadrant",
  "Zenith Belt",
  "Eclipse Reach",
];

export const PLANETS_DATA = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  name: PLANET_NAMES[i % PLANET_NAMES.length],
  biome: BIOMES[i % BIOMES.length],
  sector: SECTORS[i % SECTORS.length],
  distanceLy: Math.round((Math.abs(Math.sin(i * 3.1) * 680) + 4.2) * 10) / 10,
  gravity: Math.round((0.4 + Math.abs(Math.cos(i * 1.8) * 2.6)) * 100) / 100,
  hazardLevel: 1 + Math.floor(Math.abs(Math.sin(i * 5.2) * 9)),
  colonized: i % 4 === 0 || i % 9 === 0,
  discoveredAt: new Date(2418, i % 12, (i % 28) + 1)
    .toISOString()
    .split("T")[0],
}));

const MISSION_NAMES = [
  "Glass Horizon",
  "Silent Comet",
  "Night Beacon",
  "Starlance",
  "Frost Vector",
  "Dustwake",
  "Black Aurora",
  "Signal Bloom",
  "Crimson Orbit",
  "Deep Lantern",
  "Neon Bastion",
  "Solar Lock",
];
const OBJECTIVES = [
  "recon",
  "salvage",
  "defense",
  "extraction",
  "terraform",
] as const;
const MISSION_STATUSES = [
  "queued",
  "active",
  "failed",
  "complete",
  "classified",
] as const;

export const MISSIONS_DATA = Array.from({ length: 54 }, (_, i) => ({
  id: i + 1,
  codeName: MISSION_NAMES[i % MISSION_NAMES.length],
  objective: OBJECTIVES[i % OBJECTIVES.length],
  targetPlanet: PLANET_NAMES[(i * 2) % PLANET_NAMES.length],
  status: MISSION_STATUSES[i % MISSION_STATUSES.length],
  threatScore: 1 + Math.floor(Math.abs(Math.sin(i * 6.4) * 100)),
  rewardCredits: Math.round(Math.abs(Math.cos(i * 2.4) * 90_000) + 2_500),
  crewRequired: 2 + (i % 10),
  startsAt: new Date(2427, i % 12, (i % 28) + 1).toISOString().split("T")[0],
}));

const WEAPON_NAMES = [
  "Helios Rail",
  "Void Pike",
  "Arc Splicer",
  "Nova Lance",
  "Grav Hammer",
  "Ion Bloom",
  "Pulse Repeater",
  "Rift Carbine",
  "Photon Fang",
  "Nebula Drone",
  "Quasar Blade",
  "Aether Mortar",
];
const WEAPON_TYPES = [
  "plasma",
  "railgun",
  "laser",
  "ion",
  "gravity",
  "drone",
] as const;
const RARITIES = ["common", "rare", "epic", "legendary", "prototype"] as const;

export const WEAPONS_DATA = Array.from({ length: 52 }, (_, i) => ({
  id: i + 1,
  name: WEAPON_NAMES[i % WEAPON_NAMES.length],
  type: WEAPON_TYPES[i % WEAPON_TYPES.length],
  damage: 10 + Math.floor(Math.abs(Math.sin(i * 4.2) * 940)),
  rangeKm: Math.round(Math.abs(Math.cos(i * 3.6) * 42_000) + 120),
  energyCost: 5 + Math.floor(Math.abs(Math.sin(i * 2.2) * 220)),
  rarity: RARITIES[i % RARITIES.length],
  experimental: i % 8 === 0 || i % 13 === 0,
  forgedAt: new Date(2424, i % 12, (i % 28) + 1).toISOString().split("T")[0],
}));

export function getDataBySchema(schemaName: string): Record<string, unknown>[] {
  switch (schemaName) {
    case "players":
      return PLAYERS_DATA as unknown as Record<string, unknown>[];
    case "planets":
      return PLANETS_DATA as unknown as Record<string, unknown>[];
    case "missions":
      return MISSIONS_DATA as unknown as Record<string, unknown>[];
    case "weapons":
      return WEAPONS_DATA as unknown as Record<string, unknown>[];
    default:
      return [];
  }
}
