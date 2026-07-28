import { useState } from "react";
import useAppStore from "../store/appStore";
import { updateTask, addTimeLog, addDeliverable } from "../lib/api";
import { findPM } from "../lib/utils";

/**
 * Prompt shown on every status change: log time spent + attach a report
 * (link + note). Confirming applies the status change and writes the work log;
 * cancelling reverts (the drawer's <select> is controlled by the task's real
 * status, so nothing changes on cancel).
 *
 * Moving a task to Client Review also auto-reassigns it to the org's PM —
 * part of the Backlog -> Ready -> In Progress -> Client Review -> Approved
 * workflow, so the PM doesn't have to be handed off to manually.
 */
export function StatusModal({ task, newStatus, onClose, onSaved }) {
  const showToast = useAppStore((s) => s.showToast);
  const members = useAppStore((s) => s.members);
  const [minutes, setMinutes] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const pm = findPM(members);
  const willHandOffToPM =
    newStatus === "Client Review" && pm && pm.id !== task.assignee_id;

  const bump = (m) =>
    setMinutes((v) => String(Math.round((parseFloat(v) || 0) + m)));

  const save = async () => {
    setBusy(true);
    try {
      const patch = { status: newStatus };
      if (willHandOffToPM) patch.assignee_id = pm.id;
      await updateTask(task.id, patch);
      const mins = Math.round(parseFloat(minutes) || 0);
      if (mins > 0) await addTimeLog(task.id, mins);
      if (url.trim() || note.trim())
        await addDeliverable(task.id, url.trim(), note.trim());
      onSaved?.();
      onClose();
    } catch (e) {
      showToast(e.message, true);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={busy ? undefined : onClose} />
      <div className="modal">
        <div className="modal-h">
          <div className="k">Update status</div>
          <h3>
            Move to <span className="pill">{newStatus}</span>
          </h3>
        </div>
        <div className="modal-b">
          {willHandOffToPM && (
            <div
              style={{
                fontSize: 12,
                color: "var(--accent-dark)",
                background: "var(--accent-light)",
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 14,
              }}
            >
              This will also reassign the task to {pm.name} (PM) for review.
            </div>
          )}
          <div className="fl">
            <label>Time spent (minutes)</label>
            <input
              type="number"
              min="0"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="e.g. 90"
              autoFocus
            />
            <div className="hours-row">
              {[15, 30, 60, 120].map((m) => (
                <span key={m} className="hours-chip" onClick={() => bump(m)}>
                  +{m}m
                </span>
              ))}
            </div>
          </div>
          <div className="fl">
            <label>Report link</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/… (optional)"
            />
          </div>
          <div className="fl">
            <label>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you deliver? (optional)"
            />
          </div>
        </div>
        <div className="modal-f">
          <span className="sp" />
          <button className="btn btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save & update"}
          </button>
        </div>
      </div>
    </>
  );
}
