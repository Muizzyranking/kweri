import type { Schema } from "@/lib/query-engine/types";

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "Canada"] as const;
const STATUSES = ["active", "inactive", "pending", "banned"] as const;
const NAMES = [
  "Ada Nova",
  "Amara Nwosu",
  "Kofi Mensah",
  "Zainab Okafor",
  "David Adeyemi",
  "Fatima Bello",
  "Emeka Eze",
  "Aisha Hassan",
  "Tunde Bakare",
  "Ngozi Okonkwo",
];

export const USERS_SCHEMA: Schema = {
  name: "users",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "name", type: "string", label: "Name" },
    { name: "email", type: "string", label: "Email" },
    { name: "age", type: "number", label: "Age" },
    { name: "country", type: "string", label: "Country" },
    {
      name: "status",
      type: "enum",
      label: "Status",
      enumValues: ["active", "inactive", "pending", "banned"],
    },
    { name: "createdAt", type: "date", label: "Created At" },
    { name: "purchases", type: "number", label: "Purchases" },
  ],
};

export const USERS_DATA = Array.from({ length: 50 }, (_, i) => {
  const name = NAMES[i % NAMES.length];
  return {
    id: i + 1,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    age: 18 + (i % 45),
    country: COUNTRIES[i % COUNTRIES.length],
    status: STATUSES[i % STATUSES.length],
    createdAt: new Date(2022, i % 12, (i % 28) + 1).toISOString().split("T")[0],
    purchases: i * 3,
  };
});
