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

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

      {/* Always-running routines */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow inline-block" />
          Always Running
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <span className="text-xs text-text-dim animate-pulse-slow">Loading…</span>
          ) : schedules.map(s => (
            <div
              key={s.id}
              className="border border-accent/20 bg-accent/5 rounded px-3 py-2 text-xs space-y-0.5 hover:border-accent/50 transition-colors"
            >
              <div className="text-accent font-700">{s.name}</div>
              <div className="text-text-dim text-[10px]">{intervalLabel(s.schedule)}</div>
              <div className="text-text-dim text-[10px]">{s.owner}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Week grid */}
      <section>
        <div className="text-[10px] uppercase tracking-widest text-text-dim mb-3">This Week</div>
        <div className="border border-border rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-2 text-[9px] text-text-dim border-r border-border" />
            {DAYS.map(d => (
              <div key={d} className="p-2 text-center text-[10px] uppercase tracking-widest text-text-dim border-r border-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {/* Time slots — show 8am-9pm */}
          {[8,9,10,11,12,13,14,15,16,17,18,19,20].map(h => (
            <div key={h} className="grid grid-cols-8 border-b border-border last:border-b-0 group">
              <div className="p-1.5 text-[9px] text-text-dim border-r border-border text-right pr-2 leading-none pt-2">
                {h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}
              </div>
              {DAYS.map(d => (
                <div key={d} className="border-r border-border last:border-r-0 h-8 relative">
                  {/* Place routine blocks based on interval */}
                  {schedules.map(s => {
                    const interval = s.schedule.every_minutes || 0
                    // Show a block if the hour matches an interval hit
                    const show = interval > 0 && (h * 60) % interval === 0
                    if (!show) return null
                    return (
                      <div
                        key={s.id}
                        title={s.name}
                        className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-sm bg-accent/10 border border-accent/20 text-[8px] text-accent px-1 truncate flex items-center"
                      >
                        {s.name}
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
