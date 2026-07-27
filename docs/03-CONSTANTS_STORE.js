/**
 * Constants and Zustand Store Skeleton
 * Copy these into src/lib/constants.js and src/store/appStore.js
 */

// ============ CONSTANTS (lib/constants.js) ============

export const ROLES = [
  "Admin",
  "PM",
  "SEO",
  "Web Designer",
  "Web Developer",
  "Email Marketing",
  "Google Ads",
  "Meta Ads",
];

export const ROLE_SHORT = {
  Admin: "ADMIN",
  PM: "PM",
  SEO: "SEO",
  "Web Designer": "DSGN",
  "Web Developer": "DEV",
  "Email Marketing": "EMAIL",
  "Google Ads": "GADS",
  "Meta Ads": "META",
};

export const STATUSES = [
  "Backlog",
  "Ready",
  "In Progress",
  "Client Review",
  "Approved",
  "Completed",
  "Revision Required",
];

export const STATUS_SHORT = {
  Backlog: "BKLG",
  Ready: "RDY",
  "In Progress": "PROG",
  "Client Review": "C-REV",
  Approved: "APPR",
  Completed: "DONE",
  "Revision Required": "REVSN",
};

export const CLOSED_STATUSES = ["Completed"];
export const WAITING_STATUSES = ["Client Review"];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export const PRIORITY_TAG = {
  Low: "LOW",
  Normal: "NRM",
  High: "HIGH",
  Urgent: "URG",
};

export const PRIORITY_ORDER = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
};

export const PROJECT_STATES = ["Active", "Paused", "Cancelled"];

export const STALE_DAYS = 5;

export const COLORS = {
  accent: "#d946ef",
  accentLight: "#f0d9ff",
  accentDark: "#c026d3",
  growth: "#f59e0b",
  success: "#10b981",
  alert: "#ef4444",
};

// ============ UTILITIES (lib/utils.js) ============

export const uid = (prefix = "id") => prefix + Math.random().toString(36).slice(2, 7);

export const initials = (name) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysAgo = (n) => Date.now() - n * 864e5;

export const ageDays = (timestamp) => {
  return Math.floor((Date.now() - (timestamp ? new Date(timestamp).getTime() : Date.now())) / 864e5);
};

export const daysTo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(today() + "T00:00:00");
  return Math.round((d - t) / 864e5);
};

export const shortDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const dueLabel = (dateStr) => {
  const n = daysTo(dateStr);
  if (n === null) return { txt: "", cls: "" };
  if (n < 0) return { txt: -n + "d late", cls: "alert" };
  if (n === 0) return { txt: "today", cls: "alert" };
  if (n === 1) return { txt: "tmrw", cls: "" };
  return { txt: shortDate(dateStr), cls: "" };
};

export const spine = (task) => {
  if (CLOSED_STATUSES.includes(task.status)) return "transparent";
  const a = ageDays(task.status_at);
  if (a > STALE_DAYS) return COLORS.alert;
  if (a > 2) return COLORS.growth;
  return "#d1cfe3"; // calm gray
};

export const isClosed = (task) => CLOSED_STATUSES.includes(task.status);
export const isStale = (task) => !isClosed(task) && ageDays(task.status_at) > STALE_DAYS;

export const esc = (s) => {
  const str = String(s == null ? "" : s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// ============ ZUSTAND STORE (store/appStore.js) ============

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ---- Auth State ----
        user: null,
        org_id: null,
        isAdmin: false,
        loading: true,
        error: null,

        // ---- Data State ----
        members: [],
        projects: [],
        tasks: [],
        comments: [],
        time_logs: [],
        deliverables: [],
        inbox: [],

        // ---- UI State ----
        currentView: "dash",
        currentProjectId: null,
        selectedTaskId: null,
        filters: {
          open: false,
          urgent: false,
          overdue: false,
        },
        searchQuery: "",

        // ---- Auth Actions ----
        setUser: (user) =>
          set((state) => ({
            user,
            isAdmin: user?.role === "Admin",
            loading: false,
          })),

        logout: () =>
          set({
            user: null,
            org_id: null,
            isAdmin: false,
            members: [],
            projects: [],
            tasks: [],
            comments: [],
          }),

        // ---- Data Actions ----
        setMembers: (members) => set({ members }),
        setProjects: (projects) => set({ projects }),
        setTasks: (tasks) => set({ tasks }),
        setComments: (comments) => set({ comments }),
        setInbox: (inbox) => set({ inbox }),

        /**
         * Create a new task
         * This is called from API response, not locally
         */
        addTask: (task) =>
          set((state) => ({
            tasks: [...state.tasks, task],
          })),

        /**
         * Update task in store
         * Partial update, merges with existing
         */
        updateTask: (taskId, updates) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
          })),

        /**
         * Delete task from store
         */
        deleteTask: (taskId) =>
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
            selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
          })),

        /**
         * Add comment to store
         */
        addComment: (comment) =>
          set((state) => ({
            comments: [...state.comments, comment],
          })),

        /**
         * Move item from inbox to backlog (create task)
         */
        acceptInboxItem: (inboxId, projectId) =>
          set((state) => ({
            inbox: state.inbox.filter((i) => i.id !== inboxId),
          })),

        /**
         * Reject inbox item (remove)
         */
        rejectInboxItem: (inboxId) =>
          set((state) => ({
            inbox: state.inbox.filter((i) => i.id !== inboxId),
          })),

        // ---- UI Actions ----
        setView: (view, projectId) =>
          set({
            currentView: view,
            currentProjectId: projectId || null,
          }),

        setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),

        setFilter: (filterName, value) =>
          set((state) => ({
            filters: {
              ...state.filters,
              [filterName]: value,
            },
          })),

        setSearchQuery: (query) => set({ searchQuery: query }),

        // ---- Derived/Computed (call from components) ----
        getVisibleTasks: () => {
          const state = get();
          const { currentView, selectedTaskId, filters, searchQuery, user, isAdmin, tasks } = state;

          let visible = tasks;

          // Filter by view
          if (currentView === "my-work") {
            visible = visible.filter((t) => t.assignee_id === user?.id);
          } else if (currentView === "project" && state.currentProjectId) {
            visible = visible.filter((t) => t.project_id === state.currentProjectId);
          } else if (currentView === "all-tasks" && !isAdmin) {
            // Non-admin shouldn't see this, but fallback to their work
            visible = visible.filter((t) => t.assignee_id === user?.id);
          }

          // Filter by task status
          if (filters.open) {
            visible = visible.filter((t) => !CLOSED_STATUSES.includes(t.status));
          }

          // Filter by priority
          if (filters.urgent) {
            visible = visible.filter((t) => t.priority === "Urgent");
          }

          // Filter by due date (overdue = due_date < today)
          if (filters.overdue) {
            visible = visible.filter((t) => {
              const dayDiff = daysTo(t.due_date);
              return dayDiff !== null && dayDiff < 0;
            });
          }

          // Filter by search
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            visible = visible.filter(
              (t) =>
                t.title.toLowerCase().includes(q) ||
                (t.notes && t.notes.toLowerCase().includes(q))
            );
          }

          return visible;
        },

        /**
         * Get tasks grouped by project
         */
        getTasksByProject: () => {
          const state = get();
          const visible = state.getVisibleTasks();
          const grouped = {};

          visible.forEach((t) => {
            const key = t.project_id || "unassigned";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
          });

          return grouped;
        },

        /**
         * Get tasks by assignee
         */
        getTasksByAssignee: () => {
          const state = get();
          const visible = state.getVisibleTasks();
          const grouped = {};

          visible.forEach((t) => {
            const key = t.assignee_id || "unassigned";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
          });

          return grouped;
        },
      }),
      {
        name: "funnele-pm-store",
        partialize: (state) => ({
          // Only persist certain slices (not API data, which comes from server)
          filters: state.filters,
          currentView: state.currentView,
          searchQuery: state.searchQuery,
        }),
      }
    )
  )
);

export default useAppStore;
