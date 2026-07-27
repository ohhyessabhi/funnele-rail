import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/** Loads inbox intake items (Teamwork/Fireflies) and keeps them live. */
export function useInbox() {
  const user = useAppStore((s) => s.user);
  const setInbox = useAppStore((s) => s.setInbox);
  const addInboxItem = useAppStore((s) => s.addInboxItem);
  const removeInboxItem = useAppStore((s) => s.removeInboxItem);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("inbox")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && active) setInbox(data || []);
    })();

    const channel = supabase
      .channel("inbox-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inbox" },
        (payload) => addInboxItem(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "inbox" },
        (payload) => removeInboxItem(payload.old.id)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, setInbox, addInboxItem, removeInboxItem]);
}
