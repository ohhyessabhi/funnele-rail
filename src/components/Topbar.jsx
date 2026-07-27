import useAppStore from "../store/appStore";
import { initials } from "../lib/utils";
import { createTask } from "../lib/api";

export function Topbar({ user, onLogout }) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const showToast = useAppStore((s) => s.showToast);
  const projects = useAppStore((s) => s.projects);

  const handleNewTask = async () => {
    try {
      const task = await createTask({
        project_id: projects[0]?.id ?? null,
        title: "New task",
      });
      setSelectedTask(task.id);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-icon">f</div>
        <span>unnele</span>
      </div>

      <div className="whoami">
        <span className="av">{initials(user?.name)}</span>
        <span>{user?.name || "You"}</span>
      </div>

      <div className="search">
        <span style={{ color: "var(--muted-2)", fontSize: 13 }}>/</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a task"
          autoComplete="off"
        />
      </div>

      <div className="right">
        <button className="btn btn-sm" onClick={() => setPaletteOpen(true)}>
          <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>⌘K</span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleNewTask}>
          + New task
        </button>
        <span className="logout-btn" onClick={onLogout}>
          Sign out
        </span>
      </div>
    </div>
  );
}
