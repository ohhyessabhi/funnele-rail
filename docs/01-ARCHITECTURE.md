# Funnele PM — Production Architecture

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast refresh, minimal build config |
| **Styling** | Tailwind CSS + custom CSS vars | Consistent theming, works with existing design |
| **State** | Zustand | Lightweight, no boilerplate vs Redux |
| **Backend** | Supabase (Postgres) | Real-time, auth, RLS, REST API built-in |
| **Hosting** | Vercel | Deploy from GitHub, instant previews |
| **Auth** | Supabase Auth | Email/password, session management, RLS policies |
| **Real-time** | Supabase Subscriptions | Live updates across tabs/users |
| **Storage** | Supabase Cloud Storage | File uploads (future: invoices, proofs of work) |
| **Integrations** | REST + Webhooks | Teamwork, Fireflies via API |

---

## Database Schema (Supabase)

### Tables

```sql
-- 1. members (team)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('Admin', 'PM', 'SEO', 'Web Designer', 'Web Developer', 'Email Marketing', 'Google Ads', 'Meta Ads')),
  avatar_url TEXT,
  status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. projects (clients)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state TEXT CHECK (state IN ('Active', 'Paused', 'Cancelled')) DEFAULT 'Active',
  color TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. tasks (work)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('Backlog','Ready','In Progress','Client Review','Approved','Completed','Revision Required')) DEFAULT 'Backlog',
  priority TEXT CHECK (priority IN ('Low','Normal','High','Urgent')) DEFAULT 'Normal',
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  due_date DATE,
  source TEXT CHECK (source IN ('Manual','Teamwork','Fireflies')) DEFAULT 'Manual',
  source_ref TEXT,
  status_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  auto BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. time_logs
CREATE TABLE time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  minutes INT NOT NULL,
  logged_at DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. deliverables (gate on Client Review)
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  url TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 7. inbox (Teamwork/Fireflies intake)
CREATE TABLE inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('Teamwork','Fireflies')) NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  confidence TEXT CHECK (confidence IN ('high','medium','low')) DEFAULT 'medium',
  evidence TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 8. organizations (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;

-- tasks: Users see only their org, and non-admins see only their tasks
CREATE POLICY "tasks_read_policy" ON tasks FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM members WHERE id = auth.uid()
    )
    AND (
      (SELECT role FROM members WHERE id = auth.uid()) = 'Admin'
      OR assignee_id = auth.uid()
    )
  );

CREATE POLICY "tasks_write_policy" ON tasks FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM members WHERE id = auth.uid()
    )
    AND (SELECT role FROM members WHERE id = auth.uid()) = 'Admin'
  );

-- Similar policies for projects, comments, etc.
-- Non-admins can read projects they have tasks in
-- Non-admins can post comments on their own tasks
```

---

## File Structure

```
funnele-pm/
├── src/
│   ├── components/
│   │   ├── Topbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TaskList.jsx
│   │   ├── TaskRow.jsx
│   │   ├── Drawer.jsx
│   │   ├── Palette.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── pages/
│   │   ├── MyWork.jsx
│   │   ├── AllTasks.jsx (admin)
│   │   ├── Inbox.jsx
│   │   ├── Team.jsx (admin)
│   │   └── Hours.jsx (admin)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTasks.js
│   │   ├── useComments.js
│   │   └── useStorage.js
│   ├── store/
│   │   └── appStore.js (Zustand)
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── constants.js
│   │   └── utils.js
│   ├── styles/
│   │   └── globals.css (Tailwind + vars)
│   ├── App.jsx
│   └── main.jsx
├── public/
├── supabase/
│   └── migrations/
│       └── 001_init_schema.sql
├── tests/
│   └── [test files]
├── .env.local (secrets)
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Deployment Checklist

- [ ] Supabase project created + tables seeded
- [ ] RLS policies tested (non-admin can't see other tasks)
- [ ] Auth configured (GitHub OAuth for dev, email for prod)
- [ ] Vercel project linked to GitHub
- [ ] Environment variables set (.env.local, Vercel secrets)
- [ ] Database backups configured
- [ ] Email notifications set up (Resend)
- [ ] API rate limiting enabled
- [ ] CORS configured for Teamwork/Fireflies webhooks
- [ ] Custom domain pointing to Vercel

---

## Build Phases (Effort Estimates)

| Phase | Hours | What |
|---|---|---|
| 1 | 6 | Supabase setup + RLS policies + seed data |
| 2 | 12 | React components (auth, layout, list, drawer) |
| 3 | 8 | Zustand store + data hooks + sync |
| 4 | 6 | Styling (Tailwind + CSS vars matching prototype) |
| 5 | 8 | Teamwork webhook + field mapping |
| 6 | 10 | Fireflies + Claude extraction prompt |
| 7 | 4 | Time logging UI + calculations |
| 8 | 4 | Email notifications (Resend) |
| 9 | 3 | Testing + bug fixes |
| **TOTAL** | **61 hours** | **~2 weeks solo, ~1 week with pair** |

---

## Migration Path (from Prototype)

1. **Export prototype data to JSON** → Upload to Supabase with script
2. **Keep localStorage as fallback** → Real-time subscriptions gradually replace
3. **Gradual rollout** → Test with Priya first, then full team
4. **Sunset prototype** → After 1 week of production use, archive HTML file

---

## Key Differences: Prototype → Production

| Aspect | Prototype | Production |
|---|---|---|
| **Storage** | Browser localStorage | Supabase Postgres |
| **Auth** | Honor system (select yourself) | Real Supabase Auth + permissions |
| **Real-time** | Page refresh | Live subscriptions (WebSocket) |
| **Permissions** | Frontend only | RLS policies (backend enforces) |
| **Scalability** | 1 user, 100 tasks | Multi-tenant, 1000s of tasks |
| **Integrations** | Stubbed | Full Teamwork + Fireflies pipelines |
| **Notifications** | In-app only | Email + Slack (future) |
| **Backup** | None | Automatic daily backups |

---

## Known Limitations (v1)

Will implement in v2 or later:

- **No board/Kanban view** (list + filters for now)
- **No time tracking UI** (schema ready, UI deferred)
- **No bulk operations** (select multiple tasks → change status)
- **No custom fields** (defined roles only)
- **No webhooks for stale alerts** (manual check for now)
- **No Slack integration** (email only, v2)
- **No audit trail** (who changed what, when)
- **No offline mode** (real-time required)

These are post-MVP. Core loop works without them.
