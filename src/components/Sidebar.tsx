'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSSE } from '@/hooks/useSSE'

const nav = [
  { href: '/tasks',    label: 'Tasks',    icon: '◈' },
  { href: '/projects', label: 'Projects', icon: '◇' },
  { href: '/calendar', label: 'Calendar', icon: '◷' },
  { href: '/agents',   label: 'Agents',   icon: '◉' },
  { href: '/memory',   label: 'Memory',   icon: '◎' },
  { href: '/docs',     label: 'Docs',     icon: '◻' },
  { href: '/office',   label: 'Office',   icon: '◫' },
  { href: '/servers',  label: 'Servers',  icon: '⬡' },
  { href: '/prs',      label: 'PRs',      icon: '◆' },
]

function useHeartbeat() {
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [status, setStatus] = useState<'ok' | 'stale' | 'offline'>('offline')

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/agents')
      const json = await res.json()
      const agents = json.data ?? json
      if (agents.length === 0) return
      const latest = agents.reduce((a: any, b: any) =>
        new Date(a.last_seen) > new Date(b.last_seen) ? a : b
      )
      setLastSeen(latest.last_seen)
      const diff = (Date.now() - new Date(latest.last_seen).getTime()) / 1000
      setStatus(diff < 300 ? 'ok' : diff < 900 ? 'stale' : 'offline')
    } catch {
      setStatus('offline')
    }
  }, [])

  useEffect(() => { check(); const t = setInterval(check, 30000); return () => clearInterval(t) }, [check])
  useSSE((r) => { if (r === 'agents') check() })

  return { lastSeen, status }
}

const HEARTBEAT_COLORS = { ok: '#00ff9d', stale: '#ffaa00', offline: '#ff4466' }
const HEARTBEAT_LABELS = { ok: 'ALIVE', stale: 'STALE', offline: 'OFFLINE' }

function useReviewCount() {
  const [count, setCount] = useState(0)
  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/tasks')
      const json = await res.json()
      const tasks = json.data ?? json
      setCount(tasks.filter((t: any) => t.status === 'review').length)
    } catch {}
  }, [])
  useEffect(() => { check() }, [check])
  useSSE((r) => { if (r === 'tasks') check() })
  return count
}

export default function Sidebar() {
  const path = usePathname()
  const { lastSeen, status } = useHeartbeat()
  const reviewCount = useReviewCount()

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 flex flex-col border-r border-border bg-surface z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent text-lg">⬡</span>
          <span className="font-display text-sm font-700 text-text tracking-widest uppercase">Mission<br/>Control</span>
        </div>
        <div className="mt-2 text-[10px] text-text-dim font-mono">CLAWD · CLAWDBOT</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-widest uppercase transition-all duration-150
                ${active
                  ? 'bg-accent/10 text-accent border border-accent/20 glow'
                  : 'text-text-dim hover:text-text hover:bg-white/5 border border-transparent'
                }`}
            >
              <span className="text-sm w-4 text-center">{icon}</span>
              <span className="flex-1">{label}</span>
              {href === '/tasks' && reviewCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#cc44ff]/20 border border-[#cc44ff]/40 text-[#cc44ff] text-[9px] flex items-center justify-center">
                  {reviewCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Heartbeat */}
      <div className="px-5 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: HEARTBEAT_COLORS[status],
              boxShadow: status === 'ok' ? `0 0 6px ${HEARTBEAT_COLORS.ok}` : 'none',
            }}
          />
          <span className="text-[9px] uppercase tracking-widest" style={{ color: HEARTBEAT_COLORS[status] }}>
            {HEARTBEAT_LABELS[status]}
          </span>
        </div>
        {lastSeen && (
          <div className="text-[9px] text-text-dim mt-1 font-mono">
            {new Date(lastSeen).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border space-y-2">
        <Link
          href="/help"
          className={`flex items-center gap-2 text-[10px] tracking-widest uppercase transition-colors ${
            path.startsWith('/help') ? 'text-accent' : 'text-text-dim hover:text-text'
          }`}
        >
          <span className="text-sm w-4 text-center">?</span>
          Help
        </Link>
        <form action="/api/logout" method="POST">
          <button className="text-[10px] text-text-dim hover:text-danger tracking-widest uppercase transition-colors">
            ⏻ Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
