'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Task, TaskStatus, Agent, Project } from '@/lib/api'

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

function TaskCard({ task }: { task: Task }) {
  const pc = PROJECT_COLORS[task.project] || '#6b6b85'
  return (
    <div className="bg-bg border border-border rounded p-3 space-y-2 scan-in hover:border-accent/30 transition-colors group">
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
      setTasks(tasksJson.data ?? tasksJson)
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
  useSSE((r) => { if (r === 'tasks') load() })

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

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Loading tasks…</div>
      ) : (
        <div className="grid grid-cols-5 gap-4 h-full">
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
                <div className="flex flex-col gap-2 min-h-32">
                  {colTasks.map(t => <TaskCard key={t.id} task={t} />)}
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
    </div>
  )
}
