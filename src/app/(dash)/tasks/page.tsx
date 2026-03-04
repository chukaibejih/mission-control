'use client'
import { useEffect, useState, useCallback, useRef, FormEvent } from 'react'
import { useSSE } from '@/hooks/useSSE'
import { ActivityFeed } from '@/components/ActivityFeed'
import type { Task, TaskStatus, Agent, Project, MemoryFile } from '@/lib/api'

const COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'recurring',   label: 'Recurring',   color: '#4499ff' },
  { id: 'backlog',     label: 'Backlog',      color: '#6b6b85' },
  { id: 'in_progress', label: 'In Progress',  color: '#ffaa00' },
  { id: 'review',      label: 'Review',       color: '#cc44ff' },
  { id: 'done',        label: 'Done',         color: '#00ff9d' },
]

const PROJECT_COLORS: Record<string, string> = {
  'liberty-platform': '#4499ff',
  'statementpro':     '#ffaa00',
  'glass-chat':       '#cc44ff',
  'ops':              '#ff4466',
  'general':          '#6b6b85',
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
]

function TaskCard({ task, highlighted, onClick }: { task: Task; highlighted?: boolean; onClick?: () => void }) {
  const pc = PROJECT_COLORS[task.project] || '#6b6b85'
  return (
    <div
      onClick={onClick}
      className={`bg-bg border rounded p-3 space-y-2 scan-in hover:border-accent/30 transition-colors group cursor-pointer ${highlighted ? 'task-highlight border-accent/60' : 'border-border'}`}
    >
      <p className="text-xs text-text leading-snug group-hover:text-accent transition-colors">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className="tag" style={{ background: pc + '22', color: pc }}>{task.project}</span>
        <span className="text-[10px] text-text-dim">{task.agent}</span>
      </div>
      {task.notes && <p className="text-[10px] text-text-dim line-clamp-2">{task.notes}</p>}
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    agent: '',
    status: 'backlog' as TaskStatus,
    project: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [feedKey, setFeedKey] = useState(0)
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set())
  const prevStatusRef = useRef<Map<string, TaskStatus>>(new Map())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [reviewAction, setReviewAction] = useState<'idle' | 'approving' | 'rejecting'>('idle')
  const [rejectNote, setRejectNote] = useState('')
  const [memorySnippets, setMemorySnippets] = useState<{ file: string; lines: string[] }[]>([])
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [reviewAlert, setReviewAlert] = useState<string[]>([])


  const load = useCallback(async () => {
    try {
      const [tasksRes, agentsRes, projectsRes] = await Promise.all([
        fetch('/api/proxy/tasks'),
        fetch('/api/proxy/agents'),
        fetch('/api/proxy/projects'),
      ])
      const tasksJson = await tasksRes.json()
      const agentsJson = await agentsRes.json()
      const projectsJson = await projectsRes.json()
      const newTasks: Task[] = tasksJson.data ?? tasksJson
      // Detect tasks that changed status
      const prev = prevStatusRef.current
      if (prev.size > 0) {
        const moved = new Set<string>()
        for (const t of newTasks) {
          const old = prev.get(t.id)
          if (old && old !== t.status) moved.add(t.id)
        }
        if (moved.size > 0) {
          setChangedIds(moved)
          setTimeout(() => setChangedIds(new Set()), 2000)
          // Alert for tasks that just entered review
          const newReview = newTasks.filter(t => t.status === 'review' && moved.has(t.id))
          if (newReview.length > 0) {
            setReviewAlert(newReview.map(t => t.title))
            setTimeout(() => setReviewAlert([]), 8000)
          }
        }
      }
      // Update ref for next comparison
      const next = new Map<string, TaskStatus>()
      for (const t of newTasks) next.set(t.id, t.status)
      prevStatusRef.current = next

      setTasks(newTasks)
      setAgents(agentsJson.data ?? agentsJson)
      setProjects(projectsJson.data ?? projectsJson)
      setForm(f => ({
        ...f,
        agent: agentsJson.data?.[0]?.id || agentsJson[0]?.id || f.agent,
        project: projectsJson.data?.[0]?.id || projectsJson[0]?.id || f.project,
      }))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => {
    if (r === 'tasks') load()
    if (r === 'tasks' || r === 'memory') setFeedKey(k => k + 1)
  })

  const byStatus = (s: TaskStatus) => tasks.filter(t => t.status === s)

  const handleOpenModal = () => {
    setForm(f => ({ ...f, agent: f.agent || agents[0]?.id || '', project: f.project || projects[0]?.id || '' }))
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSubmitting(false)
    setError('')
    setForm({ title: '', agent: agents[0]?.id || '', status: 'backlog', project: projects[0]?.id || '', notes: '' })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/proxy/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        throw new Error('Failed to create task')
      }
      await load()
      handleCloseModal()
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
      setSubmitting(false)
    }
  }

  async function loadMemoryForTask(task: Task) {
    setMemoryLoading(true)
    setMemorySnippets([])
    try {
      const res = await fetch('/api/proxy/memory')
      const json = await res.json()
      const files: MemoryFile[] = json.data ?? json
      const snippets: { file: string; lines: string[] }[] = []
      const searchTerms = [task.title.toLowerCase(), task.id.toLowerCase()]
      for (const f of files) {
        const lines = f.content.split('\n')
        const matches = lines.filter(l => searchTerms.some(t => l.toLowerCase().includes(t)))
        if (matches.length > 0) {
          snippets.push({ file: f.name, lines: matches.slice(0, 5) })
        }
      }
      setMemorySnippets(snippets)
    } catch {}
    setMemoryLoading(false)
  }

  function selectTask(task: Task) {
    setSelectedTask(task)
    loadMemoryForTask(task)
  }

  async function handleReviewAction(taskId: string, action: 'approve' | 'reject') {
    setReviewAction(action === 'approve' ? 'approving' : 'rejecting')
    try {
      const body: Record<string, string> = action === 'approve'
        ? { status: 'done' }
        : { status: 'backlog', notes: rejectNote ? `[REJECTED] ${rejectNote}` : '[REJECTED] Sent back for rework' }
      const res = await fetch(`/api/proxy/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update task')
      await load()
      setSelectedTask(null)
      setRejectNote('')
    } catch {}
    setReviewAction('idle')
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Task Board</h1>
          <p className="text-text-dim text-xs mt-1">{tasks.length} tasks across {COLS.length} stages</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="text-xs uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent rounded px-4 py-2 hover:bg-accent/20 hover:border-accent/60 transition"
        >
          + New Task
        </button>
      </header>

      {reviewAlert.length > 0 && (
        <div className="mb-4 bg-[#cc44ff]/10 border border-[#cc44ff]/30 rounded px-4 py-3 scan-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#cc44ff] animate-pulse" />
            <span className="text-xs text-[#cc44ff]">
              {reviewAlert.length === 1
                ? `"${reviewAlert[0]}" needs your review`
                : `${reviewAlert.length} tasks need your review`}
            </span>
          </div>
          <button onClick={() => setReviewAlert([])} className="text-[10px] text-text-dim hover:text-text">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Loading tasks…</div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          <div className="flex-1 grid grid-cols-5 gap-4 min-w-0">
            {COLS.map(col => {
              const colTasks = byStatus(col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-700" style={{ color: col.color }}>
                      {col.label}
                    </span>
                    <span className="text-[10px] text-text-dim bg-surface border border-border px-1.5 py-0.5 rounded">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 min-h-32 overflow-y-auto">
                    {colTasks.map(t => <TaskCard key={t.id} task={t} highlighted={changedIds.has(t.id)} onClick={() => selectTask(t)} />)}
                    {colTasks.length === 0 && (
                      <div className="border border-dashed border-border rounded p-3 text-[10px] text-text-dim text-center">
                        empty
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ActivityFeed refreshKey={feedKey} />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-700 text-text uppercase tracking-widest">New Task</h2>
              <button onClick={handleCloseModal} className="text-text-dim text-xs">ESC</button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Assign To</label>
                <div className="flex flex-wrap gap-2">
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setForm({ ...form, agent: agent.id })}
                      className={`px-3 py-1 rounded text-xs border transition ${form.agent === agent.id ? 'bg-accent/20 border-accent text-accent' : 'border-border text-text'}`}
                    >
                      {agent.name}
                    </button>
                  ))}
                  {agents.length === 0 && <span className="text-[10px] text-text-dim">No agents configured</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Project</label>
                  <select
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text min-h-[80px]"
                />
              </div>

              {error && <p className="text-danger text-[10px]">{error}</p>}

              <div className="flex justify-end gap-3 text-xs uppercase tracking-widest">
                <button type="button" onClick={handleCloseModal} className="text-text-dim">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="bg-accent/20 border border-accent/40 text-accent px-4 py-2 rounded hover:bg-accent/30 disabled:opacity-40"
                >
                  {submitting ? 'Saving…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => { setSelectedTask(null); setRejectNote('') }}>
          <div className="bg-surface border border-border rounded-lg w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] uppercase tracking-widest font-700"
                  style={{ color: COLS.find(c => c.id === selectedTask.status)?.color }}
                >
                  {selectedTask.status.replace('_', ' ')}
                </span>
                <span className="tag" style={{
                  background: (PROJECT_COLORS[selectedTask.project] || '#6b6b85') + '22',
                  color: PROJECT_COLORS[selectedTask.project] || '#6b6b85'
                }}>
                  {selectedTask.project}
                </span>
              </div>
              <button onClick={() => { setSelectedTask(null); setRejectNote('') }} className="text-text-dim text-xs hover:text-text">ESC</button>
            </div>

            {/* Title */}
            <h2 className="text-sm font-700 text-text">{selectedTask.title}</h2>

            {/* Meta */}
            <div className="grid grid-cols-3 gap-3 text-[10px] text-text-dim">
              <div>
                <span className="uppercase tracking-widest block mb-1">Agent</span>
                <span className="text-text text-xs">{selectedTask.agent}</span>
              </div>
              <div>
                <span className="uppercase tracking-widest block mb-1">Created</span>
                <span className="text-text text-xs">{new Date(selectedTask.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="uppercase tracking-widest block mb-1">Updated</span>
                <span className="text-text text-xs">{new Date(selectedTask.updated_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedTask.notes && (
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Notes</span>
                <div className="bg-bg border border-border rounded p-3 text-xs text-text-dim whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedTask.notes}
                </div>
              </div>
            )}

            {/* Memory Linkage */}
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Memory Context</span>
              {memoryLoading ? (
                <div className="text-accent text-[10px] animate-pulse-slow">Searching memory...</div>
              ) : memorySnippets.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {memorySnippets.map((s, i) => (
                    <div key={i} className="bg-bg border border-border rounded p-2">
                      <span className="text-[9px] font-mono text-accent block mb-1">{s.file}</span>
                      {s.lines.map((line, j) => (
                        <p key={j} className="text-[10px] text-text-dim leading-relaxed">{line}</p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-text-dim bg-bg border border-border rounded p-2 text-center">
                  No memory entries found for this task
                </div>
              )}
            </div>

            {/* Review Actions */}
            {selectedTask.status === 'review' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <span className="block text-[10px] uppercase tracking-widest text-text-dim">Review Decision</span>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Optional: add a note (used if rejecting)..."
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text min-h-[60px] focus:outline-none focus:border-accent/60"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewAction(selectedTask.id, 'approve')}
                    disabled={reviewAction !== 'idle'}
                    className="flex-1 bg-accent/20 border border-accent/40 text-accent text-xs uppercase tracking-widest py-2 rounded hover:bg-accent/30 disabled:opacity-40 transition"
                  >
                    {reviewAction === 'approving' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReviewAction(selectedTask.id, 'reject')}
                    disabled={reviewAction !== 'idle'}
                    className="flex-1 bg-danger/10 border border-danger/30 text-danger text-xs uppercase tracking-widest py-2 rounded hover:bg-danger/20 disabled:opacity-40 transition"
                  >
                    {reviewAction === 'rejecting' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
