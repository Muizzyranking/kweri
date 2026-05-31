import type { PreviewFormat, QueryGroup, Schema } from "../types";
import { generateGraphQL } from "./graphql";
import { generateMongoDB } from "./mongo";
import { generateSQL } from "./sql";

export function generateQuery(
  root: QueryGroup,
  schema: Schema,
  format: PreviewFormat,
): string {
  switch (format) {
    case "sql":
      return generateSQL(root, schema);
    case "mongodb":
      return generateMongoDB(root, schema);
    case "graphql":
      return generateGraphQL(root, schema);
  }
}
