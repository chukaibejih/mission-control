'use client'
import { useEffect, useState, useCallback } from 'react'
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

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Calendar</h1>
        <p className="text-text-dim text-xs mt-1">{schedules.length} scheduled routines</p>
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
    </div>
  )
}
