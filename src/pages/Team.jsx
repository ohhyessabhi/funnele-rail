import useAppStore from "../store/appStore";
import { Avatar } from "../components/Avatar";
import { isClosed } from "../lib/utils";

export function Team() {
  const members = useAppStore((s) => s.members);
  const tasks = useAppStore((s) => s.tasks);

  return (
    <div className="team-list">
      {members.map((m) => {
        const open = tasks.filter(
          (t) => t.assignee_id === m.id && !isClosed(t)
        ).length;
        const total = tasks.filter((t) => t.assignee_id === m.id).length;
        return (
          <div className="team-card" key={m.id}>
            <Avatar name={m.name} />
            <div style={{ flex: 1 }}>
              <div className="nm">{m.name}</div>
              <div className="rl">
                {m.role} · {open} open · {total} total
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
