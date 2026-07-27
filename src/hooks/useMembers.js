import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/** Loads active team members for the org and refreshes on any change. */
export function useMembers() {
  const user = useAppStore((s) => s.user);
  const setMembers = useAppStore((s) => s.setMembers);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    let active = true;
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("status", "Active");
      if (!error && active) setMembers(data || []);
    };
    fetchMembers();

    const channel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        fetchMembers
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, setMembers]);
}
