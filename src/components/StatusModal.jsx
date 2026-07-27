import { useState } from "react";
import useAppStore from "../store/appStore";
import { updateTask, addTimeLog, addDeliverable } from "../lib/api";

/**
 * Prompt shown on every status change: log time spent + attach a report
 * (link + note). Confirming applies the status change and writes the work log;
 * cancelling reverts (the drawer's <select> is controlled by the task's real
 * status, so nothing changes on cancel).
 */
export function StatusModal({ task, newStatus, onClose, onSaved }) {
  const showToast = useAppStore((s) => s.showToast);
  const [hours, setHours] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const bump = (h) => setHours((v) => String(Math.round(((parseFloat(v) || 0) + h) * 100) / 100));

  const save = async () => {
    setBusy(true);
    try {
      await updateTask(task.id, { status: newStatus });
      const minutes = Math.round((parseFloat(hours) || 0) * 60);
      if (minutes > 0) await addTimeLog(task.id, minutes);
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
          <div className="fl">
            <label>Time spent (hours)</label>
            <input
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 1.5"
              autoFocus
            />
            <div className="hours-row">
              {[
                ["+30m", 0.5],
                ["+1h", 1],
                ["+2h", 2],
                ["+4h", 4],
              ].map(([label, h]) => (
                <span key={label} className="hours-chip" onClick={() => bump(h)}>
                  {label}
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
