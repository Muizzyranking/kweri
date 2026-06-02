"use client";

import {
  Database,
  Download,
  FilePlus,
  Keyboard,
  Moon,
  RotateCcw,
  Sun,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KweriLogoMark } from "@/components/ui/logo";
import { useTheme } from "@/components/ui/theme-provider";
import { useQueryStore } from "@/store/query-store";
import { SchemaSelector } from "./schema-selector";
import "./builder.css";

export function BuilderTopbar() {
  const {
    root,
    resetQuery,
    exportJSON,
    importJSON,
    pushHistory,
    addRule,
    addGroup,
    setPreviewFormat,
  } = useQueryStore();
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleExport = useCallback(() => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kweri-query.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON]);

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

  const handleNewQuery = useCallback(() => {
    pushHistory();
    resetQuery();
  }, [pushHistory, resetQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const usesCtrl = event.ctrlKey && !event.metaKey;

      if (key === "escape") {
        if (showShortcuts) setShowShortcuts(false);
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
        return;
      }

      if (!usesCtrl) return;

      if (key === "enter") {
        event.preventDefault();
        if (event.shiftKey) addGroup(root.id);
        else addRule(root.id);
        return;
      }

      if (event.shiftKey && (key === "/" || key === "?")) {
        event.preventDefault();
        setShowShortcuts((open) => !open);
        return;
      }

      if (!event.shiftKey && key === "s") {
        event.preventDefault();
        pushHistory();
        return;
      }

      if (event.shiftKey && key === "e") {
        event.preventDefault();
        handleExport();
        return;
      }

      if (event.shiftKey && key === "r") {
        event.preventDefault();
        resetQuery();
        return;
      }

      if (!event.shiftKey && key === "1") {
        event.preventDefault();
        setPreviewFormat("sql");
        return;
      }

      if (!event.shiftKey && key === "2") {
        event.preventDefault();
        setPreviewFormat("mongodb");
        return;
      }

      if (!event.shiftKey && key === "3") {
        event.preventDefault();
        setPreviewFormat("graphql");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    addGroup,
    addRule,
    handleExport,
    pushHistory,
    resetQuery,
    root.id,
    setPreviewFormat,
    showShortcuts,
  ]);

  const shortcutsDialog = showShortcuts ? (
    <div className="shortcut-overlay" role="presentation">
      <button
        type="button"
        className="shortcut-overlay__backdrop"
        onClick={() => setShowShortcuts(false)}
        aria-label="Close shortcuts"
      />
      <div className="shortcut-popover" role="dialog" aria-modal="true">
        <div className="shortcut-popover__header">
          <span>Keyboard shortcuts</span>
          <button
            type="button"
            className="icon-btn shortcut-popover__close"
            onClick={() => setShowShortcuts(false)}
            aria-label="Close shortcuts"
          >
            <X size={12} />
          </button>
        </div>
        <div className="shortcut-popover__list">
          {[
            ["Add condition to root group", ["Ctrl", "Enter"]],
            ["Add group to root group", ["Ctrl", "Shift", "Enter"]],
            ["Save query to history", ["Ctrl", "S"]],
            ["Export query as JSON", ["Ctrl", "Shift", "E"]],
            ["Reset query", ["Ctrl", "Shift", "R"]],
            ["Show shortcuts", ["Ctrl", "?"]],
            ["Preview SQL", ["Ctrl", "1"]],
            ["Preview MongoDB", ["Ctrl", "2"]],
            ["Preview GraphQL", ["Ctrl", "3"]],
            ["Blur active input", ["Esc"]],
          ].map(([label, keys]) => (
            <div key={label as string} className="shortcut-popover__row">
              <span>{label as string}</span>
              <span className="shortcut-popover__keys">
                {(keys as string[]).map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="builder-topbar">
        {/* Left */}
        <div className="builder-topbar__left">
          <Link href="/" className="builder-topbar__logo">
            <KweriLogoMark size={28} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-primary)",
                letterSpacing: "-0.02em",
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
          {/* New Query */}
          <button
            type="button"
            className="bdr-btn bdr-btn--secondary"
            onClick={handleNewQuery}
            title="Save current and start a new query"
            style={{ gap: 6 }}
          >
            <FilePlus size={13} />
            New query
          </button>

          {/* Schemas page */}
          <Link href="/schemas">
            <button type="button" className="icon-btn" title="Manage schemas">
              <Database size={14} />
            </button>
          </Link>

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

          <button
            type="button"
            className="icon-btn shortcut-trigger"
            onClick={() => setShowShortcuts((open) => !open)}
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard size={14} />
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

      {shortcutsDialog && typeof document !== "undefined"
        ? createPortal(shortcutsDialog, document.body)
        : null}
    </>
  );
}
