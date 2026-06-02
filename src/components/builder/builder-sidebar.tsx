"use client";

import { Bookmark, Clock, Eye, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { generateHistoryName, useQueryStore } from "@/store/query-store";
import { QueryPreview } from "./query-preview";
import "./builder.css";

type Tab = "preview" | "history" | "presets";

export function BuilderSidebar() {
  const [tab, setTab] = useState<Tab>("preview");
  const [presetName, setPresetName] = useState("");
  const {
    schemaName,
    customSchemas,
    history,
    presets,
    restoreSnapshot,
    deleteHistory,
    savePreset,
    loadPreset,
    deletePreset,
    getSchemaByName,
  } = useQueryStore();
  const isCustomSchema = customSchemas.some((s) => s.name === schemaName);
  const visiblePresets = presets.filter(
    (p) => p.schemaName === schemaName || (!p.isPreset && isCustomSchema),
  );

  const tabStyle = (t: Tab) => ({
    flex: 1,
    height: 36,
    border: "none",
    background: tab === t ? "var(--color-elevated)" : "transparent",
    color: tab === t ? "var(--color-primary)" : "var(--color-secondary)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    transition: "all 0.15s",
    borderBottom:
      tab === t ? "2px solid var(--color-orange)" : "2px solid transparent",
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSnapshotTitle = (snap: (typeof history)[number]) => {
    const savedName = snap.name?.trim();
    if (savedName && savedName !== "Auto-saved before new query") {
      return savedName;
    }

    const schema = getSchemaByName(snap.schemaName);
    return schema
      ? generateHistoryName(snap.root, schema)
      : `All ${snap.schemaName}`;
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
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          style={tabStyle("preview")}
          onClick={() => setTab("preview")}
        >
          <Eye size={12} /> Preview
        </button>
        <button
          type="button"
          style={tabStyle("history")}
          onClick={() => setTab("history")}
        >
          <Clock size={12} /> History
          {history.length > 0 && (
            <span
              style={{
                background: "var(--color-orange)",
                color: "#fff",
                borderRadius: 99,
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {history.length}
            </span>
          )}
        </button>
        <button
          type="button"
          style={tabStyle("presets")}
          onClick={() => setTab("presets")}
        >
          <Bookmark size={12} /> Presets
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* PREVIEW TAB */}
        {tab === "preview" && <QueryPreview />}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: "var(--color-muted)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🕐</div>
                No history yet.
                <br />
                <span style={{ fontSize: 12 }}>
                  Click Save in the topbar to record a snapshot.
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      background: "var(--color-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--color-primary)",
                          }}
                        >
                          {getSnapshotTitle(snap)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-muted)",
                            marginTop: 2,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {snap.schemaName} · {formatDate(snap.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() => restoreSnapshot(snap.id)}
                          title="Restore"
                        >
                          <RotateCcw size={11} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() => deleteHistory(snap.id)}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRESETS TAB */}
        {tab === "presets" && (
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Save current as preset */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 12px",
                background: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
              }}
            >
              <input
                type="text"
                placeholder="Preset name…"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && presetName.trim()) {
                    savePreset(presetName.trim());
                    setPresetName("");
                  }
                }}
                style={{
                  flex: 1,
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  fontSize: 12,
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                className="bdr-btn bdr-btn--primary"
                style={{ height: 30, fontSize: 12, padding: "0 10px" }}
                onClick={() => {
                  if (presetName.trim()) {
                    savePreset(presetName.trim());
                    setPresetName("");
                  }
                }}
              >
                Save
              </button>
            </div>

            {/* Preset list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {visiblePresets.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "var(--color-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        marginTop: 2,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.schemaName}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className="bdr-btn bdr-btn--secondary"
                      style={{ height: 26, fontSize: 11, padding: "0 8px" }}
                      onClick={() => loadPreset(p.id)}
                    >
                      Load
                    </button>
                    {!p.id.startsWith("preset-") && (
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() => deletePreset(p.id)}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
