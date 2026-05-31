"use client";

import { useEffect, useState } from "react";
import "./landing.css";

type Step =
  | { kind: "group"; logic: "AND" | "OR"; depth: number }
  | { kind: "rule"; field: string; op: string; value: string; depth: number };

const STEPS: Step[] = [
  { kind: "group", logic: "AND", depth: 0 },
  { kind: "rule", field: "country", op: "=", value: "Nigeria", depth: 1 },
  { kind: "rule", field: "age", op: ">", value: "18", depth: 1 },
  { kind: "group", logic: "OR", depth: 1 },
  { kind: "rule", field: "status", op: "=", value: "active", depth: 2 },
  { kind: "rule", field: "purchases", op: ">", value: "10", depth: 2 },
];

const FIELD_COLORS: Record<string, string> = {
  country: "var(--color-teal-bright)",
  age: "var(--color-orange)",
  status: "var(--color-success)",
  purchases: "var(--color-warning)",
};

const SQL_LINES = [
  { text: "SELECT * FROM users", color: "var(--color-orange)" },
  { text: "WHERE", color: "var(--color-muted)" },
  { text: '  country = "Nigeria"', color: "var(--color-primary)" },
  { text: "  AND age > 18", color: "var(--color-primary)" },
  { text: "  AND (", color: "var(--color-muted)" },
  { text: '    status = "active"', color: "var(--color-primary)" },
  { text: "    OR purchases > 10", color: "var(--color-primary)" },
  { text: "  )", color: "var(--color-muted)" },
];

const TOTAL_DURATION = STEPS.length * 600 + SQL_LINES.length * 180 + 3000;

export function HeroDemo() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [sqlLines, setSqlLines] = useState(0);
  const [tick, setTick] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is intentionally used as a reset trigger
  useEffect(() => {
    setVisibleSteps(0);
    setSqlLines(0);

    let stepCount = 0;
    const stepInterval = setInterval(() => {
      stepCount++;
      setVisibleSteps(stepCount);
      if (stepCount >= STEPS.length) clearInterval(stepInterval);
    }, 600);

    return () => clearInterval(stepInterval);
  }, [tick]);

  useEffect(() => {
    if (visibleSteps < STEPS.length) return;
    let lineCount = 0;
    const lineInterval = setInterval(() => {
      lineCount++;
      setSqlLines(lineCount);
      if (lineCount >= SQL_LINES.length) clearInterval(lineInterval);
    }, 180);
    return () => clearInterval(lineInterval);
  }, [visibleSteps]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is intentionally used as a reset trigger
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), TOTAL_DURATION);
    return () => clearTimeout(t);
  }, [tick]);

  return (
    <div className="demo">
      {/* Builder panel */}
      <div className="demo__panel">
        <div className="demo__panel-header">
          <span className="demo__panel-label">Query Builder</span>
          <div className="demo__dots">
            <div className="demo__dot demo__dot--red" />
            <div className="demo__dot demo__dot--yellow" />
            <div className="demo__dot demo__dot--green" />
          </div>
        </div>

        <div className="demo__rules">
          {STEPS.map((step, i) => {
            const key = `${step.kind}-${step.depth}-${i}`;
            const visible = i < visibleSteps;
            const indent = step.depth * 18;

            if (step.kind === "group") {
              return (
                <div
                  key={key}
                  className={`demo__rule ${!visible ? "demo__rule--hidden" : ""}`}
                  style={{ paddingLeft: indent }}
                >
                  <span
                    className={`demo__group-badge demo__group-badge--${step.logic.toLowerCase()}`}
                  >
                    {step.logic}
                  </span>
                  <div className="demo__divider" />
                </div>
              );
            }

            return (
              <div
                key={key}
                className={`demo__rule ${!visible ? "demo__rule--hidden" : ""}`}
                style={{ paddingLeft: indent }}
              >
                {step.depth > 0 && <div className="demo__rule-connector" />}
                <div className="demo__rule-chip">
                  <span
                    style={{
                      color: FIELD_COLORS[step.field] ?? "var(--color-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {step.field}
                  </span>
                  <span style={{ color: "var(--color-muted)" }}>{step.op}</span>
                  <span
                    style={{
                      color: "var(--color-primary)",
                      background: "var(--color-bg)",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    &quot;{step.value}&quot;
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {visibleSteps < STEPS.length && (
          <div className="demo__typing" style={{ marginTop: 10 }}>
            <div className="demo__typing-dot" />
            <span className="demo__typing-text">adding condition…</span>
          </div>
        )}
      </div>

      {/* SQL preview panel */}
      <div className="demo__panel">
        <div className="demo__panel-header">
          <span className="demo__panel-label">SQL Preview</span>
          <span className="demo__live-badge">● live</span>
        </div>

        <div className="demo__sql">
          {SQL_LINES.map((line, i) => (
            <div
              key={`${line.text}-${i}`}
              className={`demo__sql-line ${i >= sqlLines ? "demo__sql-line--hidden" : ""}`}
              style={{ color: line.color, whiteSpace: "pre" }}
            >
              {line.text}
            </div>
          ))}
          {visibleSteps >= STEPS.length && sqlLines < SQL_LINES.length && (
            <span className="demo__cursor" />
          )}
        </div>
      </div>
    </div>
  );
}
