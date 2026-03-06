 Mission Control — Full Feature Roadmap

 ### 🔴 Critical (makes the system actually autonomous)

 1. Live Activity Feed on Task Board
 A real-time sidebar on the tasks page showing every action Clawd takes as it happens — status changes, files touched, commands run. Pulled
 from today's memory file via SSE. This is your window into what Clawd is doing right now without asking.

 2. Task Status Updates by Clawd
 Clawd already updates tasks.json during heartbeats, but the board needs to visually reflect when a task moves from backlog → in_progress →
 review automatically without you refreshing.

 3. Review & Approve Flow
 When a task lands in the review column, you should be able to click it, read Clawd's summary of what was done, and hit Approve (moves to done)
 or Reject (moves back to backlog with a note). Right now there's no way to act on review tasks from the dashboard.

 ────────────────────────────────────────────────────────────────────────────────

 ### 🟡 Important (gives you real visibility)

 4. Task Detail Modal
 Clicking any task card opens a full view showing the full notes, history of status changes, timestamps, and what Clawd logged in memory about
 it. Right now cards are read-only and truncated.

 5. Projects linked to Tasks and Docs
 The projects page should show tasks belonging to each project and docs created under it. Right now projects are isolated cards with no
 drill-down.

 6. Memory linked to Tasks
 When viewing a task, you should be able to see the memory entry where Clawd logged working on it. Closes the loop between the board and what
 actually happened.

 7. Heartbeat Status Indicator
 A small indicator somewhere in the UI (sidebar or header) showing when the last heartbeat ran and whether it was HEARTBEAT_OK or produced
 work. Tells you at a glance if Clawd is alive and active.

 ────────────────────────────────────────────────────────────────────────────────

 ### 🟢 Quality of Life

 8. Notifications / Alerts
 When Clawd moves a task to review, you get a visible alert on the dashboard so you know something needs your attention without having to check
 the board manually.

 9. Project Progress Tracking
 Right now the progress bar on projects is hardcoded (active = 40%). It should calculate real progress based on the ratio of done tasks vs
 total tasks for that project.

 10. Calendar — Cron Job Creation
 Right now the calendar only reads existing schedules. You should be able to add a new scheduled routine directly from the UI and have it
 written to schedules.json for Clawd to pick up.

 11. Docs — Project Tagging
 Docs should be taggable by project so you can filter "show me all docs related to liberty-platform" rather than searching free text.

 12. Agent Mission Statement
 The agents page should display a mission statement at the top — what the overall goal is that all agents are working toward, as recommended in
 the video. Editable from the UI.

 ────────────────────────────────────────────────────────────────────────────────

 ### 🔵 Nice to Have (later)

 13. Office Screen
 2D pixel art visualization of Clawd and sub-agents at their desks, moving when active. Fun but also a quick visual signal of agent activity.

 14. Reverse Prompt Launcher
 A button on the projects page that sends a predefined prompt to Clawd asking "what task can we do right now to advance this project?" and
 shows the response inline.

 15. PR Feed
 Since Clawd opens PRs for all code changes, a feed showing open PRs across all repos with their status. Keeps you on top of what's ready to
 review in code without leaving Mission Control.


 Here’s the consolidated Mission Control feature roadmap, grouped by priority and aligning with everything we’ve discussed about autonomous
 operation:

 ────────────────────────────────────────────────────────────────────────────────

 🔴 Critical – makes Mission Control truly autonomous

 1. Live activity feed on the task board
 Stream every action I take (task moves, commands, file edits), pulled from the current memory file via SSE, so you can see work happening in
 real time.
 2. Task status auto-refresh
 When I update tasks/tasks.json, the board should update instantly via SSE—no manual refresh—showing backlog → in_progress → review transitions
 as they happen.
 3. Review & approve flow
 Tasks in review need an actionable detail pane where you can read my summary, attach a decision, and mark Approved (→ done) or Rejected (→
 backlog with a note).

 ────────────────────────────────────────────────────────────────────────────────

 🟡 Important – gives full situational awareness

 4. Task detail modal
 Clicking any card opens the full brief: notes, history, timestamps, and links to the memory entry covering the work.
 5. Project drill-down
 Projects page should show the active tasks and documents tied to each project, rather than just a static card.
 6. Memory linkage to tasks
 Each task detail view links to the relevant memory/<date>.md entry so you can read exactly what happened during execution.
 7. Heartbeat status indicator
 A header/sidebar widget showing the last heartbeat time and result (HEARTBEAT_OK vs work done) so you know I’m alive without digging.

 ────────────────────────────────────────────────────────────────────────────────

 🟢 Quality of Life

 8. Review alerts
 Visual notification when a task enters review, so you know something needs approval right away.
 9. Real project progress
 Replace the hardcoded progress bars with live metrics based on task counts (done vs total) per project.
 10. Calendar-based cron creation
 From the calendar UI, create/edit routines that write directly to calendar/schedules.json, so new heartbeats/jobs can be scheduled without
 editing files manually.
 11. Doc tagging / filtering
 Let docs be tagged by project and filterable in the Docs view (“show me everything for ops”).
 12. Agent mission statement
 Agents page gets an editable mission statement banner so it’s clear what the agents collectively own and strive for.

 ────────────────────────────────────────────────────────────────────────────────

 🔵 Nice to Have

 13. Office screen visualization
 A playful 2D map showing agents “at their desks” with motion when active—quick glance at activity without reading logs.
 14. Reverse prompt launcher
 Button that sends a predefined “what can we do next for this project?” prompt to me and displays my response inline, seeding new tasks.
 15. PR feed
 Surface open PRs (with statuses) across repos so you can see what’s awaiting review in code without leaving Mission Control.

 ────────────────────────────────────────────────────────────────────────────────

 Once these pieces land, Mission Control becomes the live cockpit for everything I do—tasks, heartbeats, memory, projects, and approvals all in
 one place.


