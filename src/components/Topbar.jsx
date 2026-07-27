import useAppStore from "../store/appStore";
import { initials } from "../lib/utils";
import { createTask } from "../lib/api";

export function Topbar({ user, onLogout }) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
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
      <span
        className="hamburger-btn"
        onClick={() => setMobileNavOpen(true)}
        role="button"
        aria-label="Open menu"
      >
        ☰
      </span>

      <div className="brand">
        <div className="brand-icon">f</div>
        <span>Rail</span>
      </div>

      <div className="whoami">
        <span className="av">{initials(user?.name)}</span>
        <span className="nm">{user?.name || "You"}</span>
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
      <span
        className="search-icon-btn"
        onClick={() => setPaletteOpen(true)}
        role="button"
        aria-label="Search"
      >
        ⌕
      </span>

      <div className="right">
        <button
          className="btn btn-sm hide-mobile"
          onClick={() => setPaletteOpen(true)}
        >
          <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>⌘K</span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleNewTask}>
          + New task
        </button>
        <span className="logout-btn hide-mobile" onClick={onLogout}>
          Sign out
        </span>
      </div>
    </div>
  );
}
