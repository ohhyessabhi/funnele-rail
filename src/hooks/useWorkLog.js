import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Time logs + deliverables for a task (the "Work log"), newest first.
 * Exposes `refetch` so the status modal can refresh after saving.
 */
export function useWorkLog(taskId) {
  const [logs, setLogs] = useState([]);
  const [deliverables, setDeliverables] = useState([]);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured || !taskId) {
      setLogs([]);
      setDeliverables([]);
      return;
    }
    const [{ data: tl }, { data: dl }] = await Promise.all([
      supabase
        .from("time_logs")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
      supabase
        .from("deliverables")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
    ]);
    setLogs(tl || []);
    setDeliverables(dl || []);
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalMinutes = logs.reduce((s, l) => s + (l.minutes || 0), 0);

  return { logs, deliverables, totalMinutes, refetch };
}
