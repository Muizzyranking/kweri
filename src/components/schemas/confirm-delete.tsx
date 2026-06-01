export function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__title">Delete schema?</div>
        <div className="confirm-dialog__desc">
          Are you sure you want to delete <strong>&ldquo;{name}&rdquo;</strong>?
          Any saved queries using this schema will still reference it by name.
          This cannot be undone.
        </div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-secondary)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-error)",
              background: "rgba(229,62,62,0.08)",
              color: "var(--color-error)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
