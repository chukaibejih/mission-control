'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useSSE } from '@/hooks/useSSE'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServerService {
  name: string
  status: 'up' | 'down' | 'unknown'
}

interface Server {
  id: string
  name: string
  host: string
  port: number
  user: string
  healthCheckUrl: string
  services: ServerService[]
  description: string
  status: 'online' | 'offline' | 'checking' | 'pending'
  lastChecked: string | null
  lastEvent: string | null
  gitBranch: string | null
  gitBehind: number | null
  diskUsagePct: number | null
  memUsed: string | null
  memTotal: string | null
  logs: string | null
  addedAt: string
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  online:   { color: '#00ff9d', label: 'ONLINE' },
  offline:  { color: '#ff4466', label: 'OFFLINE' },
  checking: { color: '#ffaa00', label: 'CHECKING' },
  pending:  { color: '#6b6b85', label: 'PENDING' },
}

const SERVICE_COLOR: Record<string, string> = {
  up: '#00ff9d',
  down: '#ff4466',
  unknown: '#6b6b85',
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function diskColor(pct: number): string {
  if (pct > 85) return '#ff4466'
  if (pct > 60) return '#ffaa00'
  return '#00ff9d'
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showLogs, setShowLogs] = useState<Server | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '', host: '', port: '22', user: '', privateKey: '',
    healthCheckUrl: '', services: '', description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/servers')
      const json = await res.json()
      setServers(json.data ?? json)
    } catch {
      setServers([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => { if (r === 'servers') load() })

  const closeModal = () => { setShowModal(false); setSubmitting(false); setError('') }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.host.trim() || !form.user.trim() || !form.privateKey.trim()) {
      setError('Name, host, user, and private key are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/proxy/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          host: form.host.trim(),
          port: parseInt(form.port) || 22,
          user: form.user.trim(),
          privateKey: form.privateKey.trim(),
          healthCheckUrl: form.healthCheckUrl.trim(),
          services: form.services.split(',').map(s => s.trim()).filter(Boolean),
          description: form.description.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to add server')
      await load()
      closeModal()
      setForm({ name: '', host: '', port: '22', user: '', privateKey: '', healthCheckUrl: '', services: '', description: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to add server')
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await fetch(`/api/proxy/servers/${id}`, { method: 'DELETE' })
      setServers(s => s.filter(x => x.id !== id))
    } catch {}
    setConfirmRemove(null)
  }

  async function handleHealthCheck(id: string) {
    setCheckingId(id)
    setServers(s => s.map(x => x.id === id ? { ...x, status: 'checking' as const } : x))
    try {
      await fetch(`/api/proxy/servers/${id}/check`, { method: 'POST' })
      await load()
    } catch {
      setServers(s => s.map(x => x.id === id ? { ...x, status: 'offline' as const } : x))
    }
    setCheckingId(null)
  }

  const onlineCount = servers.filter(s => s.status === 'online').length

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Servers</h1>
          <p className="text-text-dim text-xs mt-1">
            {loading ? 'Loading...' : `${onlineCount} online · ${servers.length} total`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent rounded px-4 py-2 hover:bg-accent/20 hover:border-accent/60 transition"
        >
          + Add Server
        </button>
      </header>

      {loading ? (
        <div className="text-accent text-xs animate-pulse-slow">Scanning servers...</div>
      ) : servers.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <div className="text-2xl text-text-dim/20 mb-4">&#x2B21;</div>
          <div className="text-text-dim text-xs mb-2">No servers configured</div>
          <p className="text-[10px] text-text-dim/60 mb-6">Add a server and Clawd will begin monitoring it automatically</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[10px] uppercase tracking-widest border border-border text-text-dim rounded px-4 py-2 hover:text-text hover:border-accent/30 transition"
          >
            + Add Your First Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {servers.map(server => {
            const s = STATUS_STYLE[server.status] || STATUS_STYLE.pending
            return (
              <div key={server.id} className="bg-surface border border-border rounded-lg p-5 hover:border-accent/30 transition-all glow-box scan-in space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: s.color,
                        boxShadow: server.status === 'online' ? `0 0 8px ${s.color}` : 'none',
                      }}
                    />
                    <span className="font-display text-sm font-700 text-text">{server.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border"
                    style={{ color: s.color, borderColor: s.color + '44', background: s.color + '11' }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Host + last checked */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-dim font-mono">{server.user}@{server.host}:{server.port}</span>
                  <span className="text-text-dim/60 font-mono">checked {timeAgo(server.lastChecked)}</span>
                </div>

                {/* Services */}
                {server.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {server.services.map(svc => (
                      <span
                        key={svc.name}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border"
                        style={{
                          color: SERVICE_COLOR[svc.status],
                          borderColor: SERVICE_COLOR[svc.status] + '33',
                          background: SERVICE_COLOR[svc.status] + '11',
                        }}
                      >
                        {svc.name} {svc.status === 'up' ? '\u2713' : svc.status === 'down' ? '\u2717' : '?'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  {server.gitBranch && (
                    <div>
                      <div className="text-text-dim/50 uppercase tracking-widest mb-1">Git</div>
                      <div className="text-text-dim font-mono">
                        {server.gitBranch}
                        {server.gitBehind != null && server.gitBehind > 0 && (
                          <span className="text-warn ml-1.5">&darr;{server.gitBehind}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {server.memUsed && (
                    <div>
                      <div className="text-text-dim/50 uppercase tracking-widest mb-1">Memory</div>
                      <div className="text-text-dim font-mono">{server.memUsed} / {server.memTotal}</div>
                    </div>
                  )}
                  {server.diskUsagePct != null && (
                    <div className="col-span-2">
                      <div className="text-text-dim/50 uppercase tracking-widest mb-1.5">Disk</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-bg rounded-full overflow-hidden border border-border/50">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${server.diskUsagePct}%`,
                              background: diskColor(server.diskUsagePct),
                            }}
                          />
                        </div>
                        <span className="font-mono" style={{ color: diskColor(server.diskUsagePct) }}>
                          {server.diskUsagePct}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last event */}
                {server.lastEvent && (
                  <div className="text-[10px] text-text-dim/60 font-mono border-t border-border pt-3">
                    <span className="text-text-dim/30">&rsaquo;</span> {server.lastEvent}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleHealthCheck(server.id)}
                    disabled={checkingId === server.id}
                    className="flex-1 text-[10px] uppercase tracking-widest border border-border text-text-dim rounded py-2 hover:border-accent/40 hover:text-accent disabled:opacity-40 transition font-mono"
                  >
                    {checkingId === server.id ? 'Checking...' : '\u27F3 Health Check'}
                  </button>
                  <button
                    onClick={() => server.logs && setShowLogs(server)}
                    disabled={!server.logs}
                    className="flex-1 text-[10px] uppercase tracking-widest border border-border text-text-dim rounded py-2 hover:border-accent/40 hover:text-accent disabled:opacity-30 transition font-mono"
                  >
                    &#x2261; View Logs
                  </button>
                  {confirmRemove === server.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRemove(server.id)}
                        className="text-[9px] uppercase tracking-widest bg-danger/10 border border-danger/40 text-danger rounded px-2 py-2 font-mono"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="text-[9px] uppercase tracking-widest border border-border text-text-dim rounded px-2 py-2 font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(server.id)}
                      className="text-[10px] border border-border text-text-dim/40 rounded px-3 py-2 hover:border-danger/40 hover:text-danger transition font-mono"
                    >
                      &#x2715;
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Server Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface border border-border rounded-lg w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-700 text-text uppercase tracking-widest">Add Server</h2>
                <p className="text-[10px] text-text-dim mt-1">Clawd will write SSH key and begin monitoring automatically</p>
              </div>
              <button onClick={closeModal} className="text-text-dim text-xs">ESC</button>
            </div>
            <form className="space-y-4" onSubmit={handleAdd}>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Display Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  placeholder="e.g. Liberty Platform"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Hostname / IP *</label>
                  <input
                    type="text"
                    value={form.host}
                    onChange={e => setForm({ ...form, host: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                    placeholder="e.g. 167.99.xxx.xxx"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Port</label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={e => setForm({ ...form, port: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">SSH User *</label>
                <input
                  type="text"
                  value={form.user}
                  onChange={e => setForm({ ...form, user: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  placeholder="e.g. ubuntu, root, clawd"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">
                  SSH Private Key * <span className="text-text-dim/40 normal-case">stored securely at ~/.ssh/mc_&lt;id&gt;</span>
                </label>
                <textarea
                  value={form.privateKey}
                  onChange={e => setForm({ ...form, privateKey: e.target.value })}
                  rows={4}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent/60 resize-y"
                  placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">
                  Health Check URL <span className="text-text-dim/40 normal-case">optional</span>
                </label>
                <input
                  type="text"
                  value={form.healthCheckUrl}
                  onChange={e => setForm({ ...form, healthCheckUrl: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  placeholder="e.g. http://localhost:8000/health"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">
                  Services to Watch <span className="text-text-dim/40 normal-case">comma separated, optional</span>
                </label>
                <input
                  type="text"
                  value={form.services}
                  onChange={e => setForm({ ...form, services: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  placeholder="e.g. nginx, gunicorn, postgres"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60 resize-y"
                  placeholder="What runs on this server?"
                />
              </div>

              {error && <p className="text-danger text-[10px]">{error}</p>}

              <div className="flex justify-end gap-3 text-xs uppercase tracking-widest">
                <button type="button" onClick={closeModal} className="text-text-dim">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim() || !form.host.trim() || !form.user.trim() || !form.privateKey.trim()}
                  className="bg-accent/20 border border-accent/40 text-accent px-4 py-2 rounded hover:bg-accent/30 disabled:opacity-40"
                >
                  {submitting ? 'Adding...' : '+ Add Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Drawer ── */}
      {showLogs?.logs && (
        <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowLogs(null)}>
          <div
            className="w-full max-h-[60vh] bg-surface border-t border-accent/20 rounded-t-xl p-6 overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-accent font-mono">
                Logs — {showLogs.name}
              </span>
              <button onClick={() => setShowLogs(null)} className="text-text-dim text-xs hover:text-text">
                &#x2715;
              </button>
            </div>
            <pre className="font-mono text-xs text-text-dim leading-relaxed whitespace-pre-wrap break-words">
              {showLogs.logs}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
