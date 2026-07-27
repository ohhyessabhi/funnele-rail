# External Integrations

## Teamwork Integration

### Overview
- Webhook events (task created/updated) → Funnele inbox
- One-time project mapping (Teamwork projects → Funnele clients)
- No status sync (all tasks land in Backlog)

### Setup

**Teamwork Admin Access:** ✓ (You have access)

1. **Get API Token**
   - Teamwork → Settings → API Token
   - Copy token

2. **Create Project Mapping Table** (Supabase)
   ```sql
   CREATE TABLE teamwork_project_map (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID REFERENCES organizations(id),
     teamwork_project_id INT UNIQUE NOT NULL,
     funnele_project_id UUID REFERENCES projects(id),
     created_at TIMESTAMP DEFAULT now()
   );
   ```

3. **Enable Webhooks** (Teamwork)
   - Go to Settings → Webhooks → Add
   - URL: `https://yourapp.vercel.app/api/webhooks/teamwork`
   - Events: `TASK.CREATED`, `TASK.UPDATED`
   - Test webhook → make sure it receives events

4. **Save API Token** (Environment)
   ```
   VITE_TEAMWORK_API_TOKEN=xxx
   ```

### Data Flow

```
Teamwork Task Created
  ↓
Webhook POST to /api/webhooks/teamwork
  ↓
Node.js handler (api/webhooks/teamwork.js):
  - Extract: task ID, name, description, due date, project ID, priority
  - Look up project mapping: teamwork_project_id → funnele_project_id
  - Check for duplicate: unique(source='Teamwork', source_ref=teamwork_task_id)
  - Insert into inbox table:
    {
      source: 'Teamwork',
      title: task.name,
      detail: task.description,
      project_id: funnele_project_id,
      confidence: 'high',
      evidence: `Task ID ${task.id}`,
    }
  ↓
Admin sees in Inbox → Accept/Reject
  ↓
Accept → Create task in backlog
```

### Field Mapping

| Teamwork | Funnele | Notes |
|---|---|---|
| task.id | source_ref | Store for deduplication |
| task.name | title | Full text |
| task.description | notes | Full markdown |
| task.dueDate | due_date | Parse to YYYY-MM-DD |
| task.projectId | (lookup) project_id | Use mapping table |
| task.priority (1-5) | priority | 1-2 = Urgent, 3 = High, 4-5 = Normal |
| — | status | Always 'Backlog' (no sync) |
| — | assignee_id | Always null (PM routes) |

### Implementation (Node.js)

**File:** `api/webhooks/teamwork.js`

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, data } = req.body;

  try {
    if (type === "TASK.CREATED" || type === "TASK.UPDATED") {
      // 1. Look up project mapping
      const { data: mapping } = await supabase
        .from("teamwork_project_map")
        .select("funnele_project_id")
        .eq("teamwork_project_id", data.projectId)
        .single();

      if (!mapping) {
        console.log(`No mapping found for Teamwork project ${data.projectId}`);
        return res.json({ skipped: "no_mapping" });
      }

      // 2. Check for duplicate
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("source", "Teamwork")
        .eq("source_ref", data.id)
        .single();

      if (existing) {
        console.log(`Task already exists: ${data.id}`);
        return res.json({ skipped: "duplicate" });
      }

      // 3. Map priority
      const priority = data.priority <= 2 ? "Urgent" : data.priority === 3 ? "High" : "Normal";

      // 4. Insert into inbox
      const { error: inboxError } = await supabase.from("inbox").insert({
        org_id: mapping.org_id,
        source: "Teamwork",
        title: data.name,
        detail: data.description || null,
        project_id: mapping.funnele_project_id,
        confidence: "high",
        evidence: `Task ID ${data.id}`,
      });

      if (inboxError) throw inboxError;

      return res.json({ success: true, inboxed: true });
    }

    return res.json({ skipped: "unknown_type" });
  } catch (error) {
    console.error("Teamwork webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Deployment:** Deploy this to Vercel. Webhook URL will be `https://yourapp.vercel.app/api/webhooks/teamwork`

### Testing

```bash
# Manual webhook test (from Teamwork Settings)
curl -X POST https://yourapp.vercel.app/api/webhooks/teamwork \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TASK.CREATED",
    "data": {
      "id": 123456,
      "name": "Test task from webhook",
      "description": "This is a test",
      "dueDate": "2026-08-15",
      "projectId": 999,
      "priority": 2
    }
  }'
```

---

## Fireflies Integration

### Overview
- Meeting transcripts → Claude API extraction → Funnele inbox
- Polling or webhook on transcription complete
- Claude generates: task title, owner, due date, project, confidence, evidence

### Setup

**Fireflies MCP Connected:** ✓ (You have access)

1. **Store Fireflies API Key** (Environment)
   ```
   VITE_FIREFLIES_API_KEY=xxx
   ```

2. **Create Fireflies Extraction Prompt**
   - See below for the prompt

3. **Choose Polling or Webhook**
   - Polling: Check every 15–30 min for new transcripts
   - Webhook: Fireflies notifies when ready (preferred if available)

### Data Flow (Polling)

```
Every 15 min:
  ↓
Fetch recent transcripts from Fireflies
  ↓
Filter: not yet processed (check `processed_at`)
  ↓
For each transcript:
  - Get transcript + summary via Fireflies API
  - Send to Claude API with extraction prompt
  - Parse JSON output
  - Insert into inbox
  - Mark as processed (store source_ref = transcript ID)
  ↓
Admin sees in Inbox → Accept/Reject
```

### Fireflies Extraction Prompt

**System:**
```
You are a project management assistant. Extract action items from meeting transcripts.

For each task mentioned, return structured JSON with:
- title: Clear, actionable task name
- owner_name: Person assigned (mention in transcript, or "Unassigned")
- due_date: YYYY-MM-DD if mentioned, null otherwise
- project_name: Client/project name mentioned, or null
- confidence: "high", "medium", or "low" based on clarity
- evidence: Exact quote from transcript + timestamp where task was discussed

Return ONLY valid JSON array, no markdown.
```

**User:**
```
Meeting: {meeting_title}
Date: {date}
Attendees: {attendees}

Transcript:
{full_transcript_text}

Extract all action items / tasks mentioned.
```

### Implementation (Node.js Polling)

**File:** `api/cron/fireflies-sync.js`

```javascript
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const claude = new Anthropic();

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Fetch recent transcripts from Fireflies
    const firefliesHeaders = {
      Authorization: `Bearer ${process.env.VITE_FIREFLIES_API_KEY}`,
    };

    // Using Fireflies GraphQL API (example, adapt to actual API)
    const firefliesRes = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        ...firefliesHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            transcripts(limit: 10, sort_by: "-date") {
              id
              title
              date
              participants
              summary
            }
          }
        `,
      }),
    });

    const firefliesData = await firefliesRes.json();
    const transcripts = firefliesData.data.transcripts || [];

    let created = 0;
    let skipped = 0;

    for (const transcript of transcripts) {
      // 2. Check if already processed
      const { data: processed } = await supabase
        .from("tasks")
        .select("id")
        .eq("source", "Fireflies")
        .eq("source_ref", transcript.id)
        .single();

      if (processed) {
        skipped++;
        continue;
      }

      // 3. Fetch full transcript
      const fullTranscript = await fetch(
        `https://api.fireflies.ai/v3/transcript/${transcript.id}`,
        { headers: firefliesHeaders }
      ).then((r) => r.json());

      // 4. Extract with Claude
      const extraction = await claude.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `
Meeting: ${transcript.title}
Date: ${transcript.date}
Attendees: ${transcript.participants.map((p) => p.name).join(", ")}

Transcript:
${fullTranscript.transcript.map((line) => `${line.speaker}: ${line.text}`).join("\n")}

Extract all action items as JSON array.
`,
          },
        ],
        system: `You are a PM assistant. Extract tasks from meeting transcripts.
Return ONLY a valid JSON array with: title, owner_name, due_date, project_name, confidence, evidence.`,
      });

      // 5. Parse extraction
      const extractedText = extraction.content[0].text;
      const tasks = JSON.parse(extractedText);

      // 6. Insert into inbox
      for (const task of tasks) {
        const { error: inboxError } = await supabase.from("inbox").insert({
          org_id: "current-org-id", // TODO: determine from user context
          source: "Fireflies",
          title: task.title,
          detail: task.evidence,
          project_id: null, // Lookup by name later
          confidence: task.confidence,
          evidence: task.evidence,
        });

        if (!inboxError) created++;
      }

      // 7. Mark transcript as processed
      await supabase.from("tasks").insert({
        source: "Fireflies",
        source_ref: transcript.id,
        status: "Completed", // Mark as processed (dummy task)
      });
    }

    return res.json({ success: true, created, skipped });
  } catch (error) {
    console.error("Fireflies sync error:", error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Deploy to Vercel.** Then set up cron with [Vercel Cron](https://vercel.com/docs/cron-jobs):

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/fireflies-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Testing

Manually invoke the cron:

```bash
curl https://yourapp.vercel.app/api/cron/fireflies-sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

Should see tasks appear in Inbox.

---

## Slack Integration (v2)

**Not in v1.** Placeholder for future.

Imagine:
- New task assigned → Slack notification
- Task overdue → Daily digest
- Comment mentioned → Notification

Uses Slack SDK + incoming webhooks.

---

## Summary

| Integration | Type | Trigger | Flow |
|---|---|---|---|
| **Teamwork** | Webhook | Task created/updated | → Inbox → Accept → Backlog |
| **Fireflies** | Polling | Every 15 min | → Claude extract → Inbox → Accept → Backlog |
| **Slack** | Webhook | Task event | → Notify team |
| **Email** | SMTP | Task event | → Notify assignee |

---

## Environment Variables Checklist

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Integrations
VITE_TEAMWORK_API_TOKEN=xxx
VITE_FIREFLIES_API_KEY=xxx
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Security
CRON_SECRET=xxx

# Deployment
VERCEL_TOKEN=xxx
```

Make sure to add these to Vercel → Settings → Environment Variables.
