import { useState } from "react";

/**
 * Backlog step of the PM <-> team member workflow: the assignee hands a task
 * back to the PM without a status change when it's missing information they
 * need before they can confirm it's Ready.
 */
export function SendToPMModal({ pmName, onConfirm, onCancel }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    await onConfirm(note.trim());
  };

  return (
    <>
      <div className="scrim" onClick={busy ? undefined : onCancel} />
      <div className="modal">
        <div className="modal-h">
          <div className="k">Needs info</div>
          <h3>Send back to {pmName}</h3>
        </div>
        <div className="modal-b">
          <div className="fl">
            <label>What's missing? (optional)</label>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Need the client's brand guidelines before I can start"
            />
          </div>
        </div>
        <div className="modal-f">
          <span className="sp" />
          <button className="btn btn-sm" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={send} disabled={busy}>
            {busy ? "Sending…" : `Send to ${pmName}`}
          </button>
        </div>
      </div>
    </>
  );
}
