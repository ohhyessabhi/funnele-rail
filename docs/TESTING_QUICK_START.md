# Aggressive Testing Quick Start

## What Comes Pre-Loaded

Open `funnele-pm-final.html` and you get instant sample data:

### Teams
- You (Admin)
- Priya (SEO)
- Rahul (Web Developer)
- Nisha (Meta Ads)
- Arun (Email Marketing)

### Clients
- AllPrintHeads (Active) — 3 tasks
- Valerie Madison (Active) — 3 tasks
- EG Roofing (Paused) — 1 task

### Real-World Tasks
- Meta commerce account broken (Nisha, Urgent, 4d old) ← **STALE**
- Email nurture sequence (Arun, 3d old)
- Client review blocking (Abhi, 6d old) ← **VERY STALE**
- Completed Q3 report (Abhi, Approved)
- Mobile speed (Rahul, Revision Required)
- Unassigned landing page setup (nobody assigned)

Use these to stress-test. Everything is real-ish. No placeholder garbage.

---

## 5-Minute Aggressive Test

Run this to find 80% of bugs:

### 1. Permissions (2 min)
```
1. Sign in as "You" (Admin)
   → See "Admin" nav section
2. Add new user: name "Tester", role "PM"
   → Member appears in sidebar
3. Sign out, sign in as "Tester"
   → NO admin nav
   → See only their tasks (should be 0)
4. Sign out, sign in as Priya (SEO)
   → See 2 tasks in "My work" (AllPrintHeads + Valerie Madison)
   → NO other team members' tasks
```

**STOP if:** Tester sees admin controls, or Priya sees Rahul's tasks

### 2. Data Integrity (2 min)
```
1. As "Tester", create 3 tasks rapid-fire
   → All appear in list
2. Refresh page
   → All 3 still there
3. Assign one to Priya
   → Priya now sees it in "My work"
```

**STOP if:** Tasks vanish after refresh, or assignment doesn't sync

### 3. UI Responsiveness (1 min)
```
1. Click task "Fix Meta commerce account restriction"
   → Drawer opens right side
   → Can read full title, notes
2. Change status to "In Progress"
   → Row updates immediately
3. Add comment "Update: Meta support escalated"
   → Comment appears with your name + timestamp
4. Close drawer (X button)
   → Drawer closes smoothly, row shows updated status
```

**STOP if:** Drawer doesn't open, status doesn't update, comment doesn't save

---

## Next-Level Tests (Run if 5-min passed)

### Unassigned Tasks
```
As Admin:
1. Create task "Unassigned test"
2. Leave Owner blank
3. Switch to Priya → Task NOT in "My work" ✓
4. Switch to Admin → Task appears in "All tasks" with gray avatar ✓
5. Assign to Priya → Priya now sees it ✓
```

### Long Text
```
1. Create task with 300+ char title
   → In list: truncated (ellipsis)
   → In drawer: full title visible
2. Add 2000-char comment
   → Drawer doesn't break, text wraps
3. Add 5000-char note
   → Note scrolls in drawer, no layout explosion
```

### Status Transitions
```
1. Find task in "Backlog"
2. Click status pill → dropdown menu → "Ready"
   → Row updates immediately
3. Open drawer, change to "In Progress"
   → Drawer updates, row updates
4. Refresh
   → Status persists as "In Progress"
```

### Mobile (if on desktop)
```
1. Right-click → Inspect → Device Toolbar (375px width)
2. Sidebar should hide
3. Click task → Drawer opens full width
4. All buttons/inputs should be accessible
5. Scroll should work without overflow
```

---

## What to Do When You Find a Bug

### Format for Bug Report
```
TITLE: [Area] What broke
STEPS:
1. Do this
2. Then that
3. Expected X
4. Got Y instead

ENVIRONMENT: 
- Browser: Chrome/Safari/Firefox
- OS: Mac/Windows/Linux
- User role: Admin/SEO/etc
- Sample affected: [task ID or name]

SEVERITY: Critical/High/Medium/Low
- Critical: blocks core feature (permissions, save)
- High: breaks common workflow (status change, comment)
- Medium: UI glitch (alignment, spacing)
- Low: edge case (single-word names, etc)
```

### Critical Bugs (Stop Testing)
- Non-admin sees admin controls
- Task visible to wrong team member
- Data doesn't persist after refresh
- Drawer opens but closes immediately
- Create task button does nothing

### High Bugs (Log & Continue)
- Status doesn't update in row
- Comment doesn't appear after posting
- Mobile drawer doesn't close
- Search returns nothing

### Medium Bugs (Log & Continue)
- Button text misaligned
- Avatar color inconsistent
- Spacing off between sections
- Font weight looks wrong

---

## Branding Changes (Funnele Edition)

### Visual Identity
| Element | Change | Why |
|---|---|---|
| **Logo** | "f" + "unnele" | Clean, gradient, stands out |
| **Colors** | Magenta (pink-purple) → growth orange, accent throughout | Growth-focused, energy, modern |
| **Fonts** | Sohne (sans-serif) + JetBrains Mono | Premium, readable at all sizes |
| **Gradient** | #d946ef → #a855f7 (magenta to purple) | Movement, not static |
| **Spacing** | Increased (18px gaps vs 12px) | More breathing room, premium feel |
| **Shadows** | Subtle depth (0 4px 12px rgba...) | Elevation, hierarchy |

### Copy Changes
| Before | After | Tone |
|---|---|---|
| "Dashboard" | "My work" | Action-oriented |
| "All work" | "All tasks" | Growth teams speak tasks, not work |
| "Search tasks" | "Search or create a task" | Empowers quick creation |
| "Time log" | "Hours" | Shorter, tighter |
| "No clients yet" | "No clients yet" | Same (good enough) |

### Components Elevated
- **Buttons:** More depth (shadows), smoother hover (transform: translateY)
- **Cards:** Gradient backgrounds, better contrast
- **Avatars:** Glowing effect on assignment (box-shadow with accent color)
- **Focus states:** Thicker outline (3px vs 2px), snappier
- **Palette:** Better visual hierarchy, cleaner spacing

### Voice
Before: Neutral, bland
After: Direct, actionable, agency-minded

"Get back to work" → "welcome to Funnele" (implies you know what you're doing)
"Your work only" → "Showing only your work" (passive, more admin-y, but accurate)

---

## Performance Baselines

After sample data loads, measure:

| Metric | Target | How to Check |
|---|---|---|
| First load | < 1s | DevTools Network tab, Disable cache |
| Task creation | < 300ms | Click + New task, should appear immediately |
| Comment post | < 200ms | Type comment, click Post, should render |
| Drawer open | < 200ms | Click task, drawer slides in (visual) |
| Search (palette) | < 100ms | Type, results appear snappy |
| Page refresh | < 500ms with data | F5, data restores from storage |

If any exceed targets, dig into:
- Storage.get() calls (should be <50ms)
- render() function complexity (check console timer)
- DOM updates (how many rows redrawn?)

---

## Success Criteria

| Criteria | Check |
|---|---|
| Permissions airtight | Non-admin CANNOT see other team members' tasks | ✓ |
| Data persists | Refresh = same state | ✓ |
| UX responsive | No lag when creating/editing/commenting | ✓ |
| Mobile works | All interactive elements accessible at 375px | ✓ |
| Branding feels right | Looks/feels like a growth agency tool | ✓ |
| Real tasks work | Sample data behaves like production data | ✓ |

**LAUNCH READY when:** All ✓

---

## Next Steps After Testing

If all tests pass:

1. **Screenshot branding** — Take 5-6 screenshots for your portfolio/pitch deck
2. **Document APIs** — How external services (Teamwork, Fireflies) will integrate
3. **Estimate production build** — Use this as prototype. Production needs:
   - Supabase + Auth
   - Real-time sync (websockets or subscriptions)
   - Role-based data filtering (RLS policies)
   - Time logging + billing
   - Email notifications
4. **Pitch to team** — Show Priya, Rahul, Nisha. Get feedback on workflows
5. **Decide: Buy ClickUp or Build Rail?** — This prototype should inform that decision
