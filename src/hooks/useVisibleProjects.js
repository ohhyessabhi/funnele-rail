import { useMemo } from "react";
import useAppStore from "../store/appStore";

/**
 * Projects are readable by every org member at the RLS layer (so everyone
 * can resolve client names on their own tasks), but non-admins should only
 * ever be shown clients they actually have work in — Sidebar enforced this,
 * Palette didn't, which leaked every client name to every member. Both now
 * share this one filter so they can't drift apart again.
 */
export function useVisibleProjects() {
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const isAdmin = useAppStore((s) => s.isAdmin);
  const userId = useAppStore((s) => s.user?.id);

  return useMemo(() => {
    if (isAdmin) return projects;
    return projects.filter((p) =>
      tasks.some((t) => t.project_id === p.id && t.assignee_id === userId)
    );
  }, [projects, tasks, isAdmin, userId]);
}
