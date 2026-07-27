/** Small reusable yes/no modal — replaces native window.confirm(), which is
 * fragile (silently blocked in some browser/extension contexts). */
export function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <>
      <div className="scrim" onClick={busy ? undefined : onCancel} />
      <div className="modal">
        <div className="modal-h">
          <h3>{title}</h3>
        </div>
        {body && (
          <div className="modal-b">
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              {body}
            </p>
          </div>
        )}
        <div className="modal-f">
          <span className="sp" />
          <button className="btn btn-sm" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`btn btn-sm ${danger ? "" : "btn-primary"}`}
            style={danger ? { background: "var(--alert)", color: "#fff" } : undefined}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
