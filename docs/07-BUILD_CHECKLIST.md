# Build Checklist — Funnele PM v1

## Pre-Build (Do This First)

- [ ] Create Supabase project at supabase.com
- [ ] Copy project URL + anon key → `.env.local`
- [ ] Copy service role key (keep secure)
- [ ] Create Vercel project, link to GitHub repo
- [ ] Create GitHub repo, initialize with:
  ```bash
  npm create vite@latest funnele-pm -- --template react
  cd funnele-pm
  npm install zustand @supabase/supabase-js @anthropic-ai/sdk
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  git init && git add . && git commit -m "init"
  git remote add origin <github-url>
  git push -u origin main
  ```

---

## Phase 1: Database & Auth (6 hours)

**Deliverable:** Supabase project with tables, RLS, seed data

### 1.1 Create Tables

**Steps:**
1. Copy SQL from `01-ARCHITECTURE.md` (schema section)
2. Go to Supabase → SQL Editor → New Query
3. Paste entire schema
4. Run (should see all tables created)
5. Verify each table exists in Tables list

**Check:** Open Supabase Data Browser. Should see:
- [ ] members
- [ ] projects
- [ ] tasks
- [ ] comments
- [ ] time_logs
- [ ] deliverables
- [ ] inbox
- [ ] organizations

### 1.2 Enable RLS

**Steps:**
1. For each table: Table Editor → RLS toggle ON
2. Create policies (copy from `01-ARCHITECTURE.md`)

**Check:**
- [ ] All tables have RLS enabled
- [ ] Can insert test row from SQL editor
- [ ] Insert from frontend will respect RLS

### 1.3 Seed Test Data

**File:** `scripts/seed.js`

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xxx.supabase.co",
  "xxx-service-role-key"
);

async function seed() {
  // Insert org
  const { data: org } = await supabase
    .from("organizations")
    .insert({ name: "Funnele Test", owner_id: "test-user-id" })
    .select()
    .single();

  // Insert members
  const members = await supabase
    .from("members")
    .insert([
      { org_id: org.id, name: "You", email: "you@funnele.com", role: "Admin" },
      { org_id: org.id, name: "Priya", email: "priya@funnele.com", role: "SEO" },
      { org_id: org.id, name: "Rahul", email: "rahul@funnele.com", role: "Web Developer" },
    ])
    .select();

  // Insert projects
  const projects = await supabase
    .from("projects")
    .insert([
      { org_id: org.id, name: "AllPrintHeads", state: "Active" },
      { org_id: org.id, name: "Valerie Madison", state: "Active" },
    ])
    .select();

  // Insert tasks
  await supabase
    .from("tasks")
    .insert([
      {
        org_id: org.id,
        project_id: projects[0].id,
        title: "Fix Meta commerce account",
        priority: "Urgent",
        status: "In Progress",
        assignee_id: members[3].id, // Nisha
      },
      // ... more tasks
    ])
    .select();

  console.log("✓ Seed data loaded");
}

seed().catch(console.error);
```

Run:
```bash
node scripts/seed.js
```

**Check:** Refresh Supabase Data Browser. Should see:
- [ ] Members table populated
- [ ] Projects table populated
- [ ] Tasks table populated

---

## Phase 2: React Setup (4 hours)

**Deliverable:** Working React app with routing, Zustand store, basic layout

### 2.1 Project Structure

**Steps:**
1. Create folders:
   ```bash
   mkdir -p src/{components,pages,hooks,store,lib,styles}
   ```
2. Copy files:
   - `02-TYPES.ts` → `src/lib/types.ts` (rename to .ts)
   - `03-CONSTANTS_STORE.js` → split into:
     - `src/lib/constants.js`
     - `src/store/appStore.js`
   - `05-HOOKS_API.js` → `src/hooks/`

### 2.2 Create Supabase Client

**File:** `src/lib/supabase.js`

```javascript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 2.3 Create Main Layout

**File:** `src/App.jsx`

```jsx
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTasks } from "./hooks/useTasks";
import { useMembers } from "./hooks/useMembers";
import { useProjects } from "./hooks/useProjects";
import { Topbar } from "./components/Topbar";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import useAppStore from "./store/appStore";

export default function App() {
  const { user, loading, logout } = useAuth();
  const { currentView } = useAppStore();

  // Load data
  useTasks();
  useMembers();
  useProjects();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  return (
    <div id="root">
      <Topbar user={user} onLogout={logout} />
      <div className="body">
        <Sidebar />
        <main className="main">
          {currentView === "my-work" && <MyWork />}
          {currentView === "inbox" && <Inbox />}
          {/* etc */}
        </main>
      </div>
    </div>
  );
}
```

### 2.4 Tailwind Configuration

**File:** `tailwind.config.js`

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e27",
        paper: "#f5f3ff",
        surface: "#fff",
        line: "#e8e4f0",
        muted: "#6b7280",
        accent: "#d946ef",
        growth: "#f59e0b",
        success: "#10b981",
        alert: "#ef4444",
      },
      fontFamily: {
        sans: ["Sohne", "system-ui"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
```

### 2.5 Global Styles

**File:** `src/styles/globals.css`

```css
@import url("https://fonts.googleapis.com/css2?family=Sohne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --ink: #0a0e27;
  --paper: #f5f3ff;
  --surface: #fff;
  --line: #e8e4f0;
  --muted: #6b7280;
  --accent: #d946ef;
  --growth: #f59e0b;
}

html,
body {
  @apply h-screen overflow-hidden;
}

#root {
  @apply h-screen flex flex-col bg-paper text-ink font-sans;
}

/* Copy remaining styles from prototype HTML */
```

**Check:**
- [ ] `npm run dev` works
- [ ] Page loads with blue gradient branding
- [ ] No console errors

---

## Phase 3: Auth & Layout Components (8 hours)

**Deliverable:** Login screen, Topbar, Sidebar, task list UI

### 3.1 Login Component

Use spec from `04-COMPONENT_SPECS.md`. Create:
- `src/components/Login.jsx`

Should:
- [ ] Fetch users from Supabase
- [ ] Show user grid
- [ ] "Add new user" button
- [ ] Sign in logic
- [ ] Redirect to dashboard

### 3.2 Topbar Component

Create: `src/components/Topbar.jsx`

Should have:
- [ ] Logo + branding
- [ ] Search input
- [ ] User avatar + dropdown
- [ ] New Task button
- [ ] Sign out button
- [ ] Command palette (Palette component)

### 3.3 Sidebar Component

Create: `src/components/Sidebar.jsx`

Should have:
- [ ] Nav items (My Work, Inbox, etc.)
- [ ] Project list (filtered by visibility)
- [ ] Admin section (if admin)
- [ ] Active indicator

### 3.4 TaskList & TaskRow

Create:
- `src/components/TaskList.jsx`
- `src/components/TaskRow.jsx`

Should:
- [ ] Display tasks in rows
- [ ] Group by project/status
- [ ] Show spine color (age-based)
- [ ] Show priority tag, status pill, avatar, age, due date
- [ ] Click to select task

### 3.5 Palette (Command Palette)

Create: `src/components/Palette.jsx`

Should:
- [ ] Open with ⌘K
- [ ] Search projects + tasks
- [ ] Navigate on Enter
- [ ] Close on Esc

**Check:**
- [ ] All components render without errors
- [ ] Sidebar nav works
- [ ] Task rows display correctly
- [ ] Can click task to select it
- [ ] Palette opens/closes

---

## Phase 4: Drawer Component (6 hours)

**Deliverable:** Full task detail editor with auto-save

### 4.1 Create Drawer

File: `src/components/Drawer.jsx`

Should have:
- [ ] Task title (editable textarea)
- [ ] Status dropdown
- [ ] Priority dropdown
- [ ] Assignee dropdown (admin only)
- [ ] Due date picker
- [ ] Notes textarea
- [ ] Comment section
- [ ] Delete button (admin only)

### 4.2 Implement Auto-Save

For each field:
```jsx
const [title, setTitle] = useState(task.title);

const handleBlur = async () => {
  if (title === task.title) return;
  try {
    await updateTask(task.id, { title });
  } catch (e) {
    setTitle(task.title); // Revert
    showError(e.message);
  }
};

return (
  <textarea
    value={title}
    onChange={e => setTitle(e.target.value)}
    onBlur={handleBlur}
  />
);
```

### 4.3 Comments Section

Should:
- [ ] Load comments from Supabase
- [ ] Display newest first
- [ ] Add comment form with author + timestamp
- [ ] Post button

**Check:**
- [ ] Click task → drawer opens
- [ ] Edit fields → auto-save to Supabase
- [ ] Refresh page → changes persist
- [ ] Add comment → appears in real-time

---

## Phase 5: Views (8 hours)

**Deliverable:** All page views working (My Work, All Tasks, Inbox, Team, Hours)

### 5.1 MyWork View

File: `src/pages/MyWork.jsx`

```jsx
export function MyWork() {
  const tasks = useAppStore(s => s.getVisibleTasks());
  const grouped = groupBy(tasks.filter(t => t.assignee_id === currentUser.id), "project_id");
  
  return (
    <div className="view">
      {Object.entries(grouped).map(([projectId, tasks]) => (
        <div key={projectId}>
          <GroupHeader name={projectName(projectId)} count={tasks.filter(t => !isClosed(t)).length} />
          {tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      ))}
    </div>
  );
}
```

### 5.2 AllTasks View (Admin Only)

Similar to MyWork but show ALL tasks (no assignee filter).

### 5.3 Inbox View

File: `src/pages/Inbox.jsx`

Should:
- [ ] Show inbox items from Supabase
- [ ] Each item has: source, title, evidence, project selector
- [ ] Accept button → creates task
- [ ] Reject button → removes item

### 5.4 Team View (Admin Only)

File: `src/pages/Team.jsx`

Should:
- [ ] List all team members
- [ ] Show role + task count
- [ ] Add Member button

### 5.5 Hours View (Admin Only)

File: `src/pages/Hours.jsx`

Stub for now (time logging is v2). Show:
- [ ] Time log summary (grouped by member)

**Check:**
- [ ] Switch between views
- [ ] Correct data displayed for each view
- [ ] Admin-only views hidden for non-admins
- [ ] Filters work (open, urgent, overdue)

---

## Phase 6: Styling Polish (4 hours)

**Deliverable:** Matches prototype design exactly

### 6.1 Review Design

Go through prototype (`funnele-pm-final.html`) and list:
- [ ] Topbar styling (height, spacing, shadows)
- [ ] Sidebar styling (width, hover, active states)
- [ ] Task row styling (spine, hover, selection)
- [ ] Drawer styling (width, shadows, animation)
- [ ] Color accuracy (test on macOS + Windows)
- [ ] Typography (font sizes, weights, line heights)
- [ ] Spacing consistency (padding, margins, gaps)
- [ ] Responsive behavior (mobile sidebar hide, drawer full-width)

### 6.2 Create CSS Utilities

Add custom Tailwind components in `src/styles/globals.css`:

```css
@layer components {
  .topbar {
    @apply h-[52px] flex items-center gap-5 px-6 border-b border-line bg-surface;
  }
  .sidebar {
    @apply w-60 border-r border-line bg-surface overflow-y-auto;
  }
  .row {
    @apply flex items-center gap-3 px-7 py-0 bg-surface border-b border-line-soft cursor-pointer transition-all hover:bg-paper;
  }
  .drawer {
    @apply fixed top-0 right-0 bottom-0 w-[440px] bg-surface border-l border-line z-40 flex flex-col transform translate-x-full transition-transform;
  }
  .drawer.open {
    @apply translate-x-0;
  }
}
```

### 6.3 Test Responsive

- [ ] Resize to 375px → sidebar hides, drawer full-width
- [ ] Topbar buttons don't overflow
- [ ] Text is readable on mobile

**Check:**
- [ ] Design matches prototype visually
- [ ] No jarring color mismatches
- [ ] Shadows/depth feels right
- [ ] Font rendering looks good

---

## Phase 7: Real-time Subscriptions (4 hours)

**Deliverable:** Tasks update in real-time across tabs/users

### 7.1 Implement Subscriptions

Update `useTasks()` hook (from `05-HOOKS_API.js`):

```javascript
useEffect(() => {
  // Subscribe to task changes
  const subscription = supabase
    .from("tasks")
    .on("*", (payload) => {
      if (payload.eventType === "INSERT") {
        // Add task to store
      } else if (payload.eventType === "UPDATE") {
        // Update task in store
      } else if (payload.eventType === "DELETE") {
        // Remove from store
      }
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 7.2 Test Real-Time

- [ ] Open 2 browser tabs
- [ ] In tab 1, create task → appears in tab 2 immediately
- [ ] In tab 1, change status → updates in tab 2 in real-time
- [ ] In tab 1, add comment → appears in tab 2

**Check:**
- [ ] All data syncs across tabs without refresh
- [ ] No duplicate events
- [ ] Updates are fast (< 500ms latency)

---

## Phase 8: Testing (3 hours)

**Deliverable:** All critical tests pass

Use `TESTING_QUICK_START.md`:

- [ ] T1: Permissions isolation (non-admin can't see admin controls)
- [ ] T2: Task visibility (only assigned tasks shown to team members)
- [ ] T3: Data persists after refresh
- [ ] T4: Status changes work (dropdown + drawer)
- [ ] T5: Comments post successfully
- [ ] T6: Mobile responsive (drawer full-width at 375px)
- [ ] T7: Palette search works (⌘K opens, filters projects/tasks)
- [ ] T8: Real-time sync (2 tabs stay in sync)

Document any failures + fixes in issues.

---

## Phase 9: Deployment (1 hour)

**Deliverable:** Live on Vercel

### 9.1 Environment Variables

In `.env.local`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### 9.2 Vercel Deployment

1. Push to GitHub
   ```bash
   git add . && git commit -m "v1 complete" && git push
   ```

2. Vercel auto-deploys (or trigger manually)

3. Add environment variables in Vercel → Project → Settings → Environment Variables

4. Redeploy

### 9.3 Custom Domain (Optional)

- [ ] Point domain to Vercel
- [ ] Test at custom URL

**Check:**
- [ ] Live at vercel URL
- [ ] All features work
- [ ] No console errors
- [ ] Load time < 3s

---

## Post-Launch Checklist

- [ ] Share link with team (Priya, Rahul, etc.)
- [ ] Gather feedback (1-2 hours)
- [ ] Document bugs/improvements
- [ ] Plan v2 roadmap:
  - Time logging UI
  - Teamwork webhook integration
  - Fireflies extraction
  - Email notifications
  - Board/Kanban view

---

## Effort Summary

| Phase | Hours | Status |
|---|---|---|
| 1: Database | 6 | |
| 2: React setup | 4 | |
| 3: Auth + layout | 8 | |
| 4: Drawer | 6 | |
| 5: Views | 8 | |
| 6: Styling | 4 | |
| 7: Real-time | 4 | |
| 8: Testing | 3 | |
| 9: Deployment | 1 | |
| **TOTAL** | **44 hours** | **~1 week solo** |

This is faster than the 61-hour estimate because we're deferring:
- Time logging UI (schema ready, UI in v2)
- Integrations (API specs ready, webhooks in v2)
- Notifications (deferred, v2)
- Board view (list mode ships, board in v2)
