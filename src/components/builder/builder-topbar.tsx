"use client";

import { Download, Moon, RotateCcw, Sun, Upload } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { useQueryStore } from "@/store/query-store";
import { SchemaSelector } from "./schema-selector";
import "./builder.css";

export function BuilderTopbar() {
  const { resetQuery, exportJSON, importJSON, pushHistory } = useQueryStore();
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kweri-query.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importJSON(text);
      if (!result.success) alert(`Import failed: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="builder-topbar">
      {/* Left */}
      <div className="builder-topbar__left">
        <Link href="/" className="builder-topbar__logo">
          <div className="builder-topbar__logo-icon">
            <span>K</span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Kweri
          </span>
        </Link>

        <div className="builder-topbar__divider" />
        <SchemaSelector />
      </div>

      {/* Right */}
      <div className="builder-topbar__right">
        {/* Save to history */}
        <button
          type="button"
          className="bdr-btn bdr-btn--secondary"
          onClick={() => pushHistory()}
          title="Save to history"
        >
          Save
        </button>

        {/* Export */}
        <button
          type="button"
          className="icon-btn"
          onClick={handleExport}
          title="Export query as JSON"
        >
          <Download size={14} />
        </button>

        {/* Import */}
        <button
          type="button"
          className="icon-btn"
          onClick={() => fileRef.current?.click()}
          title="Import query from JSON"
        >
          <Upload size={14} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImport}
        />

        {/* Reset */}
        <button
          type="button"
          className="icon-btn"
          onClick={resetQuery}
          title="Reset query"
        >
          <RotateCcw size={14} />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );
}
