"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { memo, useCallback } from "react";
import type {
  QueryRule as QueryRuleType,
  Schema,
} from "@/lib/query-engine/types";
import {
  OPERATOR_DEFINITIONS,
  OPERATORS_BY_TYPE,
} from "@/lib/query-engine/types";
import { useQueryStore } from "@/store/query-store";
import "./builder.css";

interface Props {
  rule: QueryRuleType;
  schema: Schema;
  errorMap: Record<string, string>;
  groupId: string;
}

function FieldTypeBadge({ type }: { type: string }) {
  return (
    <span className={`field-type-badge field-type-badge--${type}`}>{type}</span>
  );
}

export const QueryRule = memo(function QueryRule({
  rule,
  schema,
  errorMap,
}: Props) {
  const updateRule = useQueryStore((s) => s.updateRule);
  const removeNode = useQueryStore((s) => s.removeNode);
  const error = errorMap[rule.id] ?? null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const field = schema.fields.find((f) => f.name === rule.field);
  const fieldType = field?.type ?? "string";
  const availableOperators = OPERATORS_BY_TYPE[fieldType];
  const opDef = OPERATOR_DEFINITIONS[rule.operator];

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newField = e.target.value;
      const newFieldDef = schema.fields.find((f) => f.name === newField);
      if (!newFieldDef) return;
      const firstOp = OPERATORS_BY_TYPE[newFieldDef.type][0];
      updateRule(rule.id, {
        field: newField,
        operator: firstOp,
        value: "",
        valueTo: "",
      });
    },
    [rule.id, schema, updateRule],
  );

  const handleOperatorChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateRule(rule.id, { operator: e.target.value as typeof rule.operator });
    },
    [rule.id, updateRule],
  );

  const handleValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      updateRule(rule.id, { value: e.target.value }),
    [rule.id, updateRule],
  );

  const handleValueTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      updateRule(rule.id, { valueTo: e.target.value }),
    [rule.id, updateRule],
  );

  const renderValue = () => {
    if (!opDef || opDef.arity === 0) return null;

    const errClass = error ? "query-rule__input--error" : "";

    // Enum dropdown
    if (
      fieldType === "enum" &&
      (rule.operator === "equals" || rule.operator === "not_equals") &&
      field?.enumValues
    ) {
      return (
        <select
          className={`query-rule__select ${errClass}`}
          value={rule.value ?? ""}
          onChange={handleValue}
        >
          <option value="">Select…</option>
          {field.enumValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    }

    // Boolean dropdown
    if (fieldType === "boolean" && rule.operator === "equals") {
      return (
        <select
          className={`query-rule__select ${errClass}`}
          value={rule.value ?? ""}
          onChange={handleValue}
        >
          <option value="">Select…</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    // Date range (between)
    if (opDef.arity === 2 && fieldType === "date") {
      return (
        <>
          <input
            type="date"
            className={`query-rule__input ${errClass}`}
            value={rule.value ?? ""}
            onChange={handleValue}
            style={{ minWidth: 130 }}
          />
          <span className="query-rule__between-sep">and</span>
          <input
            type="date"
            className={`query-rule__input ${errClass}`}
            value={rule.valueTo ?? ""}
            onChange={handleValueTo}
            style={{ minWidth: 130 }}
          />
        </>
      );
    }

    // Date single
    if (
      fieldType === "date" ||
      ["before", "after", "on_date"].includes(rule.operator)
    ) {
      return (
        <input
          type="date"
          className={`query-rule__input ${errClass}`}
          value={rule.value ?? ""}
          onChange={handleValue}
        />
      );
    }

    // Number range (between)
    if (opDef.arity === 2 && fieldType === "number") {
      return (
        <>
          <input
            type="number"
            className={`query-rule__input ${errClass}`}
            placeholder="from"
            value={rule.value ?? ""}
            onChange={handleValue}
            style={{ minWidth: 80 }}
          />
          <span className="query-rule__between-sep">and</span>
          <input
            type="number"
            className={`query-rule__input ${errClass}`}
            placeholder="to"
            value={rule.valueTo ?? ""}
            onChange={handleValueTo}
            style={{ minWidth: 80 }}
          />
        </>
      );
    }

    // Number single
    if (fieldType === "number") {
      return (
        <input
          type="number"
          className={`query-rule__input ${errClass}`}
          placeholder="value"
          value={rule.value ?? ""}
          onChange={handleValue}
        />
      );
    }

    // Array operators
    if (rule.operator === "in_array" || rule.operator === "not_in_array") {
      return (
        <input
          type="text"
          className={`query-rule__input ${errClass}`}
          placeholder="val1, val2, val3"
          value={rule.value ?? ""}
          onChange={handleValue}
        />
      );
    }

    // Regex
    if (rule.operator === "regex") {
      return (
        <input
          type="text"
          className={`query-rule__input ${errClass}`}
          placeholder="^regex.*"
          value={rule.value ?? ""}
          onChange={handleValue}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
        />
      );
    }

    // Default string
    return (
      <input
        type="text"
        className={`query-rule__input ${errClass}`}
        placeholder="value"
        value={rule.value ?? ""}
        onChange={handleValue}
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`query-rule ${error ? "query-rule--error" : ""} ${isDragging ? "query-rule--dragging" : ""}`}
    >
      <div className="query-rule__drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>

      <div className="query-rule__fields">
        <select
          className="query-rule__select query-rule__select--field"
          value={rule.field}
          onChange={handleFieldChange}
        >
          {!rule.field && <option value="">Select field…</option>}
          {schema.fields.map((f) => (
            <option key={f.name} value={f.name}>
              {f.label ?? f.name}
            </option>
          ))}
        </select>

        {field && <FieldTypeBadge type={fieldType} />}

        <select
          className="query-rule__select query-rule__select--operator"
          value={rule.operator}
          onChange={handleOperatorChange}
        >
          {availableOperators.map((op) => (
            <option key={op} value={op}>
              {OPERATOR_DEFINITIONS[op].label}
            </option>
          ))}
        </select>

        {renderValue()}
      </div>

      <button
        type="button"
        className="query-rule__remove"
        onClick={() => removeNode(rule.id)}
        aria-label="Remove condition"
      >
        <X size={13} />
      </button>

      {error && <span className="query-rule__error-msg">{error}</span>}
    </div>
  );
});
