import { useState } from "react";
import useAppStore from "../store/appStore";
import { acceptInboxItem, rejectInboxItem } from "../lib/api";

function InboxRow({ item }) {
  const projects = useAppStore((s) => s.projects);
  const showToast = useAppStore((s) => s.showToast);
  const [projectId, setProjectId] = useState(item.project_id || projects[0]?.id || "");
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      await acceptInboxItem(item.id, projectId);
    } catch (e) {
      showToast(e.message, true);
      setBusy(false);
    }
  };
  const reject = async () => {
    setBusy(true);
    try {
      await rejectInboxItem(item.id);
    } catch (e) {
      showToast(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="inbox-item">
      <div className="header">
        <span className="source">{item.source}</span>
        <span className="title">{item.title}</span>
      </div>
      {item.evidence && <div className="evidence">{item.evidence}</div>}
      <div className="actions">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={accept} disabled={busy}>
          Accept
        </button>
        <button className="btn btn-sm" onClick={reject} disabled={busy}>
          Reject
        </button>
      </div>
    </div>
  );
}

export function Inbox() {
  const inbox = useAppStore((s) => s.inbox);

  if (!inbox.length) {
    return (
      <div className="empty">
        <strong>Inbox clear</strong>
        <div className="hint">Incoming work from clients will appear here</div>
      </div>
    );
  }
  return inbox.map((item) => <InboxRow key={item.id} item={item} />);
}
