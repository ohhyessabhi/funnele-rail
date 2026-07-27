import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/**
 * Comments for a single task (newest first), kept live via realtime.
 * Self-contained: returns the list plus an `addComment` mutation.
 */
export function useComments(taskId) {
  const user = useAppStore((s) => s.user);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !taskId) {
      setComments([]);
      return;
    }

    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      if (active) {
        setComments(data || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) =>
          setComments((prev) =>
            prev.some((c) => c.id === payload.new.id)
              ? prev
              : [payload.new, ...prev]
          )
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const addComment = async (body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("comments")
      .insert({ task_id: taskId, author_id: user?.id, body: trimmed })
      .select()
      .single();
    if (error) throw error;
    // Optimistically add in case realtime is disabled for this table.
    setComments((prev) =>
      prev.some((c) => c.id === data.id) ? prev : [data, ...prev]
    );
    return data;
  };

  return { comments, loading, addComment };
}
