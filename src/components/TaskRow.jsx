import useAppStore from "../store/appStore";
import { PRIORITY_TAG, STALE_DAYS } from "../lib/constants";
import { ageDays, dueLabel, isClosed, spine } from "../lib/utils";
import { Avatar } from "./Avatar";

export function TaskRow({ task }) {
  const user = useAppStore((s) => s.user);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const memberName = useAppStore((s) => s.memberName);

  const closed = isClosed(task);
  const age = ageDays(task.status_at);
  const due = dueLabel(task.due_date);
  const pc =
    task.priority === "Urgent" ? "urg" : task.priority === "High" ? "high" : "";

  return (
    <div
      className={`row ${selectedTaskId === task.id ? "sel" : ""} ${
        closed ? "closed" : ""
      }`.trim()}
      onClick={() => setSelectedTask(task.id)}
    >
      <span className="spine" style={{ background: spine(task) }} />
      <span className="title">{task.title}</span>
      <span className="meta">
        <span className={`tag ${pc}`}>{PRIORITY_TAG[task.priority]}</span>
        <span className="status-pill">{task.status}</span>
        <Avatar
          name={memberName(task.assignee_id)}
          highlight={task.assignee_id === user?.id}
        />
        <span className={`age ${age > STALE_DAYS ? "alert" : ""}`}>
          {closed ? "" : `${age}d`}
        </span>
        <span className={`due ${due.cls}`}>{due.txt}</span>
      </span>
    </div>
  );
}
