import { useMemo } from "react";
import useAppStore from "../store/appStore";

/**
 * Tasks scoped to the current view (my-work / all-tasks / project) + search,
 * but *before* the status chip filter is applied. Exported separately so
 * ViewHead can compute "how many tasks are in each stage" counts that don't
 * shrink as you select more status chips.
 */
export function useViewScopedTasks() {
  const tasks = useAppStore((s) => s.tasks);
  const currentView = useAppStore((s) => s.currentView);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
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

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      visible = visible.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return visible;
  }, [tasks, currentView, currentProjectId, searchQuery, user, isAdmin]);
}

/**
 * Computes the visible task list for the current view + filters (search,
 * then the status chip filter on top of useViewScopedTasks).
 *
 * Selecting each slice individually (stable references) and deriving with
 * useMemo avoids returning a brand-new array from a Zustand selector on every
 * render, which would trip React's "getSnapshot should be cached" loop.
 */
export function useVisibleTasks() {
  const base = useViewScopedTasks();
  const statusFilters = useAppStore((s) => s.statusFilters);

  return useMemo(() => {
    if (!statusFilters.length) return base;
    return base.filter((t) => statusFilters.includes(t.status));
  }, [base, statusFilters]);
}
