import useAppStore from "../store/appStore";
import { isClosed } from "../lib/utils";
import { PRIORITY_ORDER } from "../lib/constants";
import { TaskRow } from "./TaskRow";

/** Sort: open before closed, then by priority, then by title. */
function sortTasks(a, b) {
  const ac = isClosed(a) ? 1 : 0;
  const bc = isClosed(b) ? 1 : 0;
  if (ac !== bc) return ac - bc;
  const ap = PRIORITY_ORDER[a.priority] ?? 9;
  const bp = PRIORITY_ORDER[b.priority] ?? 9;
  if (ap !== bp) return ap - bp;
  return a.title.localeCompare(b.title);
}

/**
 * Renders tasks. When `grouped`, splits into project groups with a sticky
 * header showing open/total counts (My Work, All Tasks). Otherwise flat.
 */
export function TaskList({ tasks, grouped = true, showTotal = false }) {
  const projectName = useAppStore((s) => s.projectName);

  const sorted = [...tasks].sort(sortTasks);

  if (!grouped) {
    return sorted.map((t) => <TaskRow key={t.id} task={t} />);
  }

  const groups = {};
  sorted.forEach((t) => {
    const key = t.project_id || "unassigned";
    (groups[key] = groups[key] || []).push(t);
  });

  return Object.entries(groups).map(([pid, groupTasks]) => {
    const open = groupTasks.filter((t) => !isClosed(t)).length;
    return (
      <div key={pid}>
        <div className="group-h">
          <span className="t">
            {pid === "unassigned" ? "No client" : projectName(pid)}
          </span>
          <span className="c">
            {open} open{showTotal ? ` · ${groupTasks.length} total` : ""}
          </span>
        </div>
        {groupTasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    );
  });
}
