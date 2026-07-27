# Funnele PM — Priority Testing Matrix

## Critical Path Tests (Do First)

### T1: Permissions Isolation (BLOCKER)
**Scenario:** Non-admin team member cannot access admin controls

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Open fresh browser, sign in as "You" (Admin) | See Admin nav section (All tasks, Hours, Team) + admin sidebar | ✓ |
| 2 | Add new account: name "Priya", role "SEO" | Account created, appears in "Team" view | ✓ |
| 3 | Refresh page, sign in as Priya | NO Admin nav section visible | TEST |
| 4 | Try to access URL `?view=admin` or edit URL | Stays in "My work", no access | TEST |
| 5 | Inspect browser console, modify `isAdmin()` to return true | Should NOT grant access (role is read-only) | TEST |

**Failure mode:** Priya sees admin controls → STOP, fix auth logic

---

### T2: Task Visibility (BLOCKER)
**Scenario:** Admin creates task assigned to Priya. Priya sees ONLY her task. Other team members see nothing.

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | As Admin, click "+ New task", fill "Test task for Priya", click outside | Task appears in Admin's "All tasks" view | ✓ |
| 2 | In drawer, change Owner to "Priya" | Priya is now assignee | TEST |
| 3 | Close drawer, sign out (top right) | Login screen appears | TEST |
| 4 | Sign in as Priya | Task appears in "My work" (count badge shows 1) | TEST |
| 5 | Sign in as Rahul (Dev) | Task does NOT appear in "My work" | TEST |
| 6 | Sign in as Admin again, view "All tasks" | Task still shows with Priya as owner | TEST |

**Failure mode:** Task visible to Rahul → STOP, fix row filtering

---

### T3: Unassigned Task Handling
**Scenario:** Task created without owner. Only admin can see it. Team members can't claim it (yet).

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | As Admin, create task, leave Owner empty | Task appears in "All tasks" with gray avatar (Unassigned) | TEST |
| 2 | Assign to Priya | Priya sees it immediately | TEST |
| 3 | Re-assign to Unassigned | Priya can no longer see it in "My work" | TEST |

**Failure mode:** Team member sees unassigned work they didn't create → potential confusion

---

## Data Integrity Tests (Do Second)

### T4: Rapid Save Stress
**Scenario:** Add 5 tasks in succession. All persist on refresh.

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Create tasks: "Task 1", "Task 2", ... "Task 5" rapidly (2 sec each) | All 5 appear in list | TEST |
| 2 | Refresh page | All 5 still there | TEST |
| 3 | Check browser DevTools → Application → Storage → shows all data | JSON in storage is valid | TEST |

**Failure mode:** Tasks 3–5 missing after refresh → storage write race condition

---

### T5: Long Text Handling
**Scenario:** Very long task title, comment, or notes don't break UI

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Create task with 300-char title | Title truncates in list view (ellipsis), full shown in drawer | TEST |
| 2 | Add 500-char comment | Comment wraps in drawer, doesn't overflow | TEST |
| 3 | Add 5000-char note | Note scrolls in drawer without breaking layout | TEST |

**Failure mode:** Drawer expands off-screen or text breaks boxes → UI breaks

---

### T6: Concurrent Edit Simulation
**Scenario:** Open 2 browser tabs. Edit same task in both. Last write wins (documented).

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Tab 1: Open task drawer, change title to "Tab 1 Edit" | Drawer shows new title | TEST |
| 2 | Tab 2: Refresh page, open same task, change title to "Tab 2 Edit" | Drawer shows "Tab 2 Edit" | TEST |
| 3 | Tab 1: Change priority, close drawer | Save happens | TEST |
| 4 | Tab 2: Refresh | Does it show Tab 1's priority change? | TEST |

**Expected behavior:** Last write (Tab 2 refresh) wins. Document in production roadmap: needs server-side conflict resolution.

---

## UX Edge Cases (Do Third)

### T7: Status Change Flow
**Scenario:** Changing status via row dropdown vs drawer both trigger save

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Find a task in "Backlog" | Row shows status pill "Backlog" | ✓ |
| 2 | Click status pill, change to "Ready" | Status pill updates immediately | TEST |
| 3 | Close/reopen drawer | Status still shows "Ready" | TEST |
| 4 | In drawer, change to "In Progress" | Drawer updates, row updates | TEST |

**Failure mode:** Status in row doesn't sync with drawer → confusion

---

### T8: Empty Fields & Defaults
**Scenario:** Create task with empty title. What happens?

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Click "+ New task" | Task created with placeholder "New task" | TEST |
| 2 | Leave title empty, blur field | Should either reject OR default to "Untitled" | TEST |
| 3 | Leave priority empty | Should default to "Normal" | TEST |
| 4 | Leave due date empty | Due column should show blank, no error | TEST |

**Failure mode:** Empty title saves as blank string → breaks row display

---

### T9: Mobile Responsiveness (320px width)
**Scenario:** View on phone. Sidebar hides, drawer works full-width.

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Resize browser to 375px width (or inspect mobile) | Sidebar disappears, main area full-width | TEST |
| 2 | Click task → drawer opens full screen | Drawer readable, drawer close button accessible | TEST |
| 3 | Try to scroll in drawer | Vertical scroll works, doesn't break layout | TEST |
| 4 | Topbar buttons | No overlap, all clickable | TEST |

**Failure mode:** Buttons stack awkwardly or drawer doesn't close on mobile

---

### T10: Palette Search
**Scenario:** ⌘K opens command palette. Search filters projects + tasks

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Press ⌘K (or Cmd+K on Mac) | Palette opens, input focused | TEST |
| 2 | Type "allprint" | Shows "AllPrintHeads" as option | TEST |
| 3 | Click it | Navigates to AllPrintHeads project view | TEST |
| 4 | Press ⌘K again, type "Meta fix" | Shows matching task "Fix Meta commerce account restriction" | TEST |
| 5 | Click task | Drawer opens with that task | TEST |

**Failure mode:** Search returns nothing, or clicking doesn't navigate

---

## Permission Bypass Attempts (Do Last)

### T11: Direct URL Manipulation
**Scenario:** Can a non-admin modify URL to access admin views?

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | As Priya, open DevTools console | Type: `view = {type: 'all', id: null}; render();` | TEST |
| 2 | Does "All tasks" view load? | Should NOT show tasks from other team members (filtered at render) | TEST |
| 3 | Try to edit localStorage to change currentUser | Edit storage, refresh | Should re-load as correct user (honors last saved state) | TEST |

**Expected:** Frontend filtering is strong enough. Backend (if built) will enforce role-based access.

---

### T12: Hidden Input Disclosure
**Scenario:** Admin only sees certain fields. Can non-admin unhide them?

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | As Priya, open task drawer | See: Status, Priority, Due. NO Owner/Client selectors | ✓ |
| 2 | Inspect HTML, unhide "Client" select field | Field appears (visual only) | TEST |
| 3 | Try to change client, save | Should NOT save (backend enforces). If stored locally, it's cosmetic only | TEST |

**Expected:** Client field is conditionally rendered. Unhiding doesn't grant permission to change data.

---

## Known Limitations (Document)

| Issue | Impact | Current Behavior | Fix in v2 |
|---|---|---|---|
| No server sync | Concurrent edits can conflict | Last write in browser wins | Use Supabase real-time |
| No role-based field visibility | Users see irrelevant fields | Conditionally rendered in drawer | Add role-based schema |
| No audit trail | Can't track who changed what | No history logged | Add `taskHistory` table |
| No time logging | Can't bill clients | Time tracking deferred | Add time_logs table + UI |
| No email notifications | Teams don't know when assigned | Everything in-app only | Add Resend email integration |

---

## Test Results Summary

After running all tests, fill this:

| Category | Pass | Fail | Notes |
|---|---|---|---|
| Permissions | _ | _ | |
| Data integrity | _ | _ | |
| UX/navigation | _ | _ | |
| Mobile | _ | _ | |
| Edge cases | _ | _ | |
| **TOTAL** | _ | _ | |

**Go/No-Go for production:** At least 90% pass = GREEN
