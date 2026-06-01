"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { memo, useCallback } from "react";
import type {
  QueryRule as QueryRuleType,
  Schema,
  ValidationError,
} from "@/lib/query-engine/types";
import {
  OPERATOR_DEFINITIONS,
  OPERATORS_BY_TYPE,
} from "@/lib/query-engine/types";
import { getNodeError } from "@/lib/query-engine/validator";
import { useQueryStore } from "@/store/query-store";
import "./builder.css";

interface Props {
  rule: QueryRuleType;
  schema: Schema;
  errors: ValidationError[];
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
  errors,
  groupId: _groupId,
}: Props) {
  const { updateRule, removeNode } = useQueryStore();
  const error = getNodeError(errors, rule.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const field = schema.fields.find((f) => f.name === rule.field);
  const fieldType = field?.type ?? "string";
  const availableOperators = OPERATORS_BY_TYPE[fieldType];
  const opDef = OPERATOR_DEFINITIONS[rule.operator];

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newField = e.target.value;
      const newFieldDef = schema.fields.find((f) => f.name === newField);
      if (!newFieldDef) return;
      // pick first valid operator for new type
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

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateRule(rule.id, { value: e.target.value });
    },
    [rule.id, updateRule],
  );

  const handleValueToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateRule(rule.id, { valueTo: e.target.value });
    },
    [rule.id, updateRule],
  );

  const renderValueInput = () => {
    if (!opDef || opDef.arity === 0) return null;

    // Enum field with equals/not_equals → dropdown
    if (
      fieldType === "enum" &&
      (rule.operator === "equals" || rule.operator === "not_equals") &&
      field?.enumValues
    ) {
      return (
        <select
          className={`query-rule__select ${error ? "query-rule__input--error" : ""}`}
          value={rule.value ?? ""}
          onChange={handleValueChange}
        >
          <option value="">Select value…</option>
          {field.enumValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    }

    // Boolean field → dropdown
    if (fieldType === "boolean" && rule.operator === "equals") {
      return (
        <select
          className={`query-rule__select ${error ? "query-rule__input--error" : ""}`}
          value={rule.value ?? ""}
          onChange={handleValueChange}
        >
          <option value="">Select…</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    // Date field → date input
    if (
      fieldType === "date" ||
      ["before", "after", "on_date"].includes(rule.operator)
    ) {
      if (opDef.arity === 2) {
        return (
          <>
            <input
              type="date"
              className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
              value={rule.value ?? ""}
              onChange={handleValueChange}
              style={{ minWidth: 130 }}
            />
            <span className="query-rule__between-sep">and</span>
            <input
              type="date"
              className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
              value={rule.valueTo ?? ""}
              onChange={handleValueToChange}
              style={{ minWidth: 130 }}
            />
          </>
        );
      }
      return (
        <input
          type="date"
          className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
          value={rule.value ?? ""}
          onChange={handleValueChange}
        />
      );
    }

    // Number between
    if (fieldType === "number" && opDef.arity === 2) {
      return (
        <>
          <input
            type="number"
            className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
            placeholder="from"
            value={rule.value ?? ""}
            onChange={handleValueChange}
            style={{ minWidth: 80 }}
          />
          <span className="query-rule__between-sep">and</span>
          <input
            type="number"
            className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
            placeholder="to"
            value={rule.valueTo ?? ""}
            onChange={handleValueToChange}
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
          className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
          placeholder="value"
          value={rule.value ?? ""}
          onChange={handleValueChange}
        />
      );
    }

    // in_array / not_in_array — comma hint
    if (rule.operator === "in_array" || rule.operator === "not_in_array") {
      return (
        <input
          type="text"
          className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
          placeholder="val1, val2, val3"
          value={rule.value ?? ""}
          onChange={handleValueChange}
        />
      );
    }

    // regex
    if (rule.operator === "regex") {
      return (
        <input
          type="text"
          className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
          placeholder="^regex.*pattern$"
          value={rule.value ?? ""}
          onChange={handleValueChange}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
        />
      );
    }

    // default string
    return (
      <input
        type="text"
        className={`query-rule__input ${error ? "query-rule__input--error" : ""}`}
        placeholder="value"
        value={rule.value ?? ""}
        onChange={handleValueChange}
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`query-rule ${error ? "query-rule--error" : ""} ${isDragging ? "query-rule--dragging" : ""}`}
    >
      {/* Drag handle */}
      <div className="query-rule__drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>

      {/* Fields */}
      <div className="query-rule__fields">
        {/* Field selector */}
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

        {/* Field type badge */}
        {field && <FieldTypeBadge type={fieldType} />}

        {/* Operator selector */}
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

        {/* Value input(s) */}
        {renderValueInput()}
      </div>

      {/* Remove button */}
      <button
        type="button"
        className="query-rule__remove"
        onClick={() => removeNode(rule.id)}
        aria-label="Remove condition"
      >
        <X size={13} />
      </button>

      {/* Inline error */}
      {error && <span className="query-rule__error-msg">{error}</span>}
    </div>
  );
});
