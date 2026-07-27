import { supabase } from "./supabase";
import useAppStore from "../store/appStore";

/**
 * Thin write-layer over Supabase. Reads + realtime live in the hooks; these
 * functions perform mutations and let the realtime subscription reconcile the
 * store. They also update the store optimistically so the UI feels instant.
 */

const store = () => useAppStore.getState();

function ensureClient() {
  if (!supabase) throw new Error("Supabase is not configured. Add .env.local.");
}

// ---------------- Tasks ----------------

export async function createTask(input = {}) {
  ensureClient();
  const { user } = store();
  const now = new Date().toISOString();
  const payload = {
    org_id: user?.org_id,
    project_id: input.project_id ?? null,
    title: input.title?.trim() || "New task",
    notes: input.notes ?? "",
    status: input.status || "Backlog",
    priority: input.priority || "Normal",
    assignee_id: input.assignee_id ?? user?.id ?? null,
    due_date: input.due_date ?? null,
    source: input.source || "Manual",
    source_ref: input.source_ref ?? null,
    status_at: now,
  };
  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  store().upsertTask(data);
  return data;
}

export async function updateTask(taskId, updates) {
  ensureClient();
  const patch = { ...updates, updated_at: new Date().toISOString() };
  // Any status change resets the "age" clock used for the stale spine.
  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    patch.status_at = new Date().toISOString();
  }
  store().upsertTask({ id: taskId, ...patch }); // optimistic
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  store().upsertTask(data);
  return data;
}

export async function deleteTask(taskId) {
  ensureClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
  store().removeTask(taskId);
}

// ---------------- Work log (time + deliverables) ----------------

export async function addTimeLog(taskId, minutes) {
  ensureClient();
  const { user } = store();
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      task_id: taskId,
      member_id: user?.id,
      minutes,
      logged_at: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addDeliverable(taskId, url, note) {
  ensureClient();
  const { user } = store();
  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      task_id: taskId,
      member_id: user?.id,
      url: url || null,
      note: note || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------- Projects ----------------

export async function createProject(name) {
  ensureClient();
  const { user } = store();
  const { data, error } = await supabase
    .from("projects")
    .insert({ org_id: user?.org_id, name: name.trim(), state: "Active" })
    .select()
    .single();
  if (error) throw error;
  store().setProjects([...store().projects, data]);
  return data;
}

// ---------------- Members ----------------

export async function createMember(name, role, email) {
  ensureClient();
  const { user } = store();
  const { data, error } = await supabase
    .from("members")
    .insert({
      org_id: user?.org_id,
      name: name.trim(),
      role,
      email: email.trim().toLowerCase(),
      status: "Active",
    })
    .select()
    .single();
  if (error) throw error;
  store().setMembers([...store().members, data]);
  return data;
}

// ---------------- Inbox ----------------

export async function acceptInboxItem(inboxId, projectId) {
  ensureClient();
  const { data: item, error: readErr } = await supabase
    .from("inbox")
    .select("*")
    .eq("id", inboxId)
    .single();
  if (readErr) throw readErr;

  await createTask({
    project_id: projectId || item.project_id || null,
    title: item.title,
    notes: item.detail || "",
    status: "Backlog",
    priority: "Normal",
    source: item.source,
    source_ref: item.id,
  });

  const { error: delErr } = await supabase
    .from("inbox")
    .delete()
    .eq("id", inboxId);
  if (delErr) throw delErr;
  store().removeInboxItem(inboxId);
}

export async function rejectInboxItem(inboxId) {
  ensureClient();
  const { error } = await supabase.from("inbox").delete().eq("id", inboxId);
  if (error) throw error;
  store().removeInboxItem(inboxId);
}
