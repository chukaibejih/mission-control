'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Agent } from '@/lib/api'

function StatusDot({ status }: { status: Agent['status'] }) {
  const colors = { active: 'bg-accent', idle: 'bg-warn', offline: 'bg-danger' }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status === 'active' ? 'animate-pulse-slow' : ''}`} />
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/agents')
      const json = await res.json()
      setAgents(json.data ?? json)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t) }, [])
  useSSE((r) => { if (r === 'agents') load() })

  function since(ts: string) {
    const diff = Math.floor((now - new Date(ts).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    return `${Math.floor(diff/3600)}h ago`
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Agents</h1>
        <p className="text-text-dim text-xs mt-1">
          {agents.filter(a => a.status === 'active').length} online · {agents.length} total
        </p>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Scanning agents…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-surface border border-border rounded-lg p-6 hover:border-accent/30 transition-all glow-box scan-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusDot status={agent.status} />
                  <span className="font-display text-lg font-700 text-text">{agent.name}</span>
                </div>
                <span className={`tag status-${agent.status}`} style={{
                  background: agent.status === 'active' ? '#00ff9d22' : agent.status === 'idle' ? '#ffaa0022' : '#ff446622',
                  color: agent.status === 'active' ? '#00ff9d' : agent.status === 'idle' ? '#ffaa00' : '#ff4466',
                }}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-dim">Role</span>
                  <span className="text-text text-right max-w-48">{agent.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Device</span>
                  <span className="text-text font-mono">{agent.device}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Session</span>
                  <span className="text-text font-mono text-[10px]">{agent.session_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Last seen</span>
                  <span className="text-accent text-[10px]">{since(agent.last_seen)}</span>
                </div>
              </div>

              {/* Terminal-style footer */}
              <div className="mt-4 pt-3 border-t border-border font-mono text-[9px] text-text-dim">
                $ ping {agent.id} --status
              </div>
            </div>
          ))}

          {/* Add agent placeholder */}
          <div className="border border-dashed border-border rounded-lg p-6 flex items-center justify-center text-text-dim hover:border-accent/30 hover:text-accent/50 transition-all cursor-pointer">
            <span className="text-xs tracking-widest uppercase">+ Add Agent</span>
          </div>
        </div>
      )}
    </div>
  )
}
