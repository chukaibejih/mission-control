'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'

interface PR {
  id: string
  title: string
  repo: string
  branch: string
  status: 'open' | 'merged' | 'closed'
  author: string
  created_at: string
  url?: string
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  open:   { color: '#00ff9d', label: 'OPEN' },
  merged: { color: '#cc44ff', label: 'MERGED' },
  closed: { color: '#ff4466', label: 'CLOSED' },
}

export default function PRsPage() {
  const [prs, setPrs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'merged' | 'closed'>('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/prs')
      if (!res.ok) {
        setError('PR feed not available — the /prs endpoint may not be configured on the Clawd daemon yet.')
        setLoading(false)
        return
      }
      const json = await res.json()
      setPrs(json.data ?? json)
      setError('')
    } catch {
      setError('Could not reach Clawd daemon.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => { if (r === 'prs') load() })

  const filtered = filter === 'all' ? prs : prs.filter(pr => pr.status === filter)
  const openCount = prs.filter(pr => pr.status === 'open').length

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Pull Requests</h1>
        <p className="text-text-dim text-xs mt-1">
          {openCount} open · {prs.length} total
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'merged', 'closed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest border transition ${
              filter === f
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'border-border text-text-dim hover:text-text'
            }`}
          >
            {f} {f !== 'all' && `(${prs.filter(pr => pr.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Loading PRs...</div>
      ) : error ? (
        <div className="bg-surface border border-border rounded p-8 text-center">
          <div className="text-text-dim text-xs mb-2">{error}</div>
          <p className="text-[10px] text-text-dim/60">
            Once the Clawd daemon exposes a /prs endpoint, open PRs across all repos will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded p-8 text-center text-text-dim text-xs">
          No pull requests {filter !== 'all' ? `with status "${filter}"` : 'found'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pr => {
            const s = STATUS_STYLE[pr.status] || STATUS_STYLE.open
            return (
              <div key={pr.id} className="bg-surface border border-border rounded p-4 hover:border-accent/30 transition-all scan-in flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="tag" style={{ background: s.color + '22', color: s.color }}>{s.label}</span>
                    <span className="text-xs text-text truncate">{pr.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-dim">
                    <span className="font-mono">{pr.repo}</span>
                    <span>&larr; {pr.branch}</span>
                    <span>by {pr.author}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-text-dim">
                    {new Date(pr.created_at).toLocaleDateString()}
                  </div>
                  {pr.url && (
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent hover:underline"
                    >
                      View &rarr;
                    </a>
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
