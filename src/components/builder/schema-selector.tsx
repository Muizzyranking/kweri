"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";
import { useQueryStore } from "@/store/query-store";
import "./builder.css";

const EMOJI: Record<string, string> = {
  users: "👤",
  orders: "📦",
  products: "🏷️",
};

export function SchemaSelector() {
  const schemaName = useQueryStore((s) => s.schemaName);
  const setSchema = useQueryStore((s) => s.setSchema);
  const getAllSchemas = useQueryStore((s) => s.getAllSchemas);
  const uploadSchema = useQueryStore((s) => s.uploadSchema);
  const fileRef = useRef<HTMLInputElement>(null);

  const allSchemas = getAllSchemas();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = uploadSchema(text);
      if (!result.success) alert(`Schema import failed: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="schema-selector">
      <span className="schema-selector__label">Schema</span>
      <select
        className="schema-selector__select"
        value={schemaName}
        onChange={(e) => setSchema(e.target.value)}
      >
        {allSchemas.map((s) => (
          <option key={s.name} value={s.name}>
            {EMOJI[s.name] ?? "📋"} {s.name}
          </option>
        ))}
      </select>

      {/* Upload custom schema */}
      <button
        type="button"
        className="icon-btn"
        onClick={() => fileRef.current?.click()}
        title="Upload custom schema (JSON)"
        style={{ width: 28, height: 28 }}
      >
        <Upload size={12} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleUpload}
      />
    </div>
  );
}
