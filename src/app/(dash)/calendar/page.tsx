'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useSSE } from '@/hooks/useSSE'
import type { Schedule } from '@/lib/api'

function intervalLabel(s: Schedule['schedule']) {
  if (s.kind === 'interval' && s.every_minutes) {
    if (s.every_minutes < 60) return `Every ${s.every_minutes}m`
    return `Every ${s.every_minutes / 60}h`
  }
  if (s.kind === 'cron' && s.cron) return s.cron
  return s.kind
}

function runsPerDay(s: Schedule['schedule']): number {
  if (s.kind === 'interval' && s.every_minutes) return Math.floor(1440 / s.every_minutes)
  if (s.kind === 'cron') return 1
  return 0
}

function nextRunLabel(s: Schedule): string {
  if (s.schedule.kind === 'interval' && s.schedule.every_minutes) {
    const mins = s.schedule.every_minutes
    const now = new Date()
    const elapsed = now.getHours() * 60 + now.getMinutes()
    const remaining = mins - (elapsed % mins)
    if (remaining < 60) return `~${remaining}m`
    return `~${Math.floor(remaining / 60)}h ${remaining % 60}m`
  }
  if (s.schedule.kind === 'cron' && s.schedule.cron) {
    const parts = s.schedule.cron.split(' ')
    if (parts.length >= 2) {
      const hour = parseInt(parts[1])
      const min = parseInt(parts[0])
      if (!isNaN(hour) && !isNaN(min)) {
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} UTC`
      }
    }
  }
  return '—'
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)

const COLOR_PALETTE = [
  { bg: 'rgba(68,153,255,0.12)', border: '#4499ff', text: '#4499ff', dot: '#4499ff' },
  { bg: 'rgba(255,170,0,0.12)', border: '#ffaa00', text: '#ffaa00', dot: '#ffaa00' },
  { bg: 'rgba(204,68,255,0.12)', border: '#cc44ff', text: '#cc44ff', dot: '#cc44ff' },
  { bg: 'rgba(255,68,102,0.12)', border: '#ff4466', text: '#ff4466', dot: '#ff4466' },
  { bg: 'rgba(0,255,157,0.12)', border: '#00ff9d', text: '#00ff9d', dot: '#00ff9d' },
]

const COLOR_MAP: Record<string, typeof COLOR_PALETTE[0]> = {
  'sch-heartbeat-workspace': COLOR_PALETTE[0],
  'sch-heartbeat-calendar': COLOR_PALETTE[1],
  'sch-heartbeat-logs': COLOR_PALETTE[2],
  'sch-heartbeat-maintenance': COLOR_PALETTE[3],
}

function getColor(s: Schedule, i: number) {
  return COLOR_MAP[s.id] || COLOR_PALETTE[i % COLOR_PALETTE.length]
}

function getFireHours(s: Schedule): number[] {
  if (s.schedule.kind === 'interval' && s.schedule.every_minutes) {
    const mins = s.schedule.every_minutes
    const hours: number[] = []
    for (let m = 0; m < 1440; m += mins) {
      const h = Math.floor(m / 60)
      if (!hours.includes(h)) hours.push(h)
    }
    return hours
  }
  if (s.schedule.kind === 'cron' && s.schedule.cron) {
    const parts = s.schedule.cron.split(' ')
    const hour = parseInt(parts[1])
    if (!isNaN(hour)) return [hour]
  }
  return []
}

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [schedForm, setSchedForm] = useState({
    name: '',
    description: '',
    owner: '',
    kind: 'interval' as 'interval' | 'cron',
    every_minutes: '30',
    cron: '',
  })

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/schedules')
      const json = await res.json()
      setSchedules(json.data ?? json)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useSSE((r) => { if (r === 'schedules') load() })

  const closeModal = () => { setShowModal(false); setSubmitting(false); setError('') }

  async function handleCreateSchedule(e: FormEvent) {
    e.preventDefault()
    if (!schedForm.name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const body: any = {
        name: schedForm.name,
        description: schedForm.description,
        owner: schedForm.owner,
        source: 'mission-control',
        schedule: schedForm.kind === 'interval'
          ? { kind: 'interval', every_minutes: parseInt(schedForm.every_minutes) || 30 }
          : { kind: 'cron', cron: schedForm.cron },
      }
      const res = await fetch('/api/proxy/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create schedule')
      await load()
      closeModal()
      setSchedForm({ name: '', description: '', owner: '', kind: 'interval', every_minutes: '30', cron: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule')
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Calendar</h1>
          <p className="text-text-dim text-xs mt-1">{schedules.length} scheduled routines</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent rounded px-4 py-2 hover:bg-accent/20 hover:border-accent/60 transition"
        >
          + New Schedule
        </button>
      </header>

      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow inline-block" />
          Always Running
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <span className="text-xs text-text-dim animate-pulse-slow">Loading…</span>
          ) : schedules.map(s => {
            const colors = COLOR_MAP[s.id] || { bg: 'rgba(0,255,157,0.1)', border: 'rgba(0,255,157,0.4)', text: '#00ff9d' }
            return (
              <div
                key={s.id}
                className="border rounded px-3 py-2 text-xs space-y-0.5 hover:-translate-y-0.5 transition-all"
                style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
              >
                <div className="font-700">{s.name}</div>
                <div className="text-text-dim text-[10px]">{intervalLabel(s.schedule)}</div>
                <div className="text-text-dim text-[10px]">{s.owner}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Schedule detail list */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-text-dim mb-3">Schedule Details</div>
        <div className="space-y-3">
          {!loading && schedules.map((s, i) => {
            const colors = getColor(s, i)
            const rpd = runsPerDay(s.schedule)
            return (
              <div key={s.id} className="bg-surface border border-border rounded-lg p-4 hover:border-accent/30 transition-all scan-in">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}44` }} />
                    <div className="min-w-0">
                      <div className="text-sm font-700 text-text truncate">{s.name}</div>
                      <div className="text-[10px] text-text-dim mt-0.5">{s.description || 'No description'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
                      {intervalLabel(s.schedule)}
                    </div>
                    <div className="text-[9px] text-text-dim">{rpd}x / day</div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-[10px] text-text-dim mb-3">
                  <span>Owner: <span className="text-text">{s.owner}</span></span>
                  {s.source && <span>Source: <span className="text-text font-mono">{s.source}</span></span>}
                  <span>Next: <span className="text-accent">{nextRunLabel(s)}</span></span>
                </div>

                {/* 24h timeline bar */}
                <div className="relative">
                  <div className="flex items-center gap-0">
                    {HOURS_24.map(h => {
                      const fires = getFireHours(s)
                      const active = fires.includes(h)
                      return (
                        <div key={h} className="flex-1 group relative">
                          <div
                            className="h-3 border-r border-border/30 transition-all"
                            style={{
                              background: active ? colors.bg : 'transparent',
                              borderBottom: active ? `2px solid ${colors.border}` : '2px solid transparent',
                            }}
                          />
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                            <div className="bg-bg border border-border rounded px-1.5 py-0.5 text-[8px] text-text-dim whitespace-nowrap">
                              {h.toString().padStart(2, '0')}:00{active ? ' — runs' : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Hour labels */}
                  <div className="flex items-center gap-0 mt-0.5">
                    {HOURS_24.map(h => (
                      <div key={h} className="flex-1 text-center text-[7px] text-text-dim/50">
                        {h % 6 === 0 ? `${h}` : ''}
                      </div>
                    ))}
                  </div>
                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 h-3 w-px bg-accent z-10"
                    style={{ left: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent -translate-x-[2.5px] -translate-y-[1px]" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-700 text-text uppercase tracking-widest">New Schedule</h2>
              <button onClick={closeModal} className="text-text-dim text-xs">ESC</button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateSchedule}>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Name</label>
                <input
                  type="text"
                  value={schedForm.name}
                  onChange={e => setSchedForm({ ...schedForm, name: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
                  placeholder="heartbeat-deploy"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Description</label>
                <input
                  type="text"
                  value={schedForm.description}
                  onChange={e => setSchedForm({ ...schedForm, description: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  placeholder="What this routine does"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Owner</label>
                <input
                  type="text"
                  value={schedForm.owner}
                  onChange={e => setSchedForm({ ...schedForm, owner: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                  placeholder="clawd"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSchedForm({ ...schedForm, kind: 'interval' })}
                    className={`px-3 py-1 rounded text-xs border transition ${schedForm.kind === 'interval' ? 'bg-accent/20 border-accent text-accent' : 'border-border text-text'}`}
                  >
                    Interval
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedForm({ ...schedForm, kind: 'cron' })}
                    className={`px-3 py-1 rounded text-xs border transition ${schedForm.kind === 'cron' ? 'bg-accent/20 border-accent text-accent' : 'border-border text-text'}`}
                  >
                    Cron
                  </button>
                </div>
              </div>
              {schedForm.kind === 'interval' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Every (minutes)</label>
                  <input
                    type="number"
                    value={schedForm.every_minutes}
                    onChange={e => setSchedForm({ ...schedForm, every_minutes: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text"
                    min="1"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">Cron Expression</label>
                  <input
                    type="text"
                    value={schedForm.cron}
                    onChange={e => setSchedForm({ ...schedForm, cron: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono"
                    placeholder="*/30 * * * *"
                  />
                </div>
              )}

              {error && <p className="text-danger text-[10px]">{error}</p>}

              <div className="flex justify-end gap-3 text-xs uppercase tracking-widest">
                <button type="button" onClick={closeModal} className="text-text-dim">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !schedForm.name.trim()}
                  className="bg-accent/20 border border-accent/40 text-accent px-4 py-2 rounded hover:bg-accent/30 disabled:opacity-40"
                >
                  {submitting ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
