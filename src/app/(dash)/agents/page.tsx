'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Agent } from '@/lib/api'

const STATUS_OPTIONS: Agent['status'][] = ['active', 'idle', 'offline']
const STATUS_STYLES: Record<Agent['status'], { dot: string; bg: string; border: string; text: string }> = {
  active: { dot: 'bg-accent animate-pulse-slow', bg: 'rgba(0,255,157,0.15)', border: 'rgba(0,255,157,0.6)', text: '#00ff9d' },
  idle: { dot: 'bg-warn', bg: 'rgba(255,170,0,0.15)', border: 'rgba(255,170,0,0.6)', text: '#ffaa00' },
  offline: { dot: 'bg-danger', bg: 'rgba(255,68,102,0.15)', border: 'rgba(255,68,102,0.6)', text: '#ff4466' },
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    role: '',
    device: '',
    session_key: '',
    status: 'active' as Agent['status'],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState<string | null>(null)

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

  const openModal = () => {
    setForm({ name: '', role: '', device: 'CLAWDBOT', session_key: '', status: 'active' })
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSubmitting(false)
    setError('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/proxy/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save agent')
      await load()
      closeModal()
    } catch (err: any) {
      setError(err.message || 'Failed to save agent')
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: Agent['status']) {
    setStatusBusy(id)
    try {
      const res = await fetch('/api/proxy/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setStatusBusy(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Agents</h1>
          <p className="text-text-dim text-xs mt-1">
            {agents.filter(a => a.status === 'active').length} online · {agents.length} total
          </p>
        </div>
        <button
          onClick={openModal}
          className="text-xs uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent rounded px-4 py-2 hover:bg-accent/20 hover:border-accent/60 transition"
        >
          + Add Agent
        </button>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Scanning agents…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-surface border border-border rounded-lg p-6 hover:border-accent/30 transition-all glow-box scan-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${STATUS_STYLES[agent.status].dot}`} />
                  <span className="font-display text-lg font-700 text-text">{agent.name}</span>
                </div>
                <div className="px-2 py-1 border text-[10px] uppercase tracking-widest rounded" style={{ background: STATUS_STYLES[agent.status].bg, borderColor: STATUS_STYLES[agent.status].border, color: STATUS_STYLES[agent.status].text }}>
                  {agent.status}
                </div>
              </div>

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
                  <span className="text-text font-mono text-[10px] truncate max-w-48">{agent.session_key || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Last seen</span>
                  <span className="text-accent text-[10px]">{since(agent.last_seen)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-text-dim">
                <span>Status</span>
                <select
                  value={agent.status}
                  onChange={(e) => updateStatus(agent.id, e.target.value as Agent['status'])}
                  disabled={statusBusy === agent.id}
                  className="bg-bg border border-border rounded px-2 py-1 text-xs text-text"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 pt-3 border-t border-border font-mono text-[9px] text-text-dim">
                $ ping {agent.id} --status
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-700 text-text uppercase tracking-widest">New Agent</h2>
              <button onClick={closeModal} className="text-text-dim text-xs">ESC</button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Role</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  placeholder="Primary engineering agent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Device</label>
                  <input
                    type="text"
                    value={form.device}
                    onChange={(e) => setForm({ ...form, device: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Session Key</label>
                  <input
                    type="text"
                    value={form.session_key}
                    onChange={(e) => setForm({ ...form, session_key: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Agent['status'] })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-danger text-[10px]">{error}</p>}

              <div className="flex justify-end gap-3 text-xs uppercase tracking-widest">
                <button type="button" onClick={closeModal} className="text-text-dim">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="bg-accent/20 border border-accent/40 text-accent px-4 py-2 rounded hover:bg-accent/30 disabled:opacity-40"
                >
                  {submitting ? 'Saving…' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
