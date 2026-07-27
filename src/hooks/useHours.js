import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Time logs within [startDate, endDate] (YYYY-MM-DD, inclusive), each with
 * its parent task's title attached. RLS already scopes this to whatever
 * tasks the current user can see (the whole org, for an Admin).
 */
export function useHours(startDate, endDate) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !startDate || !endDate) return;

    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("time_logs")
        .select("*, task:tasks(title, project_id)")
        .gte("logged_at", startDate)
        .lte("logged_at", endDate)
        .order("logged_at", { ascending: false });
      if (active) {
        if (!error) setLogs(data || []);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  return { logs, loading };
}
