import { useState } from "react";
import useAppStore from "../store/appStore";
import { ROLE_SHORT } from "../lib/constants";
import { isClosed } from "../lib/utils";
import { useVisibleProjects } from "../hooks/useVisibleProjects";
import { AddClientModal } from "./AddClientModal";
import { AddMemberModal } from "./AddMemberModal";

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

export function Sidebar({ onLogout }) {
  const {
    user,
    isAdmin,
    members,
    tasks,
    inbox,
    currentView,
    currentProjectId,
    mobileNavOpen,
    setMobileNavOpen,
    setView,
  } = useAppStore();

  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const myOpen = tasks.filter(
    (t) => t.assignee_id === user?.id && !isClosed(t)
  ).length;
  const allOpen = tasks.filter((t) => !isClosed(t)).length;

  const visibleProjects = useVisibleProjects();

  const projectCount = (pid) =>
    tasks.filter(
      (t) =>
        t.project_id === pid &&
        !isClosed(t) &&
        (isAdmin || t.assignee_id === user?.id)
    ).length;

  // On mobile the sidebar is an overlay; picking a destination should close it.
  const go = (view, projectId) => {
    setView(view, projectId);
    setMobileNavOpen(false);
  };

  return (
    <>
      {mobileNavOpen && (
        <div className="scrim" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`.trim()}>
        <div className="sidebar-section">
          {isAdmin && (
            <NavItem
              label="Dashboard"
              active={currentView === "dash"}
              onClick={() => go("dash")}
            />
          )}
          <NavItem
            label="My work"
            active={currentView === "my-work"}
            count={myOpen}
            onClick={() => go("my-work")}
          />
          <NavItem
            label="Inbox"
            active={currentView === "inbox"}
            count={inbox.length}
            onClick={() => go("inbox")}
          />
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-label">Admin</div>
            <NavItem
              label="All tasks"
              active={currentView === "all-tasks"}
              count={allOpen}
              onClick={() => go("all-tasks")}
            />
            <NavItem
              label="Hours"
              active={currentView === "hours"}
              onClick={() => go("hours")}
            />
            <NavItem
              label="Team"
              active={currentView === "team"}
              onClick={() => go("team")}
            />
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-label">
            Clients
            {isAdmin && (
              <button
                className="add"
                onClick={() => setShowAddClient(true)}
                title="Add client"
              >
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
                onClick={() => go("project", p.id)}
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
            <div className="um-add" onClick={() => setShowAddMember(true)}>
              + Invite member
            </div>
          </div>
        )}

        <div
          className="sidebar-signout"
          onClick={onLogout}
          role="button"
          aria-label="Sign out"
        >
          Sign out
        </div>
      </aside>

      {showAddClient && (
        <AddClientModal onClose={() => setShowAddClient(false)} />
      )}
      {showAddMember && (
        <AddMemberModal onClose={() => setShowAddMember(false)} />
      )}
    </>
  );
}
