import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTasks } from "./hooks/useTasks";
import { useMembers } from "./hooks/useMembers";
import { useProjects } from "./hooks/useProjects";
import { useInbox } from "./hooks/useInbox";
import useAppStore from "./store/appStore";
import { STATUSES } from "./lib/constants";
import { useViewScopedTasks } from "./hooks/useVisibleTasks";

import { Login } from "./components/Login";
import { Topbar } from "./components/Topbar";
import { Sidebar } from "./components/Sidebar";
import { Drawer } from "./components/Drawer";
import { Palette } from "./components/Palette";
import { Toast } from "./components/Toast";

import { Dashboard } from "./pages/Dashboard";
import { MyWork } from "./pages/MyWork";
import { AllTasks } from "./pages/AllTasks";
import { Inbox } from "./pages/Inbox";
import { Team } from "./pages/Team";
import { Hours } from "./pages/Hours";
import { Project } from "./pages/Project";

const VIEW_TITLES = {
  dash: "Dashboard",
  "my-work": "My work",
  inbox: "Inbox",
  "all-tasks": "All tasks",
  hours: "Hours",
  team: "Team",
};

function ViewHead() {
  const { currentView, currentProjectId, statusFilters, toggleStatusFilter } =
    useAppStore();
  const projectName = useAppStore((s) => s.projectName);
  const scopedTasks = useViewScopedTasks();

  const title =
    currentView === "project"
      ? projectName(currentProjectId)
      : VIEW_TITLES[currentView] || "Tasks";

  // Status filter chips only make sense on task-list views.
  const showFilters = ["my-work", "all-tasks", "project", "dash"].includes(
    currentView
  );

  const countByStatus = {};
  scopedTasks.forEach((t) => {
    countByStatus[t.status] = (countByStatus[t.status] || 0) + 1;
  });

  return (
    <div className="viewhead">
      <h1>{title}</h1>
      {showFilters && (
        <div className="toolrow">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${statusFilters.includes(s) ? "on" : ""}`}
              onClick={() => toggleStatusFilter(s)}
            >
              {s}
              {countByStatus[s] ? (
                <span className="chip-count">{countByStatus[s]}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentView() {
  const currentView = useAppStore((s) => s.currentView);
  switch (currentView) {
    case "my-work":
      return <MyWork />;
    case "all-tasks":
      return <AllTasks />;
    case "inbox":
      return <Inbox />;
    case "team":
      return <Team />;
    case "hours":
      return <Hours />;
    case "project":
      return <Project />;
    case "dash":
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const paletteOpen = useAppStore((s) => s.paletteOpen);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);

  // Data loaders (each guards internally on `user`).
  useTasks();
  useMembers();
  useProjects();
  useInbox();

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useAppStore.getState().paletteOpen);
      }
      if (e.key === "Escape") {
        const s = useAppStore.getState();
        if (s.paletteOpen) setPaletteOpen(false);
        else if (s.selectedTaskId) setSelectedTask(null);
        else if (s.mobileNavOpen) s.setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen, setSelectedTask]);

  // The mobile sidebar overlay is meaningless above the mobile breakpoint —
  // close it on resize so it can't get stuck open (e.g. after a logout that
  // happened while it was open, or rotating a tablet).
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 920 && useAppStore.getState().mobileNavOpen) {
        useAppStore.getState().setMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-logo">f</div>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <>
      <Topbar user={user} onLogout={logout} />
      <div className="body">
        <Sidebar onLogout={logout} />
        <main className="main">
          <ViewHead />
          <div className="scroll">
            <CurrentView />
          </div>
        </main>
      </div>
      <Drawer />
      {paletteOpen && <Palette />}
      <Toast />
    </>
  );
}
