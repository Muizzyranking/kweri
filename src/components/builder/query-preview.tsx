"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { generateQuery } from "@/lib/query-engine/generator";
import type { PreviewFormat } from "@/lib/query-engine/types";
import { useQueryStore } from "@/store/query-store";
import "./builder.css";

const FORMATS: { value: PreviewFormat; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "graphql", label: "GraphQL" },
];

// Very minimal syntax highlighting via span wrapping
function highlight(code: string, format: PreviewFormat): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trimStart();
    let color = "var(--color-primary)";

    if (format === "sql") {
      const keywords =
        /^(SELECT|FROM|WHERE|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|DATE)\b/i;
      if (keywords.test(trimmed)) color = "var(--color-orange)";
    } else if (format === "mongodb") {
      if (trimmed.startsWith('"$')) color = "var(--color-teal-bright)";
      else if (trimmed.startsWith("db.")) color = "var(--color-orange)";
    } else if (format === "graphql") {
      if (trimmed.startsWith("query")) color = "var(--color-orange)";
      else if (
        trimmed.startsWith("filter") ||
        trimmed.startsWith("AND") ||
        trimmed.startsWith("OR")
      ) {
        color = "var(--color-teal-bright)";
      }
    }

    return (
      <div
        key={`${line.slice(0, 10)}-${i}`}
        style={{ color, minHeight: "1.5em" }}
      >
        {line || " "}
      </div>
    );
  });
}

export function QueryPreview() {
  const root = useQueryStore((s) => s.root);
  const previewFormat = useQueryStore((s) => s.previewFormat);
  const setPreviewFormat = useQueryStore((s) => s.setPreviewFormat);
  const getSchema = useQueryStore((s) => s.getSchema);
  const [copied, setCopied] = useState(false);

  // Re-runs whenever root or previewFormat changes
  const query = useMemo(
    () => generateQuery(root, getSchema(), previewFormat),
    [root, previewFormat, getSchema],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-muted)",
          }}
        >
          Query Preview
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Format switcher */}
          <div
            style={{
              display: "flex",
              background: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {FORMATS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setPreviewFormat(f.value)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.15s",
                  background:
                    previewFormat === f.value
                      ? "var(--color-orange)"
                      : "transparent",
                  color:
                    previewFormat === f.value
                      ? "#fff"
                      : "var(--color-secondary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Copy button */}
          <button
            type="button"
            className="icon-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check size={13} color="var(--color-success)" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Code block */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
        }}
      >
        <pre
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre",
          }}
        >
          {highlight(query, previewFormat)}
        </pre>
      </div>
    </div>
  );
}
