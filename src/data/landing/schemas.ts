export const SCHEMAS = [
  {
    name: "users", emoji: "👤",
    fields: [
      { name: "id", type: "number" }, { name: "name", type: "string" },
      { name: "email", type: "string" }, { name: "age", type: "number" },
      { name: "country", type: "string" }, { name: "status", type: "enum" },
      { name: "createdAt", type: "date" }, { name: "purchases", type: "number" },
    ],
  },
  {
    name: "orders", emoji: "📦",
    fields: [
      { name: "id", type: "number" }, { name: "userId", type: "number" },
      { name: "product", type: "string" }, { name: "total", type: "number" },
      { name: "status", type: "enum" }, { name: "region", type: "string" },
      { name: "createdAt", type: "date" }, { name: "refunded", type: "boolean" },
    ],
  },
  {
    name: "products", emoji: "🏷️",
    fields: [
      { name: "id", type: "number" }, { name: "name", type: "string" },
      { name: "category", type: "enum" }, { name: "price", type: "number" },
      { name: "stock", type: "number" }, { name: "rating", type: "number" },
      { name: "inStock", type: "boolean" }, { name: "createdAt", type: "date" },
    ],
  },
];
