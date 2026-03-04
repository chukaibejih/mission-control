'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Agent } from '@/lib/api'

const DESK_POSITIONS = [
  { x: 15, y: 25 },
  { x: 55, y: 25 },
  { x: 15, y: 60 },
  { x: 55, y: 60 },
  { x: 35, y: 42 },
  { x: 75, y: 42 },
]

const STATUS_COLORS: Record<string, string> = {
  active: '#00ff9d',
  idle: '#ffaa00',
  offline: '#ff4466',
}

function AgentSprite({ agent, x, y, now }: { agent: Agent; x: number; y: number; now: number }) {
  const color = STATUS_COLORS[agent.status] || '#6b6b85'
  const isActive = agent.status === 'active'
  const diff = (now - new Date(agent.last_seen).getTime()) / 1000

  // Simple animation: active agents have a bobbing effect
  const bob = isActive ? Math.sin(now / 500 + x) * 2 : 0

  return (
    <g transform={`translate(${x}, ${y + bob})`}>
      {/* Desk */}
      <rect x={-12} y={8} width={24} height={3} rx={1} fill="#1e1e2e" stroke="#2a2a3e" strokeWidth={0.5} />
      <rect x={-10} y={4} width={20} height={5} rx={1} fill="#111118" stroke="#2a2a3e" strokeWidth={0.5} />
      {/* Monitor glow for active */}
      {isActive && <rect x={-8} y={4.5} width={16} height={3.5} rx={0.5} fill={color} opacity={0.15} />}
      {/* Monitor screen */}
      <rect x={-8} y={4.5} width={16} height={3.5} rx={0.5} fill="none" stroke={isActive ? color : '#2a2a3e'} strokeWidth={0.3} />

      {/* Agent body */}
      <rect x={-4} y={-2} width={8} height={6} rx={1} fill={color + '33'} stroke={color} strokeWidth={0.5} />
      {/* Head */}
      <circle cx={0} cy={-5} r={3} fill={color + '33'} stroke={color} strokeWidth={0.5} />
      {/* Eyes */}
      {agent.status !== 'offline' && (
        <>
          <circle cx={-1} cy={-5.5} r={0.5} fill={color} />
          <circle cx={1} cy={-5.5} r={0.5} fill={color} />
        </>
      )}

      {/* Status indicator */}
      <circle cx={4} cy={-7} r={1.5} fill={color} opacity={isActive ? 1 : 0.5}>
        {isActive && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
      </circle>

      {/* Name label */}
      <text x={0} y={16} textAnchor="middle" fill={color} fontSize={2.5} fontFamily="monospace">
        {agent.name}
      </text>
      {/* Last seen */}
      <text x={0} y={19} textAnchor="middle" fill="#6b6b85" fontSize={1.8} fontFamily="monospace">
        {diff < 60 ? `${Math.floor(diff)}s` : diff < 3600 ? `${Math.floor(diff/60)}m` : `${Math.floor(diff/3600)}h`}
      </text>
    </g>
  )
}

export default function OfficePage() {
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
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useSSE((r) => { if (r === 'agents') load() })

  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Office</h1>
        <p className="text-text-dim text-xs mt-1">
          {activeCount} agent{activeCount !== 1 ? 's' : ''} working · {agents.length} total
        </p>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Scanning office...</div>
      ) : (
        <div className="bg-surface border border-border rounded-lg glow-box overflow-hidden">
          <svg viewBox="0 0 100 80" className="w-full max-w-4xl mx-auto" style={{ imageRendering: 'auto' }}>
            {/* Floor grid */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e1e2e" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="80" fill="#0a0a0f" />
            <rect width="100" height="80" fill="url(#grid)" />

            {/* Room label */}
            <text x="50" y="6" textAnchor="middle" fill="#1e1e2e" fontSize="3" fontFamily="monospace" fontWeight="bold">
              MISSION CONTROL HQ
            </text>

            {/* Walls */}
            <rect x="2" y="2" width="96" height="76" fill="none" stroke="#1e1e2e" strokeWidth="0.5" rx="1" />

            {/* Server rack in corner */}
            <rect x="85" y="5" width={8} height={12} rx={1} fill="#111118" stroke="#1e1e2e" strokeWidth={0.3} />
            <rect x={86} y={6} width={6} height={1} rx={0.2} fill="#4499ff" opacity={0.3} />
            <rect x={86} y={8} width={6} height={1} rx={0.2} fill="#00ff9d" opacity={0.3} />
            <rect x={86} y={10} width={6} height={1} rx={0.2} fill="#ffaa00" opacity={0.3} />
            {activeCount > 0 && (
              <circle cx={94} cy={6} r={0.8} fill="#00ff9d">
                <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={89} y={19} textAnchor="middle" fill="#1e1e2e" fontSize={1.8} fontFamily="monospace">SERVERS</text>

            {/* Agents at desks */}
            {agents.map((agent, i) => {
              const pos = DESK_POSITIONS[i % DESK_POSITIONS.length]
              return <AgentSprite key={agent.id} agent={agent} x={pos.x} y={pos.y} now={now} />
            })}

            {/* Empty desks for remaining positions */}
            {agents.length < DESK_POSITIONS.length && DESK_POSITIONS.slice(agents.length).map((pos, i) => (
              <g key={`empty-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <rect x={-12} y={8} width={24} height={3} rx={1} fill="#111118" stroke="#1e1e2e" strokeWidth={0.3} />
                <rect x={-10} y={4} width={20} height={5} rx={1} fill="#0d0d14" stroke="#1e1e2e" strokeWidth={0.3} />
                <text x={0} y={16} textAnchor="middle" fill="#1e1e2e" fontSize={2} fontFamily="monospace">vacant</text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 py-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[9px] text-text-dim uppercase tracking-widest">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warn" />
              <span className="text-[9px] text-text-dim uppercase tracking-widest">Idle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-[9px] text-text-dim uppercase tracking-widest">Offline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
