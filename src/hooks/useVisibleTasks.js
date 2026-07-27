import { useMemo } from "react";
import useAppStore from "../store/appStore";

/**
 * Computes the visible task list for the current view + filters.
 *
 * Selecting each slice individually (stable references) and deriving with
 * useMemo avoids returning a brand-new array from a Zustand selector on every
 * render, which would trip React's "getSnapshot should be cached" loop.
 */
export function useVisibleTasks() {
  const tasks = useAppStore((s) => s.tasks);
  const currentView = useAppStore((s) => s.currentView);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const statusFilters = useAppStore((s) => s.statusFilters);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const user = useAppStore((s) => s.user);
  const isAdmin = useAppStore((s) => s.isAdmin);

  return useMemo(() => {
    let visible = tasks;

    if (currentView === "my-work") {
      visible = visible.filter((t) => t.assignee_id === user?.id);
    } else if (currentView === "project" && currentProjectId) {
      visible = visible.filter((t) => t.project_id === currentProjectId);
    } else if (currentView === "all-tasks" && !isAdmin) {
      visible = visible.filter((t) => t.assignee_id === user?.id);
    }

    if (statusFilters.length) {
      visible = visible.filter((t) => statusFilters.includes(t.status));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      visible = visible.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return visible;
  }, [
    tasks,
    currentView,
    currentProjectId,
    statusFilters,
    searchQuery,
    user,
    isAdmin,
  ]);
}
