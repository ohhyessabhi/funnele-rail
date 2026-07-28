import { useEffect, useRef, useState } from "react";
import useAppStore from "../store/appStore";
import { STATUSES, PRIORITIES } from "../lib/constants";
import { commentTime, shortDate } from "../lib/utils";
import { updateTask, deleteTask } from "../lib/api";
import { useComments } from "../hooks/useComments";
import { useWorkLog } from "../hooks/useWorkLog";
import { StatusModal } from "./StatusModal";
import { ConfirmModal } from "./ConfirmModal";


export function Drawer() {
  const task = useAppStore((s) =>
    s.tasks.find((t) => t.id === s.selectedTaskId)
  );
  const isAdmin = useAppStore((s) => s.isAdmin);
  const user = useAppStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const members = useAppStore((s) => s.members);
  const memberName = useAppStore((s) => s.memberName);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const showToast = useAppStore((s) => s.showToast);

  const open = Boolean(task);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);

  const { comments, addComment } = useComments(task?.id);
  const { logs, deliverables, totalMinutes, refetch: refetchWorkLog } =
    useWorkLog(task?.id);

  // Sync local form state whenever the selected task changes.
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow the title textarea.
  useEffect(() => {
    const ta = titleRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [title, task?.id]);

  const save = async (updates, revert) => {
    try {
      await updateTask(task.id, updates);
    } catch (e) {
      if (revert) revert();
      showToast(e.message, true);
    }
  };

  const close = () => setSelectedTask(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      setConfirmDelete(false);
      close();
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setDeleting(false);
    }
  };

  const postComment = async () => {
    if (!commentBody.trim()) return;
    try {
      await addComment(commentBody);
      setCommentBody("");
    } catch (e) {
      showToast(e.message, true);
    }
  };

  return (
    <>
    <aside className={`drawer ${open ? "open" : ""}`}>
      {task && (
        <>
          <div className="drawer-h">
            <span className="id">{task.id.slice(0, 8).toUpperCase()}</span>
            {isAdmin && (
              <button className="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            )}
            <span className="x" onClick={close} role="button" aria-label="Close">
              ×
            </span>
          </div>

          <div className="drawer-b">
            <textarea
              ref={titleRef}
              className="dtitle"
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                const next = title.trim() || "Untitled";
                if (next !== task.title) save({ title: next });
              }}
            />

            <div className="fields">
              {isAdmin && (
                <>
                  <label>Client</label>
                  <select
                    value={task.project_id || ""}
                    onChange={(e) =>
                      save({ project_id: e.target.value || null })
                    }
                  >
                    <option value="">No client</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label>Status</label>
              <select
                value={task.status}
                onChange={(e) => setPendingStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {(isAdmin || task.assignee_id === user?.id) && (
                <>
                  <label>Owner</label>
                  <select
                    value={task.assignee_id || ""}
                    onChange={(e) =>
                      save({ assignee_id: e.target.value || null })
                    }
                  >
                    {isAdmin && <option value="">Unassigned</option>}
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label>Priority</label>
              <select
                value={task.priority}
                onChange={(e) => save({ priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label>Due</label>
              <input
                type="date"
                value={task.due_date || ""}
                onChange={(e) => save({ due_date: e.target.value || null })}
              />
            </div>

            <textarea
              className="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (task.notes || "")) save({ notes });
              }}
              placeholder="Add context, links, acceptance criteria"
            />

            <div className="sec">
              <div className="sec-h">
                Work log{" "}
                <span className="r">
                  {totalMinutes ? `${totalMinutes}m` : ""}
                </span>
              </div>
              {!logs.length && !deliverables.length && (
                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                  No time or reports logged yet — change the status to log some
                </div>
              )}
              {logs.map((l) => (
                <div className="cmt" key={l.id}>
                  <div className="h">
                    <span className="who">{memberName(l.member_id)}</span>
                    <span className="when">
                      {shortDate(l.logged_at)} · {l.minutes}m
                    </span>
                  </div>
                </div>
              ))}
              {deliverables.map((d) => (
                <div className="cmt" key={d.id}>
                  <div className="h">
                    <span className="who">Report</span>
                    <span className="when">
                      {commentTime(d.created_at)}
                    </span>
                  </div>
                  <div className="b">
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--accent)",
                          fontWeight: 600,
                          wordBreak: "break-all",
                        }}
                      >
                        {d.url}
                      </a>
                    )}
                    {d.note && (d.url ? " — " : "") + d.note}
                  </div>
                </div>
              ))}
            </div>

            <div className="sec">
              <div className="sec-h">
                Comments <span className="r">{comments.length || ""}</span>
              </div>
              <div className="cmt-form">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment"
                />
                <div className="r">
                  <button className="btn btn-primary btn-sm" onClick={postComment}>
                    Post
                  </button>
                </div>
              </div>
              {comments.map((c) => (
                <div className="cmt" key={c.id}>
                  <div className="h">
                    <span className="who">{memberName(c.author_id)}</span>
                    <span className="when">{commentTime(c.created_at)}</span>
                  </div>
                  <div className="b">{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
    {task && pendingStatus && (
      <StatusModal
        task={task}
        newStatus={pendingStatus}
        onClose={() => setPendingStatus(null)}
        onSaved={refetchWorkLog}
      />
    )}
    {task && confirmDelete && (
      <ConfirmModal
        title="Delete this task?"
        body="This can’t be undone. Comments, time logs, and reports on this task will be deleted too."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    </>
  );
}
