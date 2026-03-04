'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Task, TaskStatus } from '@/lib/api'

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
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/tasks')
      const json = await res.json()
      setTasks(json.data ?? json)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => { if (r === 'tasks') load() })

  const byStatus = (s: TaskStatus) => tasks.filter(t => t.status === s)

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Task Board</h1>
        <p className="text-text-dim text-xs mt-1">{tasks.length} tasks across {COLS.length} stages</p>
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
    </div>
  )
}
