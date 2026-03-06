'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  id: string
  label: string
  icon: string
}

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'danger'
  children: React.ReactNode
}

interface CodeProps {
  children: string
}

// ── Sections registry ─────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'overview',      label: 'Overview',            icon: '⬡' },
  { id: 'tasks',         label: 'Task Board',          icon: '◈' },
  { id: 'agents',        label: 'Agents',              icon: '◎' },
  { id: 'calendar',      label: 'Calendar',            icon: '◷' },
  { id: 'servers',       label: 'Servers',             icon: '⬢' },
  { id: 'office',        label: 'Office',              icon: '◉' },
  { id: 'memory',        label: 'Memory & Docs',       icon: '▤' },
  { id: 'understanding', label: 'Understanding Clawd', icon: '\uD83E\uDD9E' },
  { id: 'models',        label: 'Model Routing',       icon: '◆' },
  { id: 'security',      label: 'Security & Ops',      icon: '⬡' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Callout({ type = 'info', children }: CalloutProps) {
  const config = {
    info:    { color: '#00ff9d', bg: '#00ff9d0a', icon: '\u2139', label: 'NOTE' },
    warning: { color: '#f5a623', bg: '#f5a6230a', icon: '\u26A0', label: 'WARNING' },
    tip:     { color: '#7eb8f7', bg: '#7eb8f70a', icon: '\u2726', label: 'TIP' },
    danger:  { color: '#ff4444', bg: '#ff44440a', icon: '\u2715', label: 'IMPORTANT' },
  }[type]

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.color}22`,
      borderLeft: `3px solid ${config.color}`,
      borderRadius: '0 6px 6px 0',
      padding: '12px 16px',
      margin: '16px 0',
      display: 'flex',
      gap: 12,
    }}>
      <span style={{ color: config.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>{config.icon}</span>
      <div>
        <span style={{ color: config.color, fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.12em', marginRight: 8 }}>
          {config.label}
        </span>
        <span style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>{children}</span>
      </div>
    </div>
  )
}

function Code({ children }: CodeProps) {
  return (
    <code style={{
      background: '#111',
      border: '1px solid #1e1e1e',
      borderRadius: 4,
      padding: '2px 7px',
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#00ff9d',
      letterSpacing: '0.02em',
    }}>{children}</code>
  )
}

function CodeBlock({ children }: CodeProps) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{
      position: 'relative',
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: 8,
      margin: '14px 0',
      overflow: 'hidden',
    }}>
      <button onClick={copy} style={{
        position: 'absolute', top: 10, right: 12,
        background: 'none', border: 'none',
        color: copied ? '#00ff9d' : '#333',
        fontFamily: 'monospace', fontSize: 10,
        cursor: 'pointer', letterSpacing: '0.08em',
        transition: 'color 0.15s',
      }}>
        {copied ? 'COPIED' : 'COPY'}
      </button>
      <pre style={{
        margin: 0, padding: '16px 20px',
        fontFamily: 'monospace', fontSize: 12,
        color: '#777', lineHeight: 1.7,
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>{children}</pre>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 20, fontWeight: 700,
      color: '#e0e0e0', margin: '0 0 8px',
      fontFamily: 'monospace',
      letterSpacing: '-0.01em',
    }}>{children}</h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 14, fontWeight: 600,
      color: '#00ff9d', margin: '28px 0 10px',
      fontFamily: 'monospace',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>{children}</h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: '#777', fontSize: 14,
      lineHeight: 1.8, margin: '0 0 14px',
      fontFamily: 'monospace',
    }}>{children}</p>
  )
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '8px 0 16px', padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: 10,
          color: '#666', fontSize: 13,
          fontFamily: 'monospace',
          lineHeight: 1.7,
          padding: '3px 0',
        }}>
          <span style={{ color: '#00ff9d44', flexShrink: 0 }}>&rsaquo;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '8px 14px',
                color: '#444', borderBottom: '1px solid #1a1a1a',
                letterSpacing: '0.1em', fontSize: 10,
                fontWeight: 600,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #111' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 14px',
                  color: '#666',
                  verticalAlign: 'top',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ color, children }: { color: string; children: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace',
      color, border: `1px solid ${color}44`,
      borderRadius: 3, padding: '2px 8px',
      background: `${color}11`,
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// ── Section components ────────────────────────────────────────────────────────

function SectionOverview() {
  return (
    <div>
      <H2>Overview</H2>
      <P>Mission Control is the command center for your autonomous engineering operation. It gives you a real-time view of everything Clawd — your AI agent — is working on, the infrastructure it manages, and the tasks it has completed or is waiting for your review.</P>

      <Callout type="tip">Mission Control does not run tasks itself. It is a window into what Clawd is doing. Clawd reads from and writes to the workspace, Mission Control displays it.</Callout>

      <H3>How it works</H3>
      <P>The system has three layers that work together:</P>
      <UL items={[
        <span key="1"><Code>{'Clawd'}</Code> — the AI agent running on your server. It executes tasks, writes memory, and updates JSON files in the workspace.</span>,
        <span key="2"><Code>{'mission-control-api'}</Code> — a lightweight Node.js daemon on port 4310 that reads workspace JSON files and serves them via REST API with SSE for real-time updates.</span>,
        <span key="3"><Code>{'Mission Control'}</Code> — this Next.js dashboard on port 3131. It proxies requests to the API and displays the data.</span>,
      ]} />

      <H3>The bridge</H3>
      <P>A background process called the bridge polls OpenClaw CLI commands every 60 seconds and syncs live session data, cron job status, and gateway health into the workspace JSON files. This is what makes agent token counts and calendar schedules update automatically.</P>

      <H3>Navigation</H3>
      <Table
        headers={['Screen', 'What it shows']}
        rows={[
          [<Badge key="t" color="#00ff9d">Tasks</Badge>, "Kanban board of all work — Clawd's task queue and history"],
          [<Badge key="p" color="#7eb8f7">Projects</Badge>, 'High-level goals Clawd is working toward'],
          [<Badge key="c" color="#f5a623">Calendar</Badge>, 'Heartbeat schedules and live OpenClaw cron jobs'],
          [<Badge key="a" color="#00ff9d">Agents</Badge>, 'Live roster of Clawd and any active sub-agents with token metrics'],
          [<Badge key="m" color="#888">Memory</Badge>, "Clawd's daily log files — what it did and learned"],
          [<Badge key="d" color="#888">Docs</Badge>, 'Workspace documents — READMEs, SOUL.md, configuration files'],
          [<Badge key="o" color="#7eb8f7">Office</Badge>, 'Live operational view — what is happening right now'],
          [<Badge key="s" color="#f5a623">Servers</Badge>, 'Registered servers Clawd monitors via SSH'],
          [<Badge key="pr" color="#888">PRs</Badge>, 'Open pull requests across your repositories'],
        ]}
      />
    </div>
  )
}

function SectionTasks() {
  return (
    <div>
      <H2>Task Board</H2>
      <P>The task board is the most important screen in Mission Control. It is the single source of truth for all work. If a task is not on the board, it did not happen.</P>

      <H3>Columns</H3>
      <Table
        headers={['Column', 'Meaning']}
        rows={[
          [<Badge key="r" color="#888">Recurring</Badge>, 'Scheduled tasks that run on a cron or heartbeat. These are not manually created.'],
          [<Badge key="b" color="#7eb8f7">Backlog</Badge>, 'Work queued and waiting. Clawd picks the highest priority task from here automatically on every heartbeat sweep.'],
          [<Badge key="i" color="#f5a623">In Progress</Badge>, 'Clawd is actively working on this right now. Should only ever have 1-2 tasks.'],
          [<Badge key="rv" color="#00ff9d">Review</Badge>, 'Clawd finished the work and is waiting for your approval. You must move it to Done or reject it.'],
          [<Badge key="d" color="#888">Done</Badge>, 'Approved and closed. Only you can move tasks here.'],
        ]}
      />

      <H3>Creating a task</H3>
      <P>Click <Code>{'+ NEW TASK'}</Code> in the top right. Fill in the title, assign it to <Code>{'clawd'}</Code>, set the project, and optionally add notes. Once saved it appears in Backlog and Clawd will pick it up on the next sweep.</P>

      <Callout type="tip">Be specific in the title and notes. The more context you give, the better Clawd executes. Instead of &quot;fix the bug&quot;, write &quot;fix the 404 error on PATCH /tasks/:id in the proxy route&quot;.</Callout>

      <H3>Priority</H3>
      <P>Clawd determines priority in this order when picking from the backlog:</P>
      <UL items={[
        'Tasks explicitly marked priority: high come first',
        'Tasks belonging to active projects beat paused ones',
        'Older created_at timestamps break ties — first in, first out',
      ]} />

      <H3>Review and approve flow</H3>
      <P>When Clawd moves a task to Review, click the task card to open the detail modal. You will see what Clawd did, the memory context from that session, and Approve / Reject buttons.</P>
      <UL items={[
        <span key="a"><Badge color="#00ff9d">APPROVE</Badge> — moves the task to Done. Clawd considers the work closed.</span>,
        <span key="r"><Badge color="#ff4444">REJECT</Badge> — moves back to Backlog with your note. Clawd will pick it up again and address your feedback.</span>,
      ]} />

      <H3>Reassigning tasks</H3>
      <P>Open any task and use the Reassign Task section to move it to a different agent. Clawd can also reassign tasks to sub-agents autonomously when it decides the work is better handled by a specialist.</P>

      <Callout type="warning">Never manually move a task to Done without reviewing it. The review gate exists so you stay in control of what ships.</Callout>
    </div>
  )
}

function SectionAgents() {
  return (
    <div>
      <H2>Agents</H2>
      <P>The Agents screen shows every AI agent registered in your workspace — Clawd and any active sub-agents — along with their live session metrics pulled directly from OpenClaw.</P>

      <H3>Clawd</H3>
      <P>Clawd is your primary agent. It runs on your server, manages the workspace, executes tasks, and coordinates sub-agents. There is always exactly one Clawd.</P>

      <H3>Sub-agents (Claw crew)</H3>
      <P>Sub-agents are spawned by Clawd for isolated tasks. They are named using the format <Code>{'claw(role)'}</Code> to distinguish them from the main agent:</P>
      <UL items={[
        <span key="1"><Code>{'claw(coding)'}</Code> — writes, edits, or debugs code. Runs on gpt-5.1-codex.</span>,
        <span key="2"><Code>{'claw(research)'}</Code> — reads logs, searches, summarises. Runs on gpt-4.1-mini.</span>,
        <span key="3"><Code>{'claw(ops)'}</Code> — health checks, service restarts, monitoring. Runs on gpt-4.1-mini.</span>,
        <span key="4"><Code>{'claw(liberty-frontend)'}</Code> — project-specific work. Runs on gpt-4.1-mini.</span>,
      ]} />

      <Callout type="info">Sub-agents have their own tasks on the board with a <Code>{'delegated_by: clawd'}</Code> field so you can see exactly what Clawd handed off and to whom.</Callout>

      <H3>Metrics explained</H3>
      <Table
        headers={['Metric', 'What it means']}
        rows={[
          ['Model', 'The AI model this agent is currently running on'],
          ['Context usage', "How much of the model's context window is consumed. Green = healthy, Yellow = getting full, Red = near limit"],
          ['Tokens this session', 'Total tokens processed in the current session — input + output combined'],
          ['Input / Output', 'Input tokens include the full conversation history and system prompt on every turn. Output is what the model generated. Input will always be much larger.'],
          ['Last seen', 'When this agent last made an API call — updated by the bridge every 60 seconds'],
        ]}
      />

      <Callout type="warning">If context usage goes above 85% Clawd will trigger a compaction — it summarises the conversation history to free up space. This is automatic and logged in memory.</Callout>
    </div>
  )
}

function SectionCalendar() {
  return (
    <div>
      <H2>Calendar</H2>
      <P>The Calendar screen shows all scheduled routines — both the heartbeat stubs defined in HEARTBEAT.md and the live cron jobs running inside OpenClaw.</P>

      <H3>Two types of schedules</H3>
      <Table
        headers={['Type', 'Source', 'How it appears']}
        rows={[
          ['Heartbeat stubs', 'HEARTBEAT.md', <span key="h">Source shows <Code>{'HEARTBEAT.md'}</Code>. These describe what the heartbeat does but are not individually scheduled — they all run as part of the main heartbeat.</span>],
          ['Live cron jobs', 'OpenClaw cron scheduler', <span key="c">Source shows <Code>{'openclaw-cron'}</Code>. These are real scheduled jobs with last run time, next run time, and status pulled live from OpenClaw every 60 seconds by the bridge.</span>],
        ]}
      />

      <H3>The Task Board Sweep</H3>
      <P>The most important cron job. Runs every 30 minutes. It checks for stale in-progress tasks, picks the highest priority backlog task, executes it fully, and moves it to review. This is Clawd&apos;s autonomous work loop.</P>

      <H3>Timeline visualization</H3>
      <P>Each schedule shows a horizontal timeline bar. The green marker shows the current time position within the schedule cycle. The tag on the right shows how often it runs and how many times per day.</P>

      <H3>Adding a schedule</H3>
      <P>Click <Code>{'+ New Schedule'}</Code> to add a new cron or interval schedule. This writes to the workspace schedules file. For a schedule to actually run you also need to create it in OpenClaw via Clawd:</P>
      <CodeBlock>{'openclaw cron add --name "Your schedule name" --every 60m --message "What Clawd should do"'}</CodeBlock>
    </div>
  )
}

function SectionServers() {
  return (
    <div>
      <H2>Servers</H2>
      <P>The Servers screen lets you register any server with Mission Control. Once added, Clawd can SSH into it, run health checks, and monitor its services — all from the same dashboard.</P>

      <Callout type="info">Removing a server from Mission Control does nothing to the actual server. It only removes it from the registry and cleans up the SSH config.</Callout>

      <H3>Adding a server</H3>
      <P>Click <Code>{'+ ADD SERVER'}</Code> and fill in the form:</P>
      <Table
        headers={['Field', 'Required', 'Notes']}
        rows={[
          ['Display name', <Badge key="y" color="#00ff9d">Yes</Badge>, 'A friendly name shown on the card e.g. Liberty Platform'],
          ['Hostname / IP', <Badge key="y2" color="#00ff9d">Yes</Badge>, "The server's IP address or domain"],
          ['SSH port', 'No', 'Defaults to 22'],
          ['SSH user', <Badge key="y3" color="#00ff9d">Yes</Badge>, 'The user Clawd will SSH as e.g. ubuntu, root'],
          ['SSH private key', <Badge key="y4" color="#00ff9d">Yes</Badge>, 'Paste the full private key. It is stored securely at ~/.ssh/mc_<id> with chmod 600 and never returned to the frontend.'],
          ['Health check URL', 'No', 'A URL Clawd can curl to verify the app is responding e.g. http://localhost:8000/health'],
          ['Services to watch', 'No', 'Comma-separated service names e.g. nginx, postgres, gunicorn'],
          ['Description', 'No', 'One line on what runs on this server'],
        ]}
      />

      <H3>What happens after you add a server</H3>
      <UL items={[
        'The SSH private key is written to ~/.ssh/mc_<id> with chmod 600',
        'A bootstrap task is automatically created on the task board assigned to Clawd',
        'Clawd picks it up on the next sweep, SSHs in, runs baseline checks, and writes results to ops/servers/<id>/status.json',
        'The bridge picks up the status file and the server card updates with live metrics',
      ]} />

      <H3>Health check button</H3>
      <P>Clicking <Code>{'\u27F3 HEALTH CHECK'}</Code> on a server card creates an immediate high-priority task for Clawd to SSH in and run a fresh health check. The card will show CHECKING while the task is in progress.</P>

      <H3>View logs</H3>
      <P>Shows the last log snippet Clawd pulled during its most recent health check. This is not a live terminal — it is the last pulled snapshot. Clawd refreshes it on every health check run.</P>

      <H3>Removing a server</H3>
      <P>Click the <Code>{'\u2715'}</Code> button then confirm. This removes the server from the registry, deletes the SSH key file, and creates a cleanup task for Clawd. The actual server is completely unaffected.</P>

      <Callout type="danger">Never share your SSH private key over insecure channels. Only paste it directly into the Mission Control add server form — it is written to disk immediately and never returned in any API response.</Callout>
    </div>
  )
}

function SectionOffice() {
  return (
    <div>
      <H2>Office</H2>
      <P>The Office screen answers one question: what is happening right now? It is the live operational view — open it when you want a quick pulse on the system without digging through the task board.</P>

      <H3>System health bar</H3>
      <P>A status row at the top showing agent status, model, context usage, token counts, and task summary. All data comes from live agent and task API endpoints.</P>
      <UL items={[
        <span key="1"><Badge color="#00ff9d">ONLINE</Badge> — agent is active and responding</span>,
        <span key="2"><Badge color="#f5a623">IDLE</Badge> — agent is registered but not actively working</span>,
        <span key="3"><Badge color="#ff4444">OFFLINE</Badge> — agent is unreachable</span>,
      ]} />

      <H3>Current focus</H3>
      <P>The hero card shows what Clawd is actively working on — the current in-progress task title, project, how long it has been running, and the context usage bar. If Clawd is idle it shows a waiting state.</P>

      <H3>Live activity feed</H3>
      <P>A real-time stream of Clawd&apos;s actions parsed from memory files and pushed via SSE. Every task status change, memory write, and file update appears here as it happens. Auto-scrolls to the latest event.</P>

      <H3>Claw crew</H3>
      <P>Shows all registered agents with their status, model, context usage, and last seen time. Empty slots shown as vacant.</P>
    </div>
  )
}

function SectionMemory() {
  return (
    <div>
      <H2>Memory & Docs</H2>

      <H3>Memory</H3>
      <P>Clawd writes a daily log file to <Code>{'memory/YYYY-MM-DD.md'}</Code> every session. These are its working notes — what tasks it completed, what it learned, what it found in logs, and any decisions it made.</P>
      <P>The Memory screen shows the last 5 memory files. Click any entry to read the full content. Use the search to find specific events or keywords across all memory files.</P>

      <Callout type="tip">Memory files are how you audit what Clawd has been doing. If you want to understand why Clawd made a particular decision, the answer is usually in the memory file from that day.</Callout>

      <H3>Docs</H3>
      <P>The Docs screen shows workspace documents Clawd uses as context:</P>
      <UL items={[
        <span key="s"><Code>{'SOUL.md'}</Code> — Clawd&apos;s operating charter. How it thinks, what it values, how it makes decisions.</span>,
        <span key="u"><Code>{'USER.md'}</Code> — your preferences and working style. Clawd reads this to understand how you like things done.</span>,
        <span key="t"><Code>{'TOOLS.md'}</Code> — available tools and their usage patterns.</span>,
        'Project READMEs — documentation for each codebase Clawd works on.',
      ]} />

      <Callout type="info">Clawd reads SOUL.md and USER.md at the start of every session. If you want to change how Clawd behaves — its communication style, its priorities, its boundaries — edit these files and the change takes effect on the next session.</Callout>
    </div>
  )
}

function SectionUnderstanding() {
  return (
    <div>
      <H2>Understanding Clawd</H2>
      <P>Clawd is not a chatbot you send messages to. It is an autonomous agent that works on your behalf, checks in via Mission Control, and waits for your review before closing tasks.</P>

      <H3>The heartbeat loop</H3>
      <P>Every 30 minutes the Task Board Sweep cron runs. This is Clawd&apos;s core operating cycle:</P>
      <CodeBlock>{`1. Check in_progress tasks — if stale (no update in 30+ min), move to backlog
2. Check backlog tasks assigned to clawd
3. Pick the highest priority task
4. Move it to in_progress
5. Execute it fully
6. Move to review with a summary
7. Log outcome in memory/YYYY-MM-DD.md
8. If backlog is empty — find one useful improvement, create a task, execute it`}</CodeBlock>

      <H3>What Clawd can do autonomously</H3>
      <UL items={[
        'Pick up and execute backlog tasks without asking',
        'Reassign tasks to sub-agents when appropriate',
        'Fix infrastructure issues — port conflicts, process restarts, file edits',
        'Write code, run builds, execute tests',
        'SSH into registered servers and run health checks',
        'Create new backlog tasks when it identifies useful work',
      ]} />

      <H3>What requires your approval</H3>
      <UL items={[
        'Moving any task from Review to Done — only you can do this',
        'Production deploys and public-facing changes',
        'Sending emails, messages, or public posts',
        'Destructive operations — rm, drop database, truncate',
        'Touching credentials, secrets, or API keys',
        'Merging pull requests — Clawd can open them, never merge',
      ]} />

      <H3>Sub-agent spawning</H3>
      <P>Clawd spawns sub-agents when a task is better handled by a specialist or can run in parallel. Before spawning, Clawd creates a task on the board with the sub-agent&apos;s label in the agent field and <Code>{'delegated_by: clawd'}</Code> in the notes. After the sub-agent finishes, Clawd reviews the output before moving the task to review.</P>

      <Callout type="tip">If you want Clawd to do something specific, create a task on the board with clear notes. That is the cleanest way to direct it. Clawd checks the board on every sweep.</Callout>
    </div>
  )
}

function SectionModels() {
  return (
    <div>
      <H2>Model Routing</H2>
      <P>Different tasks use different AI models based on what they require. This keeps costs reasonable without sacrificing quality where it matters.</P>

      <H3>Routing table</H3>
      <Table
        headers={['Who', 'Model', 'Used for']}
        rows={[
          [<Code key="c">{'Clawd (main)'}</Code>, <Badge key="m" color="#00ff9d">gpt-5.1</Badge>, 'All main session work — decisions, architecture, complex reasoning, task execution'],
          [<Code key="sc">{'claw(coding)'}</Code>, <Badge key="cx" color="#7eb8f7">gpt-5.1-codex</Badge>, 'Writing, editing, and debugging code — specialised coding model'],
          [<Code key="sr">{'claw(research) / claw(ops)'}</Code>, <Badge key="mi" color="#f5a623">gpt-4.1-mini</Badge>, 'Research, log reading, health checks, summaries — fast and cheap'],
          [<Code key="e">{'Escalation'}</Code>, <Badge key="op" color="#888">opus</Badge>, 'Only when gpt-5.1 genuinely cannot solve something — rare'],
        ]}
      />

      <H3>Why this matters</H3>
      <P>Running every task on the most expensive model would be wasteful. A log check does not need the same intelligence as an architecture decision. The routing table ensures Clawd uses the right tool for each job.</P>

      <H3>Context windows</H3>
      <Table
        headers={['Model', 'Context window', 'Notes']}
        rows={[
          [<Badge key="1" color="#00ff9d">gpt-5.1</Badge>, '400,000 tokens', "Clawd's main session — very large context, handles long conversations"],
          [<Badge key="2" color="#7eb8f7">gpt-5.1-codex</Badge>, '391,000 tokens', 'Large context for reading entire codebases'],
          [<Badge key="3" color="#f5a623">gpt-4.1-mini</Badge>, '128,000 tokens', 'Sufficient for focused sub-agent tasks'],
        ]}
      />

      <Callout type="warning">When Clawd&apos;s context usage hits 85% it triggers auto-compaction — the conversation history is summarised to free up space. You will see this logged in memory. It is normal and expected over long sessions.</Callout>
    </div>
  )
}

function SectionSecurity() {
  return (
    <div>
      <H2>Security & Ops</H2>

      <H3>SSH key security</H3>
      <UL items={[
        'SSH private keys are written to ~/.ssh/mc_<server_id> with chmod 600 immediately on server registration',
        'Keys are never returned in any API response or logged anywhere',
        'Keys are deleted when you remove a server from Mission Control',
        'Each server gets its own key file — keys are never shared between servers',
      ]} />

      <H3>Mission Control auth</H3>
      <P>Mission Control is protected by a password set in <Code>{'.env.local'}</Code> as <Code>{'MC_PASSWORD'}</Code>. Sessions are managed via iron-session cookies signed with <Code>{'SESSION_SECRET'}</Code>.</P>

      <Callout type="danger">Change the default MC_PASSWORD and SESSION_SECRET before exposing Mission Control to the internet. The defaults are not secure.</Callout>

      <H3>API key</H3>
      <P>The Mission Control API at port 4310 is protected by <Code>{'CLAWD_API_KEY'}</Code>. This key is set in <Code>{'.env.local'}</Code> and sent as the <Code>{'x-api-key'}</Code> header on every request from the Next.js proxy. Port 4310 only listens on localhost — it is never directly exposed.</P>

      <H3>Supervisor managed processes</H3>
      <P>All Mission Control processes are managed by Supervisor via <Code>{'supervisord.conf'}</Code> in the workspace. If a process crashes it restarts automatically.</P>
      <CodeBlock>{`# Check all process status
supervisorctl -c ~/.openclaw/workspace/supervisord.conf status

# Restart a specific process
supervisorctl -c ~/.openclaw/workspace/supervisord.conf restart mission-control

# View logs
tail -50 ~/.openclaw/workspace/logs/mission-control-err.log`}</CodeBlock>

      <H3>Deploy process</H3>
      <P>When your dev team pushes to the main branch, tell Clawd to deploy:</P>
      <CodeBlock>{'deploy mission control'}</CodeBlock>
      <P>This runs the deploy script at <Code>{'scripts/deploy-mission-control.sh'}</Code> which pulls the latest code, installs dependencies, builds the Next.js app, and restarts the process.</P>

      <H3>Bridge safety</H3>
      <P>The bridge process that syncs OpenClaw data into Mission Control has built-in safeguards:</P>
      <UL items={[
        'Only one poll runs at a time — never overlapping',
        '10 second timeout per CLI command — hung processes are killed automatically',
        'CPU load guard — if server load exceeds 5, the poll is skipped',
        'After 3 consecutive failures the bridge stops itself and logs the reason',
        'Polling interval is 60 seconds — safe for production',
      ]} />
    </div>
  )
}

const SECTION_CONTENT: Record<string, React.ReactNode> = {
  overview:      <SectionOverview />,
  tasks:         <SectionTasks />,
  agents:        <SectionAgents />,
  calendar:      <SectionCalendar />,
  servers:       <SectionServers />,
  office:        <SectionOffice />,
  memory:        <SectionMemory />,
  understanding: <SectionUnderstanding />,
  models:        <SectionModels />,
  security:      <SectionSecurity />,
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [active, setActive] = useState('overview')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [active])

  const activeSection = SECTIONS.find(s => s.id === active)

  return (
    <div className="-m-8 flex" style={{ height: 'calc(100vh)' }}>
      {/* Left nav */}
      <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto bg-bg">
        <div className="px-5 py-6 border-b border-border">
          <div className="text-[10px] text-text-dim/40 tracking-widest uppercase mb-1">Documentation</div>
          <div className="font-display text-base font-700 text-text">Mission Control</div>
        </div>

        <div className="p-3">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActive(section.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded text-xs tracking-wide transition-all mb-0.5 ${
                active === section.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-dim hover:text-text hover:bg-white/5'
              }`}
            >
              <span className="text-[11px] opacity-70 w-4 text-center">{section.icon}</span>
              <span className="flex-1">{section.label}</span>
              {active === section.id && (
                <span className="w-1 h-1 rounded-full bg-accent shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 pt-5 mt-4 border-t border-border">
          <div className="text-[9px] text-text-dim/30 tracking-widest leading-relaxed">
            Mission Control<br />
            OpenClaw &middot; CLAWDBOT
          </div>
        </div>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '48px 56px' }}
      >
        <div className="max-w-[720px] animate-fade-in">
          {/* Breadcrumb */}
          <div className="text-[10px] text-text-dim/40 tracking-widest font-mono mb-6">
            DOCS &rsaquo; {activeSection?.label.toUpperCase()}
          </div>

          {SECTION_CONTENT[active]}

          {/* Next/prev section nav */}
          <div className="flex justify-between mt-14 pt-6 border-t border-border">
            {SECTIONS.findIndex(s => s.id === active) > 0 ? (
              <button
                onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) - 1].id)}
                className="text-xs text-text-dim hover:text-accent transition-colors font-mono flex items-center gap-2"
              >
                &larr; {SECTIONS[SECTIONS.findIndex(s => s.id === active) - 1].label}
              </button>
            ) : <div />}

            {SECTIONS.findIndex(s => s.id === active) < SECTIONS.length - 1 ? (
              <button
                onClick={() => setActive(SECTIONS[SECTIONS.findIndex(s => s.id === active) + 1].id)}
                className="text-xs text-text-dim hover:text-accent transition-colors font-mono flex items-center gap-2"
              >
                {SECTIONS[SECTIONS.findIndex(s => s.id === active) + 1].label} &rarr;
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  )
}
