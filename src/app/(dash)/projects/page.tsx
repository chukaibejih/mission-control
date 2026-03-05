'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Project, Task, Doc } from '@/lib/api'
import { deferToIdle } from '@/lib/defer'

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active:   { color: '#00ff9d', label: 'ACTIVE' },
  paused:   { color: '#ffaa00', label: 'PAUSED' },
  complete: { color: '#4499ff', label: 'COMPLETE' },
}

const TASK_STATUS_COLOR: Record<string, string> = {
  recurring: '#4499ff', backlog: '#6b6b85', in_progress: '#ffaa00', review: '#cc44ff', done: '#00ff9d',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [docsReady, setDocsReady] = useState(false)
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [promptBusy, setPromptBusy] = useState<string | null>(null)
  const [promptResponse, setPromptResponse] = useState<Record<string, string>>({})

  const loadCore = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        fetch('/api/proxy/projects'),
        fetch('/api/proxy/tasks'),
      ])
      const projJson = await projRes.json()
      const tasksJson = await tasksRes.json()
      setProjects(projJson.data ?? projJson)
      setTasks(tasksJson.data ?? tasksJson)
    } catch {}
    setLoading(false)
  }, [])

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    setDocsError(null)
    try {
      const docsRes = await fetch('/api/proxy/docs')
      const docsJson = await docsRes.json()
      setDocs(docsJson.data ?? docsJson)
      setDocsReady(true)
    } catch {
      setDocsError('Docs unavailable (API offline?)')
      setDocsReady(false)
    }
    setDocsLoading(false)
  }, [])

  useEffect(() => {
    loadCore()
    const cancel = deferToIdle(() => loadDocs(), 1200)
    return () => cancel()
  }, [loadCore, loadDocs])

  useSSE((r) => {
    if (r === 'projects' || r === 'tasks') loadCore()
    if (r === 'docs') loadDocs()
  })

  const tasksForProject = (id: string) => tasks.filter(t => t.project === id)
  const docsForProject = (id: string) => docs.filter(d => d.path?.includes(id) || d.label?.toLowerCase().includes(id))

  async function launchPrompt(project: Project) {
    setPromptBusy(project.id)
    try {
      const pTasks = tasksForProject(project.id)
      const backlog = pTasks.filter(t => t.status === 'backlog').map(t => t.title)
      const inProgress = pTasks.filter(t => t.status === 'in_progress').map(t => t.title)
      const prompt = `Project: ${project.name}\nGoal: ${project.goal}\nBacklog: ${backlog.join(', ') || 'none'}\nIn Progress: ${inProgress.join(', ') || 'none'}\n\nWhat task can we do right now to advance this project? Reply with a specific, actionable next step.`
      const res = await fetch('/api/proxy/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (res.ok) {
        const json = await res.json()
        setPromptResponse(prev => ({ ...prev, [project.id]: json.response || json.data || JSON.stringify(json) }))
      } else {
        setPromptResponse(prev => ({ ...prev, [project.id]: 'Clawd did not respond. The prompt endpoint may not be available yet.' }))
      }
    } catch {
      setPromptResponse(prev => ({ ...prev, [project.id]: 'Could not reach Clawd. Is the daemon running?' }))
    }
    setPromptBusy(null)
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Projects</h1>
        <p className="text-text-dim text-xs mt-1">{projects.filter(p => p.status === 'active').length} active · {projects.length} total</p>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Loading projects…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map(p => {
            const s = STATUS_STYLE[p.status] || STATUS_STYLE.paused
            const pTasks = tasksForProject(p.id)
            const pDocs = docsForProject(p.id)
            const doneTasks = pTasks.filter(t => t.status === 'done').length
            const progress = pTasks.length > 0 ? Math.round((doneTasks / pTasks.length) * 100) : 0
            const isExpanded = expanded === p.id
            return (
              <div key={p.id} className="bg-surface border border-border rounded hover:border-accent/30 transition-all group glow-box scan-in">
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-text-dim text-xs transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
                        <h2 className="font-display text-base font-700 text-text group-hover:text-accent transition-colors">{p.name}</h2>
                        <span className="tag" style={{ background: s.color + '22', color: s.color }}>{s.label}</span>
                        <span className="text-[10px] text-text-dim">{pTasks.length} tasks · {pDocs.length} docs</span>
                      </div>
                      <p className="text-xs text-text-dim leading-relaxed ml-7">{p.goal}</p>
                    </div>
                    <div className="text-right text-[10px] text-text-dim space-y-1 shrink-0">
                      <div>Agent: <span className="text-text">{p.agent}</span></div>
                      <div className="font-mono text-[9px]">{p.path.split('/').pop()}</div>
                      <div>{new Date(p.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Progress bar — real metrics */}
                  <div className="mt-4 h-px bg-border relative overflow-hidden ml-7">
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-700"
                      style={{
                        width: p.status === 'complete' ? '100%' : `${progress}%`,
                        background: s.color,
                        boxShadow: `0 0 8px ${s.color}`,
                      }}
                    />
                  </div>
                  {pTasks.length > 0 && (
                    <div className="mt-1 ml-7 text-[9px] text-text-dim">
                      {doneTasks}/{pTasks.length} done ({progress}%)
                    </div>
                  )}
                </div>

                {/* Expanded drill-down */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4 animate-fade-in">
                    {/* Tasks */}
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Tasks</span>
                      {pTasks.length === 0 ? (
                        <span className="text-[10px] text-text-dim">No tasks linked</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {pTasks.map(t => (
                            <div key={t.id} className="bg-bg border border-border rounded px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-text truncate flex-1 mr-2">{t.title}</span>
                              <span className="text-[9px] uppercase tracking-widest shrink-0" style={{ color: TASK_STATUS_COLOR[t.status] || '#6b6b85' }}>
                                {t.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Docs */}
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Documents</span>
                      {!docsReady ? (
                        <span className="text-[10px] text-text-dim">
                          {docsLoading ? 'Loading docs…' : (docsError || 'Docs will load once ready')}
                        </span>
                      ) : pDocs.length === 0 ? (
                        <span className="text-[10px] text-text-dim">No docs linked</span>
                      ) : (
                        <div className="space-y-1">
                          {pDocs.map(d => (
                            <div key={d.id} className="bg-bg border border-border rounded px-3 py-2 text-xs text-text">
                              {d.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reverse Prompt */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-text-dim">Ask Clawd</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); launchPrompt(p) }}
                          disabled={promptBusy === p.id}
                          className="text-[10px] uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent rounded px-3 py-1 hover:bg-accent/20 disabled:opacity-40 transition"
                        >
                          {promptBusy === p.id ? 'Thinking...' : 'What should we do next?'}
                        </button>
                      </div>
                      {promptResponse[p.id] && (
                        <div className="bg-bg border border-border rounded p-3 text-xs text-text-dim whitespace-pre-wrap scan-in">
                          {promptResponse[p.id]}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
