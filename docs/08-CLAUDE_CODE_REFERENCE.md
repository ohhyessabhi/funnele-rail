# Claude Code Quick Reference

## Copy-Paste Commands

### Setup
```bash
npm create vite@latest funnele-pm -- --template react
cd funnele-pm
npm install zustand @supabase/supabase-js @anthropic-ai/sdk
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

### Environment (.env.local)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Folder Structure
```bash
mkdir -p src/{components,pages,hooks,store,lib,styles}
```

---

## File Locations

| File | Destination | Size |
|---|---|---|
| 02-TYPES.ts | src/lib/types.ts | 250 lines |
| 03-CONSTANTS_STORE.js | Split into: src/lib/constants.js + src/store/appStore.js | 400 lines |
| 05-HOOKS_API.js | src/hooks/ | 350 lines |
| 04-COMPONENT_SPECS.md | Reference while building components | — |
| 06-INTEGRATIONS.md | Reference + copy handlers later | — |

---

## Key Imports (Copy into Components)

```javascript
import useAppStore from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useComments } from "@/hooks/useComments";
import { supabase } from "@/lib/supabase";
import { STATUSES, PRIORITIES, ROLES, initials, ageDays, spine } from "@/lib/constants";
```

---

## Component Skeleton

```jsx
import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";

export function ComponentName() {
  const store = useAppStore();
  const [state, setState] = useState(null);

  useEffect(() => {
    // Initialize
  }, []);

  return (
    <div className="component">
      {/* JSX here */}
    </div>
  );
}

export default ComponentName;
```

---

## Common Patterns

### Auto-Save on Blur
```jsx
const handleBlur = async () => {
  if (value === original) return; // No change
  try {
    await supabase.from("table").update({ field: value }).eq("id", id);
    // Update store
  } catch (e) {
    setValue(original); // Revert
    console.error(e);
  }
};
```

### Fetch + Subscribe
```jsx
useEffect(() => {
  // Fetch initial data
  const fetch = async () => {
    const { data } = await supabase.from("table").select("*");
    setData(data);
  };

  fetch();

  // Subscribe to changes
  const sub = supabase.from("table").on("*", (payload) => {
    if (payload.eventType === "INSERT") {
      setData(d => [...d, payload.new]);
    }
  }).subscribe();

  return () => sub.unsubscribe();
}, []);
```

### Conditional Render (Admin Only)
```jsx
const { isAdmin } = useAppStore();

return (
  <>
    {isAdmin && <AdminPanel />}
  </>
);
```

### Group by Field
```javascript
const grouped = tasks.reduce((acc, task) => {
  const key = task.project_id || "unassigned";
  if (!acc[key]) acc[key] = [];
  acc[key].push(task);
  return acc;
}, {});

// Use: Object.entries(grouped).map(([key, items]) => ...)
```

---

## Styling Quick Reference

### Common Classes
```
.topbar          h-[52px] flex items-center gap-5 px-6 border-b border-line bg-surface
.sidebar         w-60 border-r border-line bg-surface overflow-y-auto
.main            flex-1 flex flex-col min-w-0
.row             flex items-center gap-3 px-7 py-0 bg-surface border-b cursor-pointer
.row.sel         bg-accent-light
.row.closed      opacity-60
.drawer          fixed top-0 right-0 w-[440px] h-screen bg-surface transform translate-x-full transition-transform
.drawer.open     translate-x-0
.viewhead        border-b border-line bg-surface px-7 py-5
.title           font-semibold text-ink truncate
.spine           w-1 flex-0 flex-0 h-full (apply bg color)
```

### Responsive
```
sm: 640px   md: 768px   lg: 1024px   xl: 1280px
```

At < 920px: sidebar hidden, drawer full-width
```css
@media (max-width: 920px) {
  .sidebar { display: none; }
  .drawer { width: 100%; }
}
```

---

## Tailwind Color Vars

```jsx
className="bg-surface text-ink border-line hover:bg-paper"
className="text-accent font-semibold"
className="bg-alert/10 text-alert" // Reduced opacity
className="hover:shadow-lg"
```

### Custom Colors (in tailwind.config.js)
```javascript
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
}
```

---

## Debugging Checklist

### Page Blank?
- [ ] Check console for errors
- [ ] Verify Supabase connection (try fetch in console: `supabase.from("tasks").select("*")`)
- [ ] Check RLS policies (try as admin user first)

### Store Not Updating?
- [ ] Verify action is being called: `console.log("Setting tasks:", data)`
- [ ] Check Zustand devtools: `open("https://chrome.google.com/webstore")` → Zustand DevTools extension
- [ ] Verify subscription is active: look for "SET subscriptions" in network tab

### Permissions Issue?
- [ ] Check current user role: `useAppStore(s => s.user?.role)`
- [ ] Verify RLS policy allows SELECT: try in Supabase SQL editor
- [ ] Check auth token in headers: browser DevTools → Network → request headers

### Real-time Not Syncing?
- [ ] Check WebSocket connection: DevTools → Network → filter by "WS"
- [ ] Verify subscription is active: console.log in useEffect
- [ ] Reload page (sometimes subscriptions drop)

---

## Testing Checklist (5 min)

Run this after each major phase:

```
1. Login → see dashboard
2. Create task → appears in list
3. Edit task title → auto-save works
4. Change status → updates immediately
5. Add comment → appears with name + timestamp
6. Refresh → all data persists
7. Open 2 tabs → changes sync across tabs
8. Resize to 375px → drawer full-width
9. As non-admin → can't see all-tasks view
10. Sign out → login screen appears
```

If any fail: debug before moving on.

---

## Git Workflow

```bash
# Start phase
git checkout -b phase-1-database

# Make changes, commit frequently
git add src/
git commit -m "Add Drawer component"

# When phase done
git push origin phase-1-database
git checkout main
git merge phase-1-database
git push origin main

# Next phase
git checkout -b phase-2-react-setup
```

---

## Vercel Deployment

### First Time
1. Connect GitHub repo to Vercel
2. Add env vars: Settings → Environment Variables
3. Trigger deploy: `git push`

### Updates
```bash
git push origin main  # Auto-deploys on Vercel
# Check deployment at vercel.com
```

### Environment Variables (Vercel UI)
```
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = xxx
```

---

## Performance Tips

- **Avoid re-renders**: Use `useCallback` for event handlers
- **Memoize selectors**: `useAppStore(s => s.tasks)` only re-renders if tasks change
- **Lazy load**: Use `React.lazy()` for heavy components
- **Debounce search**: Wrap search input with 300ms debounce
- **Image optimization**: Use next/image or webp format

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Cannot read property 'id' of null` | User not loaded | Add loading check in useAuth |
| `RLS policy violation` | Accessing other user's data | Check auth user matches task.assignee_id |
| `Subscription already active` | Multiple subscriptions on same table | Add cleanup function to useEffect |
| `Tailwind not applying` | CSS not imported | Check `import "@/styles/globals.css"` in main.jsx |
| `CORS error` | Supabase anon key wrong | Verify in `.env.local` |
| `Page reload loses state` | Not using Zustand persist | Add persist middleware to store |

---

## Quick Terminal Commands

```bash
npm run dev              # Start dev server
npm run build           # Build for prod
npm run preview         # Preview prod build locally
npm run lint            # ESLint (if configured)
npm run test            # Vitest (if configured)
```

---

## Most Important Files to Get Right

1. **src/store/appStore.js** — All state logic lives here
2. **src/lib/supabase.js** — Connection to backend
3. **src/hooks/useAuth.js** — Auth lifecycle
4. **src/hooks/useTasks.js** — Real-time subscriptions
5. **src/App.jsx** — Main routing + layout

Get these 5 rock-solid, everything else is UI.

---

## When Stuck

1. **Check console** for errors
2. **Read the test checklist** (probably a known issue)
3. **Ask Claude Code** with the error message + what you were doing
4. **Check Supabase dashboard** (Data Browser, RLS policies, logs)
5. **Revert last change** and try incrementally

---

## Ship Checklist (Before Deploying)

- [ ] No console errors
- [ ] All 10 tests from "Testing Checklist (5 min)" pass
- [ ] Permissions enforced (team member can't see admin controls)
- [ ] Real-time sync working (2 tabs)
- [ ] Mobile responsive (test at 375px)
- [ ] Environment variables set in Vercel
- [ ] Database RLS policies in place
- [ ] Team has accounts in Supabase

If all ✓: **Ready to ship.** Push to main, deploy to Vercel.

---

## Resources

- **React DevTools**: Chrome extension for debugging state
- **Zustand DevTools**: Chrome extension for store debugging
- **Supabase Studio**: https://app.supabase.com/
- **Vercel Dashboard**: https://vercel.com/
- **Tailwind Play**: https://play.tailwindcss.com/ (test classes)

---

Print this and keep it handy. Refer back when you need a quick answer.
