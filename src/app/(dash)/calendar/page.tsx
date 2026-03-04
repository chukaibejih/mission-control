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

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20]
const START_MINUTES = 8 * 60

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  'sch-heartbeat-workspace': { bg: 'rgba(68,153,255,0.12)', border: '#4499ff', text: '#1b78ff' },
  'sch-heartbeat-calendar': { bg: 'rgba(255,170,0,0.12)', border: '#ffaa00', text: '#c77a00' },
  'sch-heartbeat-logs': { bg: 'rgba(204,68,255,0.12)', border: '#cc44ff', text: '#8e1cb8' },
  'sch-heartbeat-maintenance': { bg: 'rgba(255,68,102,0.12)', border: '#ff4466', text: '#d0193b' },
}

function shouldRender(hour: number, schedule: Schedule) {
  const minutes = schedule.schedule.every_minutes || 0
  const offset = hour * 60 - START_MINUTES
  if (offset < 0) return false
  if (!minutes) return hour === 8
  if (minutes < 60) {
    // Show sub-hourly routines once per hour block
    return true
  }
  return offset % minutes === 0
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

      <section>
        <div className="text-[10px] uppercase tracking-widest text-text-dim mb-3">This Week</div>
        <div className="border border-border rounded overflow-hidden">
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-2 text-[9px] text-text-dim border-r border-border" />
            {DAYS.map(d => (
              <div key={d} className="p-2 text-center text-[10px] uppercase tracking-widest text-text-dim border-r border-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {HOURS.map(h => (
            <div key={h} className="grid grid-cols-8 border-b border-border last:border-b-0">
              <div className="p-1.5 text-[9px] text-text-dim border-r border-border text-right pr-2 leading-none pt-2">
                {h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}
              </div>
              {DAYS.map(d => (
                <div key={d} className="border-r border-border last:border-r-0 h-14 relative">
                  {schedules.map(s => {
                    if (!shouldRender(h, s)) return null
                    const colors = COLOR_MAP[s.id] || { bg: 'rgba(0,255,157,0.08)', border: 'rgba(0,255,157,0.5)', text: '#00ff9d' }
                    return (
                      <div
                        key={`${s.id}-${d}-${h}`}
                        className="absolute inset-1 rounded-sm border px-2 py-1 text-[9px] flex items-center transition-transform duration-200 hover:scale-[1.02]"
                        style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
                      >
                        <span className="font-600 truncate">{s.name}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
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
