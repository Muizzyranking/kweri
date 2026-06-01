import type { Schema } from "@/lib/query-engine";

const TYPE_COLORS: Record<string, string> = {
  string: "string",
  number: "number",
  date: "date",
  enum: "enum",
  boolean: "boolean",
};

export function FieldsPreview({
  schema,
  maxShow = 4,
}: {
  schema: Schema;
  maxShow?: number;
}) {
  const shown = schema.fields.slice(0, maxShow);
  const rest = schema.fields.length - maxShow;
  return (
    <div className="schema-row__fields-preview">
      {shown.map((f) => (
        <span key={f.name} className="field-pill">
          {f.name}
          <span
            className={`field-pill__type field-pill__type--${TYPE_COLORS[f.type] ?? "string"}`}
          >
            {f.type}
          </span>
        </span>
      ))}
      {rest > 0 && (
        <span className="field-pill" style={{ color: "var(--color-muted)" }}>
          +{rest} more
        </span>
      )}
    </div>
  );
}

export function ExpandedFields({ schema }: { schema: Schema }) {
  return (
    <div
      style={{
        padding: "12px 16px 16px",
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {schema.fields.map((f) => (
          <span key={f.name} className="field-pill">
            {f.name}
            <span
              className={`field-pill__type field-pill__type--${TYPE_COLORS[f.type] ?? "string"}`}
            >
              {f.type}
            </span>
            {f.enumValues && (
              <span style={{ color: "var(--color-muted)", fontSize: 9 }}>
                ({f.enumValues.join(", ")})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
