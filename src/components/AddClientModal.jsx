import { useState } from "react";
import useAppStore from "../store/appStore";
import { createProject } from "../lib/api";

export function AddClientModal({ onClose }) {
  const showToast = useAppStore((s) => s.showToast);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createProject(name);
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
          <div className="k">New client</div>
          <h3>Add a client</h3>
        </div>
        <div className="modal-b">
          <div className="fl">
            <label>Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="e.g. AllPrintHeads"
            />
          </div>
        </div>
        <div className="modal-f">
          <span className="sp" />
          <button className="btn btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={save}
            disabled={busy || !name.trim()}
          >
            {busy ? "Adding…" : "Add client"}
          </button>
        </div>
      </div>
    </>
  );
}
