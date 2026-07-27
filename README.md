# Funnele PM

A lightweight agency project-management tool — permission-based task isolation,
real-time sync, and Funnele branding. Built from the spec package in
[`docs/`](docs/) (React 18 + Vite + Zustand + Supabase).

> **Status:** v1 code complete. The build could **not** be compiled/run in the
> environment it was authored in because Node.js wasn't installed there — run
> the steps below on your machine to bring it up. See
> [Verification status](#verification-status).

---

## Quick start

```bash
# 1. Install dependencies (Node 18+ required)
npm install

# 2. Configure Supabase
cp .env.local.example .env.local
#    then edit .env.local and paste your Project URL + anon key
#    (Supabase -> Project Settings -> API)

# 3. Create the database schema + RLS + realtime
#    Supabase -> SQL Editor -> New Query -> paste supabase/migrations/001_init_schema.sql -> Run

# 4. (Optional) seed demo data — needs the service role key in .env.local
npm run seed

# 5. Run
npm run dev
```

Open http://localhost:5173. If you seeded, log in as `you@funnele.com` /
`Funnele#2026` (Admin).

---

## Project structure

```
src/
  components/   Login, Topbar, Sidebar, TaskList, TaskRow, Drawer, Palette, Avatar, Toast
  pages/        Dashboard, MyWork, AllTasks, Inbox, Team, Hours, Project
  hooks/        useAuth, useTasks, useMembers, useProjects, useInbox, useComments, useVisibleTasks
  store/        appStore.js (Zustand)
  lib/          supabase.js, api.js (writes), constants.js, utils.js
  styles/       globals.css (ported from the prototype for a pixel match)
supabase/
  migrations/   001_init_schema.sql  (schema + RLS + realtime)
scripts/
  seed.js       demo org / users / projects / tasks
docs/           the original spec package + the HTML prototype (reference)
```

---

## Supabase setup notes (important)

1. **Run the migration** (`supabase/migrations/001_init_schema.sql`). It creates
   all 8 tables, the RLS policies, three `SECURITY DEFINER` helper functions,
   and adds the live tables to the `supabase_realtime` publication.

2. **Email confirmation.** The in-app sign-up flow assumes the user is signed in
   immediately after `signUp`. If your project has *Confirm email* enabled
   (Supabase default), the first insert after sign-up will fail RLS because
   there's no session yet. For the simplest v1 experience:
   - Supabase -> Authentication -> Providers -> Email -> turn **Confirm email
     off**, **or**
   - create the first Admin via `npm run seed` (which confirms emails), then add
     teammates from the sidebar / have them sign up.

3. **How auth maps to data.** A `members` row shares the id of its `auth.users`
   row (`members.id = auth.users.id`). RLS keys off `auth.uid()` through the
   helper functions `current_org_id()`, `current_role()`, and `is_admin()`.

---

## Permissions model

- **Admin** — sees every task/project/member in the org; can assign work,
  manage clients, review the inbox, delete tasks.
- **Team member** — sees only tasks assigned to them; can update status and
  comment on their own tasks; cannot see admin views or other people's work.

Enforced in two places: the UI hides controls, and **Supabase RLS enforces it at
the database** (the real boundary).

---

## Deviations from the original spec (and why)

The spec package in `docs/` had a few internal inconsistencies. Resolved as
follows:

| Area | Spec | This build | Why |
|---|---|---|---|
| **Auth** | Mixed "pick your user" grid + real Supabase Auth | Real Supabase Auth (email/password + sign-up) | RLS and the deployment guide both require real auth; the grid is honor-system only |
| **Realtime API** | `supabase.from(...).on(...)` (supabase-js **v1**) | `supabase.channel(...).on('postgres_changes', ...)` (**v2**) | v1 syntax doesn't exist in the current SDK |
| **RLS** | Policies query `members` from a members-scoped context | `SECURITY DEFINER` helper functions | The spec's policies cause "infinite recursion detected in policy" in Postgres |
| **Fonts** | Imports "Sohne" from Google Fonts | "Sohne" with **Inter** fallback (loaded from Google Fonts) | Söhne is a commercial Klim font, not on Google Fonts |
| **`@anthropic-ai/sdk`** | Listed as a dependency | Omitted | Only needed for the v2 Fireflies extraction; shipping an LLM SDK to the browser is discouraged |

Other small notes:
- **Add member** (sidebar) creates an assignable placeholder member row. Real
  invite emails are a v2 item; until then teammates self-sign-up.
- **Board/Kanban view, time-logging UI** are intentional v1 stubs (see the spec).

---

## Verification status

- ✅ Written to compile as an ES module React/Vite app; imports/exports reviewed
  by hand.
- ⚠️ **Not** run through `npm install` / `npm run build` / `npm run dev` here —
  the authoring environment had no Node.js runtime. First run on your machine is
  the real smoke test. If anything fails to resolve, it'll surface immediately
  in the Vite dev server output.
- After it's up, work through `docs/TESTING_QUICK_START.md` (5-minute smoke test)
  and `docs/07-BUILD_CHECKLIST.md` Phases 7–9 for realtime + deployment.

---

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel (it auto-detects Vite).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel -> Settings ->
   Environment Variables (Production + Preview + Development).
4. Redeploy. Full walkthrough is in the deployment guide.
