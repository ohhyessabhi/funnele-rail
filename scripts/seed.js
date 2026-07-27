/**
 * Seed script — creates an org, auth users + member rows, projects, and tasks.
 *
 * Uses the SERVICE ROLE key (bypasses RLS). NEVER ship this key to the browser.
 *
 * Usage:
 *   1) Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *      (see .env.local.example)
 *   2) npm run seed
 *
 * Every seeded user gets the same starter password (printed below) so you can
 * log in immediately. Change them after first login.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- tiny .env.local loader (no extra dependency) ---
function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_PASSWORD || "Funnele#2026";

if (!URL || !SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local."
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

async function ensureAuthUser(email) {
  // createUser fails if the email already exists; look it up in that case.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!error) return data.user.id;

  // Already exists — find the id by paging users.
  let page = 1;
  while (page < 20) {
    const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = list.users.find((u) => u.email === email);
    if (found) return found.id;
    if (list.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Could not create or find auth user for ${email}`);
}

async function seed() {
  console.log("Seeding Funnele PM…");

  // 1) Org — owned by the admin auth user.
  const adminEmail = "you@funnele.com";
  const adminId = await ensureAuthUser(adminEmail);

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: "Funnele Test", owner_id: adminId })
    .select()
    .single();
  if (orgErr) throw orgErr;

  // 2) Members (each with a real auth user; ids match).
  const memberDefs = [
    { name: "You", email: adminEmail, role: "Admin", id: adminId },
    { name: "Priya", email: "priya@funnele.com", role: "SEO" },
    { name: "Rahul", email: "rahul@funnele.com", role: "Web Developer" },
    { name: "Nisha", email: "nisha@funnele.com", role: "Meta Ads" },
    { name: "Arun", email: "arun@funnele.com", role: "Email Marketing" },
  ];
  for (const m of memberDefs) {
    if (!m.id) m.id = await ensureAuthUser(m.email);
  }
  const { data: members, error: memErr } = await supabase
    .from("members")
    .upsert(
      memberDefs.map((m) => ({
        id: m.id,
        org_id: org.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: "Active",
      }))
    )
    .select();
  if (memErr) throw memErr;
  const byName = Object.fromEntries(members.map((m) => [m.name, m.id]));

  // 3) Projects.
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .insert([
      { org_id: org.id, name: "AllPrintHeads", state: "Active" },
      { org_id: org.id, name: "Valerie Madison", state: "Active" },
      { org_id: org.id, name: "EG Roofing", state: "Active" },
    ])
    .select();
  if (projErr) throw projErr;
  const P = Object.fromEntries(projects.map((p) => [p.name, p.id]));

  // 4) Tasks.
  const tasks = [
    { project: "AllPrintHeads", title: "Fix Meta commerce account restriction", status: "In Progress", priority: "Urgent", assignee: "Nisha", due_date: addDays(2), notes: "Client escalation — Meta support case #12345 open", status_at: daysAgo(4) },
    { project: "AllPrintHeads", title: "Rewrite Meta ad copy for Q4 campaign", status: "Ready", priority: "High", assignee: "Nisha", due_date: addDays(5), notes: "Use new brand voice guidelines", status_at: daysAgo(1) },
    { project: "Valerie Madison", title: "Build email nurture sequence — jewelry brand", status: "In Progress", priority: "Normal", assignee: "Arun", due_date: addDays(7), notes: "Drip 1-5, MRR focus", status_at: daysAgo(3) },
    { project: "Valerie Madison", title: "Client review: product photography edits", status: "Client Review", priority: "Normal", assignee: "You", due_date: null, notes: "Waiting for approval before publishing", status_at: daysAgo(6) },
    { project: "AllPrintHeads", title: "Meta Ads: Q3 performance report & recommendations", status: "Approved", priority: "Normal", assignee: "You", due_date: null, notes: "Ready to send to client", status_at: daysAgo(2) },
    { project: "EG Roofing", title: "Google Ads bid strategy audit", status: "Completed", priority: "Low", assignee: "You", due_date: addDays(-5), notes: "Delivered — increased CTR by 14%", status_at: daysAgo(11) },
    { project: "AllPrintHeads", title: "Set up conversion tracking for new landing page", status: "Backlog", priority: "High", assignee: null, due_date: null, notes: "Unassigned — needs handoff", status_at: daysAgo(0) },
    { project: "Valerie Madison", title: "Content calendar planning — next 3 months", status: "Backlog", priority: "Normal", assignee: "Priya", due_date: addDays(12), notes: "SEO strategy alignment", status_at: daysAgo(0) },
    { project: "AllPrintHeads", title: "Mobile site speed optimization", status: "Revision Required", priority: "High", assignee: "Rahul", due_date: addDays(3), notes: "Client wants homepage to load in <2s", status_at: daysAgo(2) },
    { project: "Valerie Madison", title: "Instagram Stories + Reels strategy", status: "Ready", priority: "Normal", assignee: "Priya", due_date: addDays(8), notes: "Content pillars agreed", status_at: daysAgo(0) },
  ];
  const { error: taskErr } = await supabase.from("tasks").insert(
    tasks.map((t) => ({
      org_id: org.id,
      project_id: P[t.project],
      title: t.title,
      notes: t.notes,
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignee ? byName[t.assignee] : null,
      due_date: t.due_date,
      status_at: t.status_at,
    }))
  );
  if (taskErr) throw taskErr;

  // 5) A couple of inbox items to demo the intake flow.
  await supabase.from("inbox").insert([
    { org_id: org.id, source: "Fireflies", title: "Add UTM tags to all Q4 campaign links", detail: "Raised on the AllPrintHeads sync.", confidence: "high", evidence: "[12:04] \"...make sure every link has UTMs before launch\"" },
    { org_id: org.id, source: "Teamwork", title: "Design new hero banner for homepage", detail: "From Valerie Madison board.", confidence: "medium" },
  ]);

  console.log("\n✓ Seed complete.");
  console.log(`  Org: ${org.name} (${org.id})`);
  console.log(`  Users (password: ${PASSWORD}):`);
  memberDefs.forEach((m) => console.log(`    - ${m.email}  [${m.role}]`));
}

seed().catch((e) => {
  console.error("\nSeed failed:", e.message || e);
  process.exit(1);
});
