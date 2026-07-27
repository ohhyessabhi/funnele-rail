import useAppStore from "../store/appStore";
import {
  isClosed,
  isStale,
  ageDays,
  daysTo,
  dueLabel,
  spine,
  initials,
} from "../lib/utils";
import { PRIORITY_TAG, ROLE_SHORT } from "../lib/constants";
import { MyWork } from "./MyWork";

const isOverdue = (t) => {
  const n = daysTo(t.due_date);
  return n !== null && n < 0;
};

export function Dashboard() {
  const isAdmin = useAppStore((s) => s.isAdmin);
  const tasks = useAppStore((s) => s.tasks);
  const members = useAppStore((s) => s.members);
  const projectName = useAppStore((s) => s.projectName);
  const memberName = useAppStore((s) => s.memberName);
  const setView = useAppStore((s) => s.setView);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);

  // Non-admins get their own work as the dashboard.
  if (!isAdmin) return <MyWork />;

  const open = tasks.filter((t) => !isClosed(t));
  const urgent = open.filter((t) => t.priority === "Urgent").length;
  const overdue = open.filter(isOverdue).length;
  const stale = tasks.filter(isStale).length;

  const stats = [
    { n: open.length, l: "Open", onClick: () => setView("all-tasks") },
    { n: urgent, l: "Urgent", alert: urgent > 0, onClick: () => setView("all-tasks") },
    { n: overdue, l: "Overdue", alert: overdue > 0, onClick: () => setView("all-tasks") },
    { n: stale, l: "Stale", alert: stale > 0, onClick: () => setView("all-tasks") },
  ];

  const workload = members
    .map((m) => ({
      m,
      n: tasks.filter((t) => t.assignee_id === m.id && !isClosed(t)).length,
    }))
    .sort((a, b) => b.n - a.n);
  const maxN = Math.max(1, ...workload.map((w) => w.n));

  const attention = tasks
    .filter(
      (t) =>
        !isClosed(t) &&
        (t.priority === "Urgent" || isStale(t) || isOverdue(t))
    )
    .sort((a, b) => {
      const pa = a.priority === "Urgent" ? 0 : 1;
      const pb = b.priority === "Urgent" ? 0 : 1;
      return pa - pb || ageDays(b.status_at) - ageDays(a.status_at);
    });

  return (
    <>
      <div className="stats">
        {stats.map((s) => (
          <div
            className="stat"
            data-clickable="1"
            key={s.l}
            onClick={s.onClick}
            style={s.alert ? { borderColor: "var(--alert)" } : undefined}
          >
            <div className={`n ${s.alert ? "alert" : ""}`}>{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-h">
            Team workload <span className="c">{open.length} open</span>
          </div>
          {workload.length ? (
            workload.map((w) => (
              <div className="wl-row" key={w.m.id}>
                <span
                  className="avatar"
                  style={{ width: 26, height: 26, fontSize: 10 }}
                >
                  {initials(w.m.name)}
                </span>
                <div className="wl-body">
                  <div className="wl-top">
                    <span className="wl-nm">{w.m.name}</span>
                    <span className="wl-rl">{ROLE_SHORT[w.m.role] || w.m.role}</span>
                    <span className="wl-n">{w.n}</span>
                  </div>
                  <div className="wl-bar">
                    <span
                      style={{
                        width: `${Math.round((w.n / maxN) * 100)}%`,
                        background:
                          w.n > 4
                            ? "var(--alert)"
                            : w.n > 2
                            ? "var(--growth)"
                            : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="wl-empty">No team members yet</div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-h">
            Needs attention <span className="c">{attention.length}</span>
          </div>
          {attention.length ? (
            attention.map((t) => {
              const due = dueLabel(t.due_date);
              const pc =
                t.priority === "Urgent"
                  ? "urg"
                  : t.priority === "High"
                  ? "high"
                  : "";
              return (
                <div
                  className="att-row"
                  key={t.id}
                  onClick={() => setSelectedTask(t.id)}
                >
                  <span
                    className="spine"
                    style={{
                      background: spine(t),
                      width: 3,
                      height: 34,
                      borderRadius: 2,
                      flex: "0 0 3px",
                    }}
                  />
                  <div className="att-body">
                    <div className="att-t">{t.title}</div>
                    <div className="att-meta">
                      {projectName(t.project_id)} · {memberName(t.assignee_id)}
                    </div>
                  </div>
                  <span className={`tag ${pc}`}>{PRIORITY_TAG[t.priority]}</span>
                  <span className={`due ${due.cls}`}>{due.txt}</span>
                </div>
              );
            })
          ) : (
            <div className="wl-empty">
              Nothing urgent, overdue, or stale. Nice.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
