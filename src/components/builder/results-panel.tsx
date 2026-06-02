"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { getDataBySchema } from "@/lib/mock-data";
import { executeQuery } from "@/lib/query-engine/executor";
import type { FieldType } from "@/lib/query-engine/types";
import { validateQuery } from "@/lib/query-engine/validator";
import { SCHEMAS } from "@/lib/schemas";
import { useQueryStore } from "@/store/query-store";
import "./results.css";

const PAGE_SIZE = 15;

type SortDir = "asc" | "desc";

export function ResultsPanel() {
  const root = useQueryStore((s) => s.root);
  const schemaName = useQueryStore((s) => s.schemaName);
  const customSchemas = useQueryStore((s) => s.customSchemas);
  const schema = useQueryStore((s) => s.getSchema());

  const isCustomSchema = customSchemas.some((s) => s.name === schemaName);
  const isBuiltinSchema = SCHEMAS.some((s) => s.name === schemaName);

  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { valid } = useMemo(() => validateQuery(root, schema), [root, schema]);

  // Run query — simulated async for loading state feel
  const [results, setResults] = useState<{
    rows: Record<string, unknown>[];
    total: number;
    matched: number;
    executionTimeMs: number;
  } | null>(null);

  const handleRun = useCallback(() => {
    setLoading(true);
    setHasRun(true);
    setPage(1);

    // Simulate a tiny async delay for realism
    setTimeout(() => {
      const data = getDataBySchema(schemaName);
      const result = executeQuery(data, root, schema, {
        page: 1,
        pageSize: PAGE_SIZE,
        sortField,
        sortDirection: sortDir,
      });
      setResults(result);
      setLoading(false);
    }, 280);
  }, [root, schema, schemaName, sortField, sortDir]);

  // Re-paginate/sort from already-filtered set
  const pagedResults = useMemo(() => {
    if (!results) return null;
    const data = getDataBySchema(schemaName);
    return executeQuery(data, root, schema, {
      page,
      pageSize: PAGE_SIZE,
      sortField,
      sortDirection: sortDir,
    });
  }, [results, page, sortField, sortDir, root, schema, schemaName]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const totalPages = pagedResults
    ? Math.max(1, Math.ceil(pagedResults.matched / PAGE_SIZE))
    : 1;

  const getFieldType = (fieldName: string): FieldType => {
    return schema.fields.find((f) => f.name === fieldName)?.type ?? "string";
  };

  const formatCell = (value: unknown, type: FieldType): React.ReactNode => {
    if (value === null || value === undefined) {
      return (
        <span style={{ color: "var(--color-muted)", fontStyle: "italic" }}>
          null
        </span>
      );
    }
    if (type === "boolean") {
      return <span className="cell--boolean">{String(value)}</span>;
    }
    if (type === "number") {
      return <span className="cell--number">{String(value)}</span>;
    }
    if (type === "date") {
      return <span className="cell--date">{String(value)}</span>;
    }
    if (type === "enum") {
      return <span className="cell--enum">{String(value)}</span>;
    }
    return String(value);
  };

  return (
    <div className="results-panel">
      {/* Toolbar */}
      <div className="results-panel__toolbar">
        <div className="results-panel__meta">
          {pagedResults && (
            <>
              <div className="results-panel__stat">
                <span className="results-panel__stat-value">
                  {pagedResults.matched}
                </span>
                <span className="results-panel__stat-label">matched</span>
              </div>
              <div className="results-panel__stat-divider" />
              <div className="results-panel__stat">
                <span className="results-panel__stat-value">
                  {pagedResults.total}
                </span>
                <span className="results-panel__stat-label">total</span>
              </div>
              <div className="results-panel__stat-divider" />
              <div className="results-panel__stat">
                <span className="results-panel__stat-value">
                  {pagedResults.executionTimeMs}ms
                </span>
              </div>
            </>
          )}
        </div>

        <div className="results-panel__controls">
          {/* Sort field */}
          {hasRun && pagedResults && pagedResults.matched > 0 && (
            <select
              className="results-panel__sort-select"
              value={sortField ?? ""}
              onChange={(e) => {
                setSortField(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">No sort</option>
              {schema.fields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label ?? f.name}
                </option>
              ))}
            </select>
          )}

          {/* Run button */}
          <button
            type="button"
            className="run-bar__btn"
            onClick={handleRun}
            disabled={loading || !valid || isCustomSchema}
            title={
              isCustomSchema
                ? "Preview is available for custom schemas; mock execution is built-ins only"
                : !valid
                  ? "Fix validation errors first"
                  : "Run query"
            }
          >
            <Play size={13} fill="currentColor" />
            {loading ? "Running…" : "Run query"}
          </button>
        </div>
      </div>

      {/* Body */}
      {/* Custom schema — no execution backend */}
      {isCustomSchema && !isBuiltinSchema && (
        <div className="results-empty results-empty--custom">
          <div className="results-empty__icon">🔌</div>
          <div className="results-empty__title">Preview-only schema</div>
          <div className="results-empty__desc">
            Uploaded schemas update the builder fields and SQL, MongoDB, and
            GraphQL preview. Mock result execution is available for built-in
            sci-fi datasets only.
          </div>
          <Link href="/schemas" style={{ textDecoration: "none" }}>
            <button
              type="button"
              className="results-empty__action"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Manage schemas
            </button>
          </Link>
        </div>
      )}

      {!isCustomSchema && !hasRun && (
        <div className="results-empty" style={{ flex: 1 }}>
          <div className="results-empty__icon">▷</div>
          <div className="results-empty__title">Ready to run</div>
          <div className="results-empty__desc">
            Build your filter above, then run it against the built-in sci-fi
            dataset.
          </div>
        </div>
      )}

      {!isCustomSchema && hasRun && loading && (
        <div className="results-loading" style={{ flex: 1 }}>
          <div className="results-loading__spinner" />
          Executing query…
        </div>
      )}

      {!isCustomSchema &&
        hasRun &&
        !loading &&
        pagedResults &&
        pagedResults.matched === 0 && (
          <div className="results-empty" style={{ flex: 1 }}>
            <div className="results-empty__icon">🔍</div>
            <div className="results-empty__title">No results</div>
            <div className="results-empty__desc">
              No rows matched your query. Try relaxing your conditions.
            </div>
          </div>
        )}

      {!isCustomSchema &&
        hasRun &&
        !loading &&
        pagedResults &&
        pagedResults.matched > 0 && (
          <>
            {/* Table */}
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    {schema.fields.map((f) => (
                      <th
                        key={f.name}
                        className={sortField === f.name ? "sorted" : ""}
                        onClick={() => handleSort(f.name)}
                      >
                        {f.label ?? f.name}
                        {sortField === f.name ? (
                          <span className="sort-indicator">
                            {sortDir === "asc" ? (
                              <ArrowUp size={9} />
                            ) : (
                              <ArrowDown size={9} />
                            )}
                          </span>
                        ) : (
                          <span
                            className="sort-indicator"
                            style={{ opacity: 0.2 }}
                          >
                            ↕
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedResults.rows.map((row, i) => (
                    <tr key={`${row.id ?? i}`}>
                      {schema.fields.map((f) => (
                        <td key={f.name}>
                          {formatCell(row[f.name], getFieldType(f.name))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="results-pagination">
              <span className="results-pagination__info">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, pagedResults.matched)} of{" "}
                {pagedResults.matched}
              </span>
              <div className="results-pagination__controls">
                <button
                  type="button"
                  className="results-pagination__btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft size={12} />
                </button>
                <button
                  type="button"
                  className="results-pagination__btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="results-pagination__page">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="results-pagination__btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={12} />
                </button>
                <button
                  type="button"
                  className="results-pagination__btn"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight size={12} />
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
