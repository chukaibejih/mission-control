const BASE = process.env.CLAWD_API_URL || 'http://127.0.0.1:4310'
const KEY  = process.env.CLAWD_API_KEY  || 'mission-control-dev-key'

const headers = () => ({ 'x-api-key': KEY, 'Content-Type': 'application/json' })

async function get<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`Clawd API error ${res.status} on ${path}`)
  const json = await res.json()
  return json.data ?? json
}

export const api = {
  tasks:     () => get<Task>('/tasks'),
  projects:  () => get<Project>('/projects'),
  agents:    () => get<Agent>('/agents'),
  schedules: () => get<Schedule>('/schedules'),
  memory:    () => get<MemoryFile>('/memory'),
  docs:      () => get<Doc>('/docs'),
}

export const SSE_URL = `${BASE}/events`
export const SSE_KEY = KEY

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'recurring' | 'backlog' | 'in_progress' | 'review' | 'done'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  agent: string
  project: string
  created_at: string
  updated_at: string
  notes?: string
}

export interface Project {
  id: string
  name: string
  status: 'active' | 'paused' | 'complete'
  goal: string
  path: string
  agent: string
  updated_at: string
}

export interface Agent {
  id: string
  name: string
  role: string
  status: 'active' | 'idle' | 'offline'
  device: string
  session_key: string
  last_seen: string
  model?: string
  contextUsagePct?: number
  totalTokens?: number
  inputTokens?: number
  outputTokens?: number
}

export interface Schedule {
  id: string
  name: string
  source: string
  description: string
  owner: string
  schedule: { kind: string; every_minutes?: number; cron?: string }
}

export interface MemoryFile {
  name: string
  path: string
  content: string
}

export interface Doc {
  id: string
  label: string
  path: string
  content: string
}
