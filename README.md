# Norbot

Turn messages into tasks. Let AI research or fix them.

Slack first, other sources (WhatsApp, email) coming soon.

**Live at [norbot.vercel.app](https://norbot.vercel.app)**

## Why "Norbot"?

Named after the German "Norbert" — the grumpy government clerk who sighs deeply when you hand him your paperwork, but somehow always gets it done on time.

That's the vibe. You message Norbot about a bug, it might ask a few clarifying questions (with mild exasperation), but it'll extract the task, add it to your board, and if you want — send AI to research or fix it.

## What it does

- **Slack Bot**: Mention @Norbot to create tasks, update status, assign work, get summaries
- **AI Task Extraction**: Pulls out title, priority, type from natural conversation
- **Kanban Board**: Visual task management, organized by status
- **AI Resolution**: Coming soon — AI researches the issue or attempts a fix
- **Projects**: Organize with short codes (TM-123), auto-detect by keywords
- **GitHub Integration**: Create issues, link repos to projects
- **Team Management**: Invite members, assign roles
- **Thread Context**: Understands full conversation history
- **File Attachments**: Screenshots from Slack attached to tasks

## How It Works

### Current

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AGENTIC INTAKE                                           │
│    User: "@norbot there's a bug"                            │
│    Bot: "What's happening? Screenshot?"                     │
│    User: [image] [more text]                                │
│    Bot: "Got it. Which project?" → collects into structure  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TASK CREATED                                             │
│    Structured: title, description, images, code context     │
│    Assigned to project, tagged, prioritized                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GITHUB ISSUE (optional)                                  │
│    Creates GitHub issue with full context                   │
│    Includes @claude mention for AI coding agents            │
└─────────────────────────────────────────────────────────────┘
```

### Coming Soon

```
┌─────────────────────────────────────────────────────────────┐
│ 4. TRIGGER AI CODER                                         │
│    Automatically triggers Claude Code / Cursor / etc.       │
│    AI starts working on the fix                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFICATION / HANDOVER                                  │
│    AI verifies: "I can reproduce this"                      │
│    AI prepares: "Here's what I found, files involved"       │
│    Best case: "Here's the fix"                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PR                                                       │
│    Vercel/Netlify: just merge and done                      │
│    Complex: handover to human with full context             │
└─────────────────────────────────────────────────────────────┘
```

## MCP Integration (for Claude Code, Cursor, etc.)

Norbot exposes an MCP server so LLMs can manage tasks directly.

### Setup

1. **Generate API key** in Norbot settings (one key per project)

2. **Add to Claude Code** (`~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "norbot": {
      "command": "npx",
      "args": ["@norbot/mcp"],
      "env": {
        "NORBOT_API_KEY": "nrbt_your_key_here"
      }
    }
  }
}
```

### Tools

| Tool | Description | Example |
|------|-------------|---------|
| `norbot_list` | List tasks | `norbot_list({ status: "todo" })` |
| `norbot_create` | Create task | `norbot_create({ title: "Fix bug" })` |
| `norbot_update` | Update task | `norbot_update({ id: "TM-42", priority: "high" })` |
| `norbot_status` | Change status | `norbot_status({ id: "TM-42", status: "done" })` |

### Token-friendly responses

Responses are plain text, not JSON:
```
TM-42: Fix login bug [in_progress] high
TM-43: Add dark mode [todo] medium
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, shadcn/ui (base-ui)
- **Backend**: Convex (real-time database + serverless functions)
- **AI**: Claude via Convex Agents (@convex-dev/agent)
- **Auth**: GitHub OAuth

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Convex

```bash
pnpm convex dev
```

This will:

- Create a new Convex project (or connect to existing)
- Generate `convex/_generated/` files
- Give you your deployment URL (e.g., `https://helpful-horse-123.convex.site`)

### 3. Create Slack App (one-click via manifest)

1. Open `slack-app-manifest.yaml`
2. Replace `YOUR_CONVEX_URL` with your Convex deployment name (e.g., `helpful-horse-123`)
3. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**
4. Select your workspace, paste the YAML, create the app
5. Click **Install to Workspace**

### 4. Configure environment variables

In the [Convex Dashboard](https://dashboard.convex.dev), add these environment variables:

| Variable               | Where to find it                                        |
| ---------------------- | ------------------------------------------------------- |
| `SLACK_CLIENT_ID`      | Slack App → Basic Information → App Credentials         |
| `SLACK_CLIENT_SECRET`  | Slack App → Basic Information → App Credentials         |
| `SLACK_SIGNING_SECRET` | Slack App → Basic Information → App Credentials         |
| `ANTHROPIC_API_KEY`    | [console.anthropic.com](https://console.anthropic.com/) |

Also add to `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub OAuth (create at github.com/settings/developers)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 5. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login** with GitHub
2. **Create workspace** or accept an invite
3. **Setup wizard**: Connect Slack app, link GitHub repos, map channels
4. **Configure**: Set up projects with short codes and keywords
5. **Use Norbot** in Slack:
   - `@Norbot The login button is broken on mobile` → creates task
   - `@Norbot summarize` → shows task overview
   - `@Norbot mark TM-123 as done` → updates status
   - `@Norbot assign TM-123 to @user` → assigns task
   - `@Norbot send TM-123 to github` → creates GitHub issue

## Project Structure

```
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── w/[slug]/          # Workspace dashboard + settings
│   │   ├── invite/[token]/    # Invitation acceptance
│   │   └── login/             # GitHub OAuth
│   ├── components/
│   │   ├── kanban/            # Kanban board
│   │   └── ui/                # UI components
│   └── hooks/                 # React hooks
├── convex/
│   ├── agents/                # Norbot agent + tools
│   │   ├── taskExtractor.ts   # Agent definition
│   │   └── tools.ts           # Agent capabilities
│   ├── schema.ts              # Database schema
│   ├── slack.ts               # Slack event handlers
│   ├── projects.ts            # Projects management
│   ├── channelMappings.ts     # Channel-repo-project links
│   ├── github.ts              # GitHub integration
│   ├── mcp.ts                 # MCP API operations
│   └── http.ts                # Webhook endpoints
├── packages/
│   └── mcp-server/            # @norbot/mcp package
└── slack-app-manifest.yaml    # Slack app setup
```

## License

MIT
