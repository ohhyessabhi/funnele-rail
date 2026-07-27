import useAppStore from "../store/appStore";
import { ROLE_SHORT, ROLES } from "../lib/constants";
import { isClosed } from "../lib/utils";
import { createProject, createMember } from "../lib/api";

function NavItem({ label, active, count, alert, onClick }) {
  return (
    <button className={`navitem ${active ? "on" : ""}`} onClick={onClick}>
      <span className="dot" />
      <span className="nm">{label}</span>
      {count ? (
        <span className={`count ${alert ? "alert" : ""}`}>{count}</span>
      ) : null}
    </button>
  );
}

export function Sidebar() {
  const {
    user,
    isAdmin,
    projects,
    members,
    tasks,
    inbox,
    currentView,
    currentProjectId,
    setView,
    showToast,
  } = useAppStore();

  const myOpen = tasks.filter(
    (t) => t.assignee_id === user?.id && !isClosed(t)
  ).length;
  const allOpen = tasks.filter((t) => !isClosed(t)).length;

  const visibleProjects = projects.filter(
    (p) =>
      isAdmin ||
      tasks.some((t) => t.project_id === p.id && t.assignee_id === user?.id)
  );

  const projectCount = (pid) =>
    tasks.filter(
      (t) =>
        t.project_id === pid &&
        !isClosed(t) &&
        (isAdmin || t.assignee_id === user?.id)
    ).length;

  const handleAddProject = async () => {
    const name = window.prompt("Client name");
    if (!name?.trim()) return;
    try {
      await createProject(name);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const handleAddMember = async () => {
    const name = window.prompt("Member name");
    if (!name?.trim()) return;
    const email = window.prompt("Member work email");
    if (!email?.trim()) return;
    const role = window.prompt(`Role (${ROLES.join(", ")})`, "PM");
    try {
      await createMember(name, ROLES.includes(role) ? role : "PM", email);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <NavItem
          label="Dashboard"
          active={currentView === "dash"}
          onClick={() => setView("dash")}
        />
        <NavItem
          label="My work"
          active={currentView === "my-work"}
          count={myOpen}
          onClick={() => setView("my-work")}
        />
        <NavItem
          label="Inbox"
          active={currentView === "inbox"}
          count={inbox.length}
          onClick={() => setView("inbox")}
        />
      </div>

      {isAdmin && (
        <div className="sidebar-section">
          <div className="sidebar-label">Admin</div>
          <NavItem
            label="All tasks"
            active={currentView === "all-tasks"}
            count={allOpen}
            onClick={() => setView("all-tasks")}
          />
          <NavItem
            label="Hours"
            active={currentView === "hours"}
            onClick={() => setView("hours")}
          />
          <NavItem
            label="Team"
            active={currentView === "team"}
            onClick={() => setView("team")}
          />
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-label">
          Clients
          {isAdmin && (
            <button className="add" onClick={handleAddProject} title="Add client">
              +
            </button>
          )}
        </div>
        {visibleProjects.length ? (
          visibleProjects.map((p) => (
            <NavItem
              key={p.id}
              label={p.name}
              active={currentView === "project" && currentProjectId === p.id}
              count={projectCount(p.id)}
              onClick={() => setView("project", p.id)}
            />
          ))
        ) : (
          <div
            style={{ padding: "8px 18px", color: "var(--muted-2)", fontSize: 12 }}
          >
            No clients yet
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="admin-section">
          <div className="h">Team</div>
          <div className="user-mgmt">
            {members.map((m) => (
              <div className="um-item" key={m.id}>
                <span className="nm">{m.name}</span>
                <span className="rl">{ROLE_SHORT[m.role] || m.role}</span>
                {m.id === user?.id && <span className="lock">●</span>}
              </div>
            ))}
          </div>
          <div className="um-add" onClick={handleAddMember}>
            + Add member
          </div>
        </div>
      )}
    </aside>
  );
}
