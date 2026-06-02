"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Moon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import { KweriLogoMark } from "@/components/ui/logo";
import { useTheme } from "@/components/ui/theme-provider";
import { SCHEMAS } from "@/lib/schemas";
import { useQueryStore } from "@/store/query-store";
import "./schemas.css";
import { ConfirmDelete } from "@/components/schemas/confirm-delete";
import { ExpandedFields, FieldsPreview } from "@/components/schemas/fields";

const BUILTIN_EMOJI: Record<string, string> = {
  players: "🎮",
  planets: "🪐",
  missions: "🚀",
  weapons: "⚔",
};

const EXAMPLE_SCHEMA = `{
  "name": "starships",
  "fields": [
    { "name": "id",            "type": "number" },
    { "name": "name",          "type": "string" },
    { "name": "class",         "type": "enum",
      "enumValues": ["frigate","carrier","corvette"] },
    { "name": "warpRangeLy",   "type": "number" },
    { "name": "commissioned",  "type": "date" },
    { "name": "combatReady",   "type": "boolean" }
  ]
}`;

export default function SchemasPage() {
  const customSchemas = useQueryStore((s) => s.customSchemas);
  const uploadSchema = useQueryStore((s) => s.uploadSchema);
  const deleteCustomSchema = useQueryStore((s) => s.deleteCustomSchema);
  const setSchema = useQueryStore((s) => s.setSchema);
  const { theme, toggleTheme } = useTheme();

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setSuccess(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = uploadSchema(text);
      if (result.success) {
        setSuccess("Schema uploaded successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error ?? "Upload failed");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(EXAMPLE_SCHEMA);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const allSchemas = [...SCHEMAS, ...customSchemas];

  return (
    <div className="schemas-page">
      {/* Topbar */}
      <div className="schemas-topbar">
        <div className="schemas-topbar__left">
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <KweriLogoMark size={26} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Kweri
            </span>
          </Link>
          <div className="schemas-topbar__divider" />
          <span className="schemas-topbar__title">Schema Manager</span>
        </div>

        <div className="schemas-topbar__right">
          <Link href="/builder">
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                height: 32,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-elevated)",
                color: "var(--color-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={13} />
              Back to builder
            </button>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-secondary)",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      <div className="schemas-body">
        {/* ── ALL SCHEMAS TABLE ── */}
        <div>
          <div className="schemas-section-head">
            <span className="schemas-section-title">All schemas</span>
            <span className="schemas-section-count">
              {allSchemas.length} total
            </span>
          </div>

          <table className="schemas-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Name</th>
                <th style={{ width: "8%" }}>Fields</th>
                <th>Field preview</th>
                <th style={{ width: "12%" }}>Type</th>
                <th style={{ width: "130px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allSchemas.map((schema) => {
                const isBuiltin = SCHEMAS.some((s) => s.name === schema.name);
                const isExpanded = expandedRow === schema.name;
                return (
                  <Fragment key={schema.name}>
                    <tr>
                      <td>
                        <div className="schema-row__name">
                          <span className="schema-row__emoji">
                            {BUILTIN_EMOJI[schema.name] ?? "📋"}
                          </span>
                          <span className="schema-row__label">
                            {schema.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            color: "var(--color-secondary)",
                          }}
                        >
                          {schema.fields.length}
                        </span>
                      </td>
                      <td>
                        <FieldsPreview schema={schema} maxShow={4} />
                      </td>
                      <td>
                        <span
                          className={`schema-row__badge ${isBuiltin ? "schema-row__badge--builtin" : "schema-row__badge--custom"}`}
                        >
                          {isBuiltin ? "Built-in" : "Custom"}
                        </span>
                      </td>
                      <td>
                        <div className="schema-row__actions">
                          {/* Expand fields */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : schema.name)
                            }
                            title="View all fields"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              border: "1px solid var(--color-border)",
                              background: "var(--color-elevated)",
                              color: "var(--color-secondary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                          </button>

                          {/* Use in builder */}
                          <Link href="/builder">
                            <button
                              type="button"
                              onClick={() => setSchema(schema.name)}
                              title="Use in builder"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "0 10px",
                                height: 28,
                                borderRadius: 7,
                                border: "1px solid var(--color-border)",
                                background: "var(--color-elevated)",
                                color: "var(--color-secondary)",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Database size={11} />
                              Use
                            </button>
                          </Link>

                          {/* Delete — only for custom */}
                          {!isBuiltin && (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(schema.name)}
                              title="Delete schema"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: "1px solid transparent",
                                background: "transparent",
                                color: "var(--color-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(229,62,62,0.08)";
                                e.currentTarget.style.color =
                                  "var(--color-error)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color =
                                  "var(--color-muted)";
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded fields row */}
                    {isExpanded && (
                      <tr key={`${schema.name}-expanded`}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <ExpandedFields schema={schema} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── UPLOAD SECTION ── */}
        <div>
          <div className="schemas-section-head">
            <span className="schemas-section-title">Upload custom schema</span>
          </div>

          {/* Error / success feedback */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 12,
                background: "rgba(229,62,62,0.06)",
                border: "1px solid rgba(229,62,62,0.2)",
                fontSize: 13,
                color: "var(--color-error)",
              }}
            >
              ! {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 12,
                background: "rgba(76,175,80,0.06)",
                border: "1px solid rgba(76,175,80,0.2)",
                fontSize: 13,
                color: "var(--color-success)",
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`upload-area ${isDragging ? "upload-area--drag" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-area__icon">
              <Upload size={20} />
            </div>
            <div className="upload-area__title">
              Drop a schema JSON file here
            </div>
            <div className="upload-area__desc">
              Upload a JSON file defining your schema — field names, types, and
              optional enum values. Existing schemas with the same name will be
              replaced.
            </div>
            <span className="upload-area__format">.json</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>

        {/* ── FORMAT REFERENCE ── */}
        <div>
          <div className="schemas-section-head">
            <span className="schemas-section-title">Schema JSON format</span>
          </div>
          <div className="format-example">
            <div className="format-example__header">
              <span className="format-example__label">
                Example - starships schema
              </span>
              <button
                type="button"
                onClick={handleCopyExample}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  color: "var(--color-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                {copiedExample ? (
                  <Check size={12} color="var(--color-success)" />
                ) : (
                  <Copy size={12} />
                )}
                {copiedExample ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="format-example__code">{EXAMPLE_SCHEMA}</pre>
          </div>

          {/* Field types reference */}
          <div
            style={{
              marginTop: 12,
              padding: "14px 16px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--color-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginRight: 4,
              }}
            >
              Valid types:
            </span>
            {["string", "number", "boolean", "date", "enum"].map((t) => (
              <span key={t} className={`field-pill`}>
                <span className={`field-pill__type field-pill__type--${t}`}>
                  {t}
                </span>
              </span>
            ))}
            <span
              style={{
                fontSize: 11,
                color: "var(--color-muted)",
                marginLeft: 4,
              }}
            >
              ·{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                enumValues
              </code>{" "}
              required for enum fields
            </span>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <ConfirmDelete
          name={confirmDelete}
          onConfirm={() => {
            deleteCustomSchema(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
