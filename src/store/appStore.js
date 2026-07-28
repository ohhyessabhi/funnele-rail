import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Central app store. Server data (members/projects/tasks/comments/inbox) is
 * mirrored here and kept fresh by the data hooks + realtime subscriptions.
 *
 * Nothing here is persisted across reloads — view state used to persist
 * `currentView` alone, which could leave a stale "project" view stranded
 * with no matching `currentProjectId` (that isn't persisted) after a
 * reload, landing on a broken "No client" screen. Simpler and safer to
 * always start fresh: everyone lands on My work.
 */
export const useAppStore = create(
  devtools((set, get) => ({
    // ---- Auth ----
    user: null,
    isAdmin: false,
    loading: true,

    // ---- Data ----
    members: [],
    projects: [],
    tasks: [],
    comments: [],
    inbox: [],

    // ---- UI ----
    currentView: "my-work",
    currentProjectId: null,
    selectedTaskId: null,
    paletteOpen: false,
    mobileNavOpen: false,
    statusFilters: [], // empty = show every status
    searchQuery: "",
    toast: null,

    // ---- Auth actions ----
    setUser: (user) =>
      set({ user, isAdmin: user?.role === "Admin", loading: false }),
    setLoading: (loading) => set({ loading }),
    resetForLogout: () =>
      set({
        user: null,
        isAdmin: false,
        members: [],
        projects: [],
        tasks: [],
        comments: [],
        inbox: [],
        currentView: "my-work",
        currentProjectId: null,
        selectedTaskId: null,
        paletteOpen: false,
        mobileNavOpen: false,
        statusFilters: [],
      }),

    // ---- Data setters ----
    setMembers: (members) => set({ members }),
    setProjects: (projects) => set({ projects }),
    setTasks: (tasks) => set({ tasks }),
    setComments: (comments) => set({ comments }),
    setInbox: (inbox) => set({ inbox }),

    // ---- Task realtime reducers ----
    addTask: (task) =>
      set((s) =>
        s.tasks.some((t) => t.id === task.id)
          ? {}
          : { tasks: [...s.tasks, task] }
      ),
    upsertTask: (task) =>
      set((s) => ({
        tasks: s.tasks.some((t) => t.id === task.id)
          ? s.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t))
          : [...s.tasks, task],
      })),
    removeTask: (taskId) =>
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== taskId),
        selectedTaskId: s.selectedTaskId === taskId ? null : s.selectedTaskId,
      })),

    // ---- Comment realtime reducers ----
    addComment: (comment) =>
      set((s) =>
        s.comments.some((c) => c.id === comment.id)
          ? {}
          : { comments: [...s.comments, comment] }
      ),

    // ---- Inbox realtime reducers ----
    addInboxItem: (item) =>
      set((s) =>
        s.inbox.some((i) => i.id === item.id)
          ? {}
          : { inbox: [item, ...s.inbox] }
      ),
    removeInboxItem: (inboxId) =>
      set((s) => ({ inbox: s.inbox.filter((i) => i.id !== inboxId) })),

    // ---- UI actions ----
    setView: (view, projectId = null) =>
      set({
        currentView: view,
        currentProjectId: projectId,
        selectedTaskId: null,
      }),
    setSelectedTask: (taskId) => set({ selectedTaskId: taskId || null }),
    setPaletteOpen: (open) => set({ paletteOpen: open }),
    setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    toggleStatusFilter: (status) =>
      set((s) => ({
        statusFilters: s.statusFilters.includes(status)
          ? s.statusFilters.filter((x) => x !== status)
          : [...s.statusFilters, status],
      })),
    setSearchQuery: (q) => set({ searchQuery: q }),
    showToast: (message, isError = false) => {
      set({ toast: { message, isError } });
      setTimeout(() => {
        if (get().toast?.message === message) set({ toast: null });
      }, 3200);
    },

    // ---- Lookups ----
    memberById: (id) => get().members.find((m) => m.id === id) || null,
    memberName: (id) => get().memberById(id)?.name || "Unassigned",
    projectById: (id) => get().projects.find((p) => p.id === id) || null,
    projectName: (id) => get().projectById(id)?.name || "No client",
  }))
);

export default useAppStore;
