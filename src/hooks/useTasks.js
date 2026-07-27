import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/**
 * Loads tasks for the current org and keeps them live via realtime.
 * (Row-Level Security scopes what the current user is actually allowed to see.)
 */
export function useTasks() {
  const user = useAppStore((s) => s.user);
  const setTasks = useAppStore((s) => s.setTasks);
  const upsertTask = useAppStore((s) => s.upsertTask);
  const removeTask = useAppStore((s) => s.removeTask);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    let active = true;
    (async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (!error && active) setTasks(data || []);
    })();

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "DELETE") removeTask(payload.old.id);
          else upsertTask(payload.new);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, setTasks, upsertTask, removeTask]);
}
