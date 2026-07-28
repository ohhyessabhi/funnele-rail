import { useMemo, useState } from "react";
import useAppStore from "../store/appStore";
import { useHours } from "../hooks/useHours";
import { initials, shortDate } from "../lib/utils";
import { ROLE_SHORT } from "../lib/constants";

const RANGES = [
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
  { key: "3mo", label: "3 months", days: 90 },
  { key: "6mo", label: "6 months", days: 180 },
  { key: "12mo", label: "12 months", days: 365 },
];

const toISODate = (d) => d.toISOString().slice(0, 10);

function rangeDates(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return { start: toISODate(start), end: toISODate(end) };
}

export function Hours() {
  const members = useAppStore((s) => s.members);
  const projectName = useAppStore((s) => s.projectName);
  const [rangeKey, setRangeKey] = useState("month");
  const [selectedMember, setSelectedMember] = useState(null);

  const { start, end } = useMemo(
    () => rangeDates(RANGES.find((r) => r.key === rangeKey).days),
    [rangeKey]
  );
  const { logs, loading } = useHours(start, end);

  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);

  const byMember = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      map[l.member_id] = (map[l.member_id] || 0) + l.minutes;
    });
    return members
      .map((m) => ({ member: m, minutes: map[m.id] || 0 }))
      .filter((row) => row.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [logs, members]);

  const maxMinutes = Math.max(1, ...byMember.map((r) => r.minutes));

  const entries = selectedMember
    ? logs
        .filter((l) => l.member_id === selectedMember)
        .sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1))
    : [];

  return (
    <div style={{ padding: "18px 28px 28px" }}>
      <div className="seg" style={{ marginBottom: 20, display: "inline-flex" }}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={rangeKey === r.key ? "on" : ""}
            onClick={() => setRangeKey(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="dash-h">
          Total logged <span className="c">{totalMinutes}m</span>
        </div>
        {loading ? (
          <div className="wl-empty">Loading…</div>
        ) : byMember.length ? (
          byMember.map(({ member, minutes }) => (
            <div
              className="wl-row"
              key={member.id}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setSelectedMember(selectedMember === member.id ? null : member.id)
              }
            >
              <span className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                {initials(member.name)}
              </span>
              <div className="wl-body">
                <div className="wl-top">
                  <span className="wl-nm">{member.name}</span>
                  <span className="wl-rl">
                    {ROLE_SHORT[member.role] || member.role}
                  </span>
                  <span className="wl-n">{minutes}m</span>
                </div>
                <div className="wl-bar">
                  <span
                    style={{
                      width: `${Math.round((minutes / maxMinutes) * 100)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="wl-empty">No time logged in this range yet.</div>
        )}
      </div>

      {selectedMember && (
        <div className="dash-card">
          <div className="dash-h">
            {members.find((m) => m.id === selectedMember)?.name}’s entries
            <span className="c">{entries.length}</span>
          </div>
          {entries.map((l) => (
            <div className="att-row" key={l.id} style={{ cursor: "default" }}>
              <div className="att-body">
                <div className="att-t">{l.task?.title || "Deleted task"}</div>
                <div className="att-meta">
                  {l.task?.project_id ? projectName(l.task.project_id) : "No client"}
                </div>
              </div>
              <span className="due">{shortDate(l.logged_at)}</span>
              <span className="wl-n" style={{ minWidth: 40, textAlign: "right" }}>
                {l.minutes}m
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
