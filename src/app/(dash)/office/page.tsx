'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import { ActivityFeed } from '@/components/ActivityFeed'
import type { Agent, Task, Project } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  active: '#00ff9d',
  idle: '#ffaa00',
  offline: '#ff4466',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ONLINE',
  idle: 'IDLE',
  offline: 'OFFLINE',
}

function timeSince(ts: string, now: number) {
  const diff = Math.floor((now - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function contextColor(pct: number): string {
  if (pct < 60) return '#00ff9d'
  if (pct < 85) return '#ffaa00'
  return '#ff4466'
}

export default function OfficePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [feedKey, setFeedKey] = useState(0)

  const load = useCallback(async () => {
    try {
      const [agentsRes, tasksRes, projectsRes] = await Promise.all([
        fetch('/api/proxy/agents'),
        fetch('/api/proxy/tasks'),
        fetch('/api/proxy/projects'),
      ])
      const agentsJson = await agentsRes.json()
      const tasksJson = await tasksRes.json()
      const projectsJson = await projectsRes.json()
      setAgents(agentsJson.data ?? agentsJson)
      setTasks(tasksJson.data ?? tasksJson)
      setProjects(projectsJson.data ?? projectsJson)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t) }, [])
  useSSE((r) => {
    if (r === 'agents' || r === 'tasks') load()
    if (r === 'memory' || r === 'tasks') setFeedKey(k => k + 1)
  })

  const primaryAgent = agents.find(a => a.status === 'active') || agents[0]
  const activeCount = agents.filter(a => a.status === 'active').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  const heroTask = inProgressTasks[0]
  const otherActive = inProgressTasks.slice(1)
  const heroProject = heroTask ? projects.find(p => p.id === heroTask.project) : null
  const taskCounts = {
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    backlog: tasks.filter(t => t.status === 'backlog').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Office</h1>
        <p className="text-text-dim text-xs mt-1">Live operational view</p>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Scanning systems...</div>
      ) : (
        <div className="space-y-4">
          {/* ── SECTION A: System Health Bar ── */}
          <div className="bg-surface border border-border rounded-lg p-3 glow-box">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Agent status */}
              {primaryAgent && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: STATUS_COLORS[primaryAgent.status],
                      boxShadow: primaryAgent.status === 'active' ? `0 0 8px ${STATUS_COLORS.active}` : 'none',
                    }}
                  />
                  <span className="text-[10px] uppercase tracking-widest font-700" style={{ color: STATUS_COLORS[primaryAgent.status] }}>
                    {STATUS_LABELS[primaryAgent.status]}
                  </span>
                  <span className="text-[10px] text-text-dim">·</span>
                  <span className="text-[10px] text-text font-mono">{primaryAgent.name}</span>
                </div>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Model */}
              {primaryAgent?.model && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-dim uppercase tracking-widest">Model</span>
                  <span className="text-[10px] text-text font-mono bg-bg px-1.5 py-0.5 rounded border border-border">{primaryAgent.model}</span>
                </div>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Context usage */}
              {primaryAgent?.contextUsagePct != null && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-text-dim uppercase tracking-widest">Context</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-bg rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${primaryAgent.contextUsagePct}%`,
                          background: contextColor(primaryAgent.contextUsagePct),
                          boxShadow: `0 0 4px ${contextColor(primaryAgent.contextUsagePct)}66`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-700" style={{ color: contextColor(primaryAgent.contextUsagePct) }}>
                      {primaryAgent.contextUsagePct}%
                    </span>
                  </div>
                </div>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Tokens */}
              {primaryAgent?.totalTokens != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-dim uppercase tracking-widest">Tokens</span>
                  <span className="text-[10px] text-text font-mono">{formatTokens(primaryAgent.totalTokens)}</span>
                </div>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Uptime / last seen */}
              {primaryAgent && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-dim uppercase tracking-widest">Seen</span>
                  <span className="text-[10px] text-accent font-mono">{timeSince(primaryAgent.last_seen, now)}</span>
                </div>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Task summary */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-dim uppercase tracking-widest">Tasks</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span style={{ color: '#ffaa00' }}>{taskCounts.in_progress} active</span>
                  <span className="text-text-dim">·</span>
                  <span style={{ color: '#cc44ff' }}>{taskCounts.review} review</span>
                  <span className="text-text-dim">·</span>
                  <span style={{ color: '#00ff9d' }}>{taskCounts.done} done</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION B + C: Hero Card + Activity Feed ── */}
          <div className="flex gap-4">
            {/* Left: Current Focus */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Hero card */}
              <div className="bg-surface border border-border rounded-lg p-6 glow-box relative overflow-hidden">
                {/* Subtle SVG background */}
                <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
                  <defs>
                    <pattern id="office-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#00ff9d" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100" height="40" fill="url(#office-grid)" />
                </svg>

                <div className="relative z-10">
                  <div className="text-[10px] uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
                    Current Focus
                  </div>

                  {heroTask ? (
                    <div>
                      <h2 className="font-display text-xl font-800 text-text mb-3">{heroTask.title}</h2>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="block text-[9px] uppercase tracking-widest text-text-dim mb-1">Project</span>
                          <span className="text-xs text-text">{heroProject?.name || heroTask.project || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-widest text-text-dim mb-1">Agent</span>
                          <span className="text-xs text-text">{heroTask.agent}{primaryAgent?.model ? ` · ${primaryAgent.model}` : ''}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-widest text-text-dim mb-1">Started</span>
                          <span className="text-xs text-accent">{timeSince(heroTask.updated_at, now)}</span>
                        </div>
                      </div>

                      {/* Context usage bar — prominent */}
                      {primaryAgent?.contextUsagePct != null && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] uppercase tracking-widest text-text-dim">Context Window</span>
                            <span className="text-sm font-mono font-700" style={{ color: contextColor(primaryAgent.contextUsagePct) }}>
                              {primaryAgent.contextUsagePct}%
                            </span>
                          </div>
                          <div className="h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${primaryAgent.contextUsagePct}%`,
                                background: contextColor(primaryAgent.contextUsagePct),
                                boxShadow: `0 0 10px ${contextColor(primaryAgent.contextUsagePct)}66`,
                              }}
                            />
                          </div>
                          {primaryAgent.inputTokens != null && primaryAgent.outputTokens != null && (
                            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-text-dim font-mono">
                              <span>in: {primaryAgent.inputTokens.toLocaleString()}</span>
                              <span>out: {primaryAgent.outputTokens.toLocaleString()}</span>
                              <span>total: {primaryAgent.totalTokens?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {heroTask.notes && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <span className="block text-[9px] uppercase tracking-widest text-text-dim mb-1">Notes</span>
                          <p className="text-xs text-text-dim leading-relaxed">{heroTask.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-text-dim text-sm mb-1">No active tasks</div>
                      <div className="text-[10px] text-text-dim/60">Clawd is idle — waiting for work</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Other in-progress tasks */}
              {otherActive.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Also In Progress</div>
                  <div className="space-y-2">
                    {otherActive.map(t => {
                      const proj = projects.find(p => p.id === t.project)
                      return (
                        <div key={t.id} className="bg-surface border border-border rounded p-3 flex items-center justify-between gap-3 scan-in">
                          <div className="min-w-0">
                            <div className="text-xs text-text truncate">{t.title}</div>
                            <div className="text-[10px] text-text-dim">{proj?.name || t.project} · {t.agent}</div>
                          </div>
                          <span className="text-[9px] text-accent shrink-0">{timeSince(t.updated_at, now)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── SECTION D: Active Agents Row ── */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Agents</div>
                <div className="grid grid-cols-3 gap-3">
                  {agents.map(agent => {
                    const color = STATUS_COLORS[agent.status] || '#6b6b85'
                    return (
                      <div key={agent.id} className="bg-surface border border-border rounded-lg p-3 hover:border-accent/30 transition-all scan-in">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: color,
                              boxShadow: agent.status === 'active' ? `0 0 6px ${color}` : 'none',
                            }}
                          />
                          <span className="text-xs font-700 text-text truncate">{agent.name}</span>
                          <span className="text-[9px] uppercase tracking-widest ml-auto shrink-0" style={{ color }}>
                            {STATUS_LABELS[agent.status]}
                          </span>
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-text-dim">Role</span>
                            <span className="text-text truncate max-w-32 text-right">{agent.role}</span>
                          </div>
                          {agent.model && (
                            <div className="flex justify-between">
                              <span className="text-text-dim">Model</span>
                              <span className="text-text font-mono">{agent.model}</span>
                            </div>
                          )}
                          {agent.contextUsagePct != null && (
                            <div className="flex items-center justify-between">
                              <span className="text-text-dim">Context</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 h-1 bg-bg rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${agent.contextUsagePct}%`,
                                      background: contextColor(agent.contextUsagePct),
                                    }}
                                  />
                                </div>
                                <span className="font-mono" style={{ color: contextColor(agent.contextUsagePct) }}>
                                  {agent.contextUsagePct}%
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-text-dim">Seen</span>
                            <span className="text-accent font-mono">{timeSince(agent.last_seen, now)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Vacant slots */}
                  {agents.length < 3 && Array.from({ length: 3 - agents.length }).map((_, i) => (
                    <div key={`vacant-${i}`} className="border border-border/50 border-dashed rounded-lg p-3 flex items-center justify-center">
                      <span className="text-[10px] text-text-dim/40 uppercase tracking-widest">Vacant</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Activity Feed */}
            <ActivityFeed refreshKey={feedKey} />
          </div>
        </div>
      )}
    </div>
  )
}
