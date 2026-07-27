import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/** Loads active projects (clients) for the org and refreshes on any change. */
export function useProjects() {
  const user = useAppStore((s) => s.user);
  const setProjects = useAppStore((s) => s.setProjects);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    let active = true;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("state", "Active");
      if (!error && active) setProjects(data || []);
    };
    fetchProjects();

    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        fetchProjects
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, setProjects]);
}
