import type { Schema } from "@/lib/query-engine/types";

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

export const ORDERS_SCHEMA: Schema = {
  name: "orders",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "userId", type: "number", label: "User ID" },
    { name: "product", type: "string", label: "Product" },
    { name: "total", type: "number", label: "Total ($)" },
    {
      name: "status",
      type: "enum",
      label: "Status",
      enumValues: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
    { name: "region", type: "string", label: "Region" },
    { name: "createdAt", type: "date", label: "Created At" },
    { name: "refunded", type: "boolean", label: "Refunded" },
  ],
};

export const PRODUCTS_SCHEMA: Schema = {
  name: "products",
  fields: [
    { name: "id", type: "number", label: "ID" },
    { name: "name", type: "string", label: "Name" },
    {
      name: "category",
      type: "enum",
      label: "Category",
      enumValues: [
        "electronics",
        "clothing",
        "food",
        "books",
        "sports",
        "home",
      ],
    },
    { name: "price", type: "number", label: "Price ($)" },
    { name: "stock", type: "number", label: "Stock" },
    { name: "rating", type: "number", label: "Rating" },
    { name: "inStock", type: "boolean", label: "In Stock" },
    { name: "createdAt", type: "date", label: "Created At" },
  ],
};

export const SCHEMAS: Schema[] = [USERS_SCHEMA, ORDERS_SCHEMA, PRODUCTS_SCHEMA];

export function getSchemaByName(name: string): Schema | undefined {
  return SCHEMAS.find((s) => s.name === name);
}
