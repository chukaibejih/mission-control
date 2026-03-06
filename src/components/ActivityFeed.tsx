'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { parseActivity, todayStr, type ActivityEntry } from '@/lib/parseActivity'
import type { MemoryFile } from '@/lib/api'
import { deferToIdle } from '@/lib/defer'

const TYPE_CONFIG: Record<ActivityEntry['type'], { color: string; label: string }> = {
  status_change: { color: '#ffaa00', label: 'STATUS' },
  file_edit:     { color: '#cc44ff', label: 'FILE' },
  command:       { color: '#4499ff', label: 'CMD' },
  heartbeat:     { color: '#00ff9d', label: 'PULSE' },
  note:          { color: '#6b6b85', label: 'NOTE' },
}

export function ActivityFeed({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/memory')
      const json = await res.json()
      const files: MemoryFile[] = json.data ?? json

      // Find today's memory file
      const today = todayStr()
      const todayFile = files.find(f => f.name.includes(today) || f.path.includes(today))

      if (todayFile?.content) {
        setEntries(parseActivity(todayFile.content))
      } else if (files.length > 0) {
        // Fall back to most recent file
        const latest = files[files.length - 1]
        if (latest?.content) {
          setEntries(parseActivity(latest.content))
        }
      }
    } catch {
      // Daemon may be offline
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const cleanup = deferToIdle(() => {
      loadActivity().finally(() => {
        if (!cancelled) setInitialized(true)
      })
    }, 900)
    return () => {
      cancelled = true
      cleanup()
    }
  }, [loadActivity])

  useEffect(() => {
    if (!initialized) return
    loadActivity()
  }, [initialized, refreshKey, loadActivity])

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-8 shrink-0 bg-surface border border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-accent/30 transition-colors"
        title="Expand activity feed"
      >
        <span className="text-[10px] text-text-dim [writing-mode:vertical-rl] tracking-widest uppercase">
          Activity
        </span>
      </button>
    )
  }

  return (
    <div className="w-72 shrink-0 bg-surface border border-border rounded-lg flex flex-col scan-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-[10px] uppercase tracking-widest text-text-dim font-700">
          Live Activity
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-dim text-[10px] hover:text-text transition-colors"
            title="Collapse"
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {loading ? (
          <div className="text-accent text-[10px] animate-pulse-slow p-2">Loading activity...</div>
        ) : entries.length === 0 ? (
          <div className="text-text-dim text-[10px] p-2 text-center">No activity logged today</div>
        ) : (
          entries.map(entry => {
            const cfg = TYPE_CONFIG[entry.type]
            return (
              <div
                key={entry.id}
                className="flex gap-2 px-2 py-1.5 rounded hover:bg-bg/50 transition-colors group"
              >
                {/* Time */}
                <span className="text-[10px] text-text-dim shrink-0 font-mono w-10">
                  {entry.time || '--:--'}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[9px] uppercase tracking-widest font-700 mr-1.5"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-text-dim group-hover:text-text transition-colors leading-snug">
                    {entry.description}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border">
        <span className="text-[9px] text-text-dim">
          {entries.length} event{entries.length !== 1 ? 's' : ''} today
        </span>
      </div>
    </div>
  )
}
