# Component Specifications

## Component Tree

```
App
├── Login (if !user)
└── Layout
    ├── Topbar
    │   ├── Logo
    │   ├── Search (with Palette)
    │   ├── WhoAmI (user avatar + name dropdown)
    │   └── Actions (New task, Settings)
    ├── Sidebar
    │   ├── NavSection (My work, Inbox, All tasks/Hours/Team admin)
    │   ├── ProjectsSection (filtered by visibility)
    │   └── AdminSection (user mgmt)
    └── Main
        ├── ViewHead (title + filters)
        └── ViewContent
            ├── MyWork (task list grouped by project)
            ├── AllTasks (admin only, task list grouped by project)
            ├── Inbox (Teamwork/Fireflies intake)
            ├── Team (admin only, member directory)
            ├── Hours (admin only, time log summary)
            └── Project (tasks for one client)
        └── Drawer (side panel for task detail)
```

---

## Component Specs

### 1. Login

**Props:** None (uses store)

**State:**
- `newName`, `newRole` (form inputs)

**Behavior:**
- Show existing users from Supabase
- "Add account" button opens prompt for new user creation
- Click user → `setUser(user)` and navigate to dashboard
- First user in org is auto-admin

**External calls:**
- `supabase.auth.signInWithPassword()` OR use sign-up flow

```jsx
// Pseudo
export function Login() {
  const users = /* fetch from Supabase */;
  return (
    <div className="login-screen">
      <h1>Funnele</h1>
      <div className="user-grid">
        {users.map(u => <button onClick={() => setUser(u)}>{u.name}</button>)}
      </div>
      <button onClick={() => addUser(prompt("name"), prompt("role"))}>+ Add account</button>
    </div>
  );
}
```

---

### 2. Topbar

**Props:** None (uses store)

**State:**
- `paletteOpen` (command palette visibility)

**Behavior:**
- Display logged-in user name + avatar
- Search input triggers palette as you type
- ⌘K opens palette
- New Task button → create empty task, open drawer
- Sign out button → clear auth, navigate to login

**External calls:** None (all in-app)

```jsx
export function Topbar() {
  const { user, setSelectedTask } = useAppStore();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleNewTask = () => {
    // Create task in Supabase
    // setSelectedTask(newTaskId)
  };

  return (
    <div className="topbar">
      <div className="brand">Funnele</div>
      <Search onPaletteOpen={() => setPaletteOpen(true)} />
      <WhoAmI user={user} />
      <button onClick={handleNewTask}>+ New Task</button>
      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
```

---

### 3. Sidebar

**Props:** None (uses store)

**Behavior:**
- Show nav items: Dashboard, My Work, Inbox
- If admin, show Admin section: All Tasks, Hours, Team
- Show projects filtered by (admin OR has assigned tasks)
- Show member list with role badges
- Add Member button → new member form

**External calls:**
- `updateMember()` (edit member)
- `createMember()` (add user)

```jsx
export function Sidebar() {
  const { isAdmin, projects, members, currentView, setView } = useAppStore();
  const user = useAuth().user;

  return (
    <aside className="sidebar">
      <NavSection />
      {isAdmin && <AdminSection />}
      <ProjectsSection projects={projects} />
      {isAdmin && <AdminSection members={members} />}
    </aside>
  );
}
```

---

### 4. TaskList

**Props:**
- `tasks: Task[]`
- `groupBy: "project" | "assignee" | "status"`

**Behavior:**
- Render task rows grouped by specified dimension
- Each row shows: spine (age color), title, priority tag, status, avatar, age, due date
- Hover: highlight row, add shadow
- Click: select task, open drawer

**External calls:** None (view layer only)

```jsx
export function TaskList({ tasks, groupBy = "project" }) {
  const groups = groupTasksBy(tasks, groupBy);

  return (
    <div className="task-list">
      {Object.entries(groups).map(([groupKey, groupTasks]) => (
        <div key={groupKey}>
          <div className="group-h">{groupKey}</div>
          {groupTasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      ))}
    </div>
  );
}
```

---

### 5. TaskRow

**Props:**
- `task: Task`
- `isSelected: boolean`

**Behavior:**
- Show all meta: title, priority tag, status pill, assignee avatar, age, due date
- Left spine = color by age (calm → amber → red)
- Completed tasks: green spine, strikethrough title, lower opacity
- Click anywhere → open drawer

**External calls:** None

```jsx
export function TaskRow({ task, isSelected }) {
  const { setSelectedTask } = useAppStore();

  return (
    <div className={`row ${isSelected ? 'sel' : ''} ${isClosed(task) ? 'closed' : ''}`}
         onClick={() => setSelectedTask(task.id)}>
      <span className="spine" style={{ background: spine(task) }} />
      <span className="title">{task.title}</span>
      <div className="meta">
        <span className="tag">{PRIORITY_TAG[task.priority]}</span>
        <span className="status-pill">{task.status}</span>
        <Avatar id={task.assignee_id} />
        <span className="age">{ageDays(task.status_at)}d</span>
        <span className="due">{dueLabel(task.due_date).txt}</span>
      </div>
    </div>
  );
}
```

---

### 6. Drawer

**Props:**
- `open: boolean`
- `taskId: string | null`
- `onClose: () => void`

**State:**
- `task: Task` (from store)
- `title, notes, status, priority, assignee, due` (form state)
- `commentBody` (form input)

**Behavior:**
- Slide in from right
- Show task details (editable)
- Status dropdown triggers modal for status change
- Add comment form
- Delete button (admin only)
- Close button
- Auto-save on blur

**External calls:**
- `updateTask(taskId, updates)` (Supabase)
- `addComment(taskId, body)` (Supabase)
- `deleteTask(taskId)` (Supabase)

```jsx
export function Drawer({ open, taskId, onClose }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const task = useAppStore((s) =>
    s.tasks.find(t => t.id === taskId)
  );

  const handleUpdateTask = async (updates) => {
    await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);
    // Update store
  };

  const handleAddComment = async () => {
    await supabase
      .from("comments")
      .insert({
        task_id: taskId,
        author_id: currentUser.id,
        body: commentBody,
      });
    setCommentBody("");
  };

  return (
    <aside className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-h">
        <span className="id">{taskId?.toUpperCase()}</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="drawer-b">
        <textarea
          className="dtitle"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => handleUpdateTask({ title })}
        />
        {/* Fields for status, assignee, priority, due */}
        <textarea
          className="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => handleUpdateTask({ notes })}
        />
        <div className="comments">
          {/* Comment thread */}
          <textarea
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            placeholder="Add a comment"
          />
          <button onClick={handleAddComment}>Post</button>
        </div>
      </div>
    </aside>
  );
}
```

---

### 7. Palette (Command Palette)

**Props:**
- `open: boolean`
- `onClose: () => void`

**Behavior:**
- Search input: type to filter projects + tasks
- Results: projects first, then matching tasks
- Arrow keys to navigate, Enter to select
- Click to navigate/select
- Esc to close

**External calls:** None (search in-memory)

```jsx
export function Palette({ open, onClose }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const { projects, tasks } = useAppStore();

  useEffect(() => {
    if (!input) return;
    const q = input.toLowerCase();
    const matches = [
      ...projects.filter(p => p.name.toLowerCase().includes(q)).map(p => ({
        type: "project",
        label: p.name,
        action: () => setView("project", p.id),
      })),
      ...tasks
        .filter(t => t.title.toLowerCase().includes(q))
        .slice(0, 5)
        .map(t => ({
          type: "task",
          label: t.title,
          action: () => setSelectedTask(t.id),
        })),
    ];
    setResults(matches);
  }, [input]);

  return open ? (
    <div className="palette">
      <input
        autoFocus
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && results.length) results[0].action();
        }}
        placeholder="Search or create a task"
      />
      <div className="pal-list">
        {results.map((r, i) => (
          <div key={i} onClick={() => r.action()}>
            <span className="k">{r.type}</span>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;
}
```

---

### 8. MyWork (View)

**Props:** None (uses store)

**Behavior:**
- Show tasks assigned to current user
- Group by project
- Only show open tasks
- Apply filters (open, urgent, overdue)

```jsx
export function MyWork() {
  const { getVisibleTasks, projects, members } = useAppStore();
  const tasks = getVisibleTasks();
  const grouped = groupBy(tasks, "project_id");

  return (
    <div className="view">
      {Object.entries(grouped).map(([projectId, projectTasks]) => (
        <div key={projectId}>
          <div className="group-h">{projectName(projectId)}</div>
          <TaskList tasks={projectTasks} />
        </div>
      ))}
    </div>
  );
}
```

---

### 9. AllTasks (View, Admin Only)

**Props:** None

**Behavior:**
- Show all open + closed tasks
- Group by project
- Filter by status, priority, assignee

```jsx
export function AllTasks() {
  // Similar to MyWork but no assignee filter
  // Admin can see everything
}
```

---

### 10. Inbox (View)

**Props:** None

**Behavior:**
- Show incoming items from Teamwork/Fireflies
- Each item: source badge, title, evidence quote, project selector
- Accept button → create task in selected project
- Reject button → remove from inbox

**External calls:**
- `acceptInboxItem(inboxId, projectId)`
- `rejectInboxItem(inboxId)`

```jsx
export function Inbox() {
  const { inbox, projects } = useAppStore();

  const handleAccept = async (inboxId, projectId) => {
    const item = inbox.find(i => i.id === inboxId);
    // Create task
    await createTask({ project_id: projectId, title: item.title, ... });
    // Remove from inbox
  };

  return (
    <div className="view">
      {inbox.map(item => (
        <div key={item.id} className="inbox-item">
          <div className="header">
            <span className="source">{item.source}</span>
            <span className="title">{item.title}</span>
          </div>
          {item.evidence && <div className="evidence">{item.evidence}</div>}
          <select>
            {projects.map(p => <option value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => handleAccept(item.id, projectId)}>Accept</button>
          <button onClick={() => handleReject(item.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Other Components (Simplified)

- **Dashboard**: Admin summary (stats + upcoming tasks)
- **Team**: Member directory with task counts
- **Hours**: Time log summary (grouped by member, weekly/all-time)
- **Project**: Tasks for one client (filtered by project_id)
- **WhoAmI**: Current user avatar + dropdown (sign out)
- **Search**: Input that opens palette
- **Avatar**: User initials in circle, with role color
- **StatusPill**: Colored badge showing task status

---

## Styling Strategy

Use Tailwind + CSS variables from the prototype:

```css
:root {
  --ink: #0a0e27;
  --paper: #f5f3ff;
  --surface: #fff;
  --line: #e8e4f0;
  --muted: #6b7280;
  --accent: #d946ef;
  --growth: #f59e0b;
  --success: #10b981;
  --alert: #ef4444;
}
```

Apply via Tailwind config override:

```js
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      ink: "var(--ink)",
      paper: "var(--paper)",
      surface: "var(--surface)",
      // ... etc
    },
  },
};
```

Then use: `bg-surface text-ink border-line`

---

## Form Patterns

All forms should:
- Auto-save on blur (no "Save" button needed)
- Show spinner while saving
- Show error toast if request fails
- Revert to previous value on error

Example:

```jsx
const [value, setValue] = useState(task.title);
const [saving, setSaving] = useState(false);

const handleBlur = async () => {
  if (value === task.title) return; // No change
  setSaving(true);
  try {
    await updateTask(task.id, { title: value });
  } catch (e) {
    setValue(task.title); // Revert
    showError(e.message);
  } finally {
    setSaving(false);
  }
};
```
