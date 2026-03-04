'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Project } from '@/lib/api'

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active:   { color: '#00ff9d', label: 'ACTIVE' },
  paused:   { color: '#ffaa00', label: 'PAUSED' },
  complete: { color: '#4499ff', label: 'COMPLETE' },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/projects')
      const json = await res.json()
      setProjects(json.data ?? json)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => { if (r === 'projects') load() })

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
            return (
              <div key={p.id} className="bg-surface border border-border rounded p-5 hover:border-accent/30 transition-all group glow-box scan-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-display text-base font-700 text-text group-hover:text-accent transition-colors">{p.name}</h2>
                      <span className="tag" style={{ background: s.color + '22', color: s.color }}>{s.label}</span>
                    </div>
                    <p className="text-xs text-text-dim leading-relaxed">{p.goal}</p>
                  </div>
                  <div className="text-right text-[10px] text-text-dim space-y-1 shrink-0">
                    <div>Agent: <span className="text-text">{p.agent}</span></div>
                    <div className="font-mono text-[9px]">{p.path.split('/').pop()}</div>
                    <div>{new Date(p.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Progress bar placeholder */}
                <div className="mt-4 h-px bg-border relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full transition-all duration-700"
                    style={{
                      width: p.status === 'complete' ? '100%' : p.status === 'active' ? '40%' : '10%',
                      background: s.color,
                      boxShadow: `0 0 8px ${s.color}`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
