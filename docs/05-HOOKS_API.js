/**
 * Custom React Hooks for API integration
 * Place in src/hooks/
 */

import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import { supabase } from "../lib/supabase";

// ============ useAuth ============

/**
 * Manage authentication lifecycle
 * Returns user, loading state, login/logout methods
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUser: storeSetUser, setMembers } = useAppStore();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          // Fetch member record
          const { data: member } = await supabase
            .from("members")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (member) {
            setUser(member);
            storeSetUser(member);
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // Fetch member record
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setUser(member);
      storeSetUser(member);
      return member;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, role) => {
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // Create member record
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          id: data.user.id,
          email,
          name,
          role,
          org_id: "current-org-id", // TODO: implement org selection
        })
        .select()
        .single();

      if (memberError) throw memberError;

      setUser(member);
      storeSetUser(member);
      return member;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    storeSetUser(null);
  };

  return { user, loading, error, login, signup, logout };
}

// ============ useTasks ============

/**
 * Fetch tasks and manage task operations
 */
export function useTasks() {
  const { setTasks, addTask, updateTask, deleteTask } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("tasks")
          .select("*");

        if (fetchError) throw fetchError;
        setTasks(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Subscribe to real-time updates
    const subscription = supabase
      .from("tasks")
      .on("*", (payload) => {
        if (payload.eventType === "INSERT") {
          addTask(payload.new);
        } else if (payload.eventType === "UPDATE") {
          updateTask(payload.new.id, payload.new);
        } else if (payload.eventType === "DELETE") {
          deleteTask(payload.old.id);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createTask = async (taskData) => {
    try {
      const { data, error: createError } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (createError) throw createError;
      // Real-time sub will handle store update
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const updateTaskAsync = async (taskId, updates) => {
    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (updateError) throw updateError;
      // Real-time sub will handle store update
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const deleteTaskAsync = async (taskId) => {
    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) throw deleteError;
      // Real-time sub will handle store update
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  return {
    loading,
    error,
    createTask,
    updateTask: updateTaskAsync,
    deleteTask: deleteTaskAsync,
  };
}

// ============ useComments ============

/**
 * Fetch and manage comments for a task
 */
export function useComments(taskId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("comments")
          .select("*")
          .eq("task_id", taskId)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setComments(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Subscribe to new comments
    const subscription = supabase
      .from("comments")
      .on("INSERT", (payload) => {
        if (payload.new.task_id === taskId) {
          setComments((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId]);

  const addComment = async (body, authorId) => {
    try {
      const { data, error: createError } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          author_id: authorId,
          body,
        })
        .select()
        .single();

      if (createError) throw createError;
      // Real-time sub will handle state update
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  return { comments, loading, error, addComment };
}

// ============ useMembers ============

/**
 * Fetch team members
 */
export function useMembers() {
  const { setMembers } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("members")
          .select("*")
          .eq("status", "Active");

        if (fetchError) throw fetchError;
        setMembers(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();

    // Subscribe to member changes
    const subscription = supabase
      .from("members")
      .on("*", () => fetchMembers()) // Refresh on any change
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { loading, error };
}

// ============ useProjects ============

/**
 * Fetch projects (clients)
 */
export function useProjects() {
  const { setProjects } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .eq("state", "Active");

        if (fetchError) throw fetchError;
        setProjects(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    const subscription = supabase
      .from("projects")
      .on("*", () => fetchProjects())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { loading, error };
}

// ============ useInbox ============

/**
 * Fetch inbox items from Teamwork/Fireflies
 */
export function useInbox() {
  const { setInbox, acceptInboxItem, rejectInboxItem } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("inbox")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setInbox(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();

    const subscription = supabase
      .from("inbox")
      .on("INSERT", (payload) => {
        // New inbox item appeared
        setInbox((prev) => [payload.new, ...prev]);
      })
      .on("DELETE", (payload) => {
        // Inbox item was accepted/rejected
        setInbox((prev) => prev.filter((i) => i.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const accept = async (inboxId, projectId) => {
    try {
      // Fetch full inbox item
      const { data: item } = await supabase
        .from("inbox")
        .select("*")
        .eq("id", inboxId)
        .single();

      if (!item) throw new Error("Inbox item not found");

      // Create task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: item.title,
          notes: item.detail,
          status: "Backlog",
          priority: "Normal",
          source: item.source,
          source_ref: item.id,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Delete from inbox
      const { error: deleteError } = await supabase
        .from("inbox")
        .delete()
        .eq("id", inboxId);

      if (deleteError) throw deleteError;

      acceptInboxItem(inboxId, projectId);
      return task;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const reject = async (inboxId) => {
    try {
      const { error: deleteError } = await supabase
        .from("inbox")
        .delete()
        .eq("id", inboxId);

      if (deleteError) throw deleteError;
      rejectInboxItem(inboxId);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  return { loading, error, accept, reject };
}

// ============ useTimeLogs ============

/**
 * Fetch and manage time logs
 */
export function useTimeLogs(taskId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("time_logs")
          .select("*")
          .eq("task_id", taskId);

        if (fetchError) throw fetchError;
        setLogs(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [taskId]);

  const addTimeLog = async (minutes, memberId, loggedAt = new Date().toISOString().slice(0, 10)) => {
    try {
      const { data, error: createError } = await supabase
        .from("time_logs")
        .insert({
          task_id: taskId,
          member_id: memberId,
          minutes,
          logged_at: loggedAt,
        })
        .select()
        .single();

      if (createError) throw createError;
      setLogs((prev) => [...prev, data]);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  return { logs, loading, error, addTimeLog };
}
