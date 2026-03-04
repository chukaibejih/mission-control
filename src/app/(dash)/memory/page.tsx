'use client'
import { useEffect, useState, useCallback } from 'react'
import type { MemoryFile } from '@/lib/api'

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [selected, setSelected] = useState<MemoryFile | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/memory')
      const json = await res.json()
      const data: MemoryFile[] = json.data ?? json
      setFiles(data)
      if (data.length > 0) setSelected(data[0])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = files.filter(f =>
    f.name.includes(search) || f.content.toLowerCase().includes(search.toLowerCase())
  )

  const highlighted = selected
    ? search
      ? selected.content.replace(
          new RegExp(`(${search})`, 'gi'),
          '<mark style="background:#00ff9d33;color:#00ff9d">$1</mark>'
        )
      : selected.content
    : ''

  return (
    <div className="animate-fade-in h-full">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Memory</h1>
        <p className="text-text-dim text-xs mt-1">Agent memory — daily logs & long-term context</p>
      </header>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* File list */}
        <div className="w-52 shrink-0 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:border-accent/50 font-mono"
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="text-xs text-text-dim animate-pulse-slow px-2">Loading…</div>
            ) : filtered.map(f => (
              <button
                key={f.path}
                onClick={() => setSelected(f)}
                className={`w-full text-left px-3 py-2 rounded text-[10px] font-mono transition-colors
                  ${selected?.path === f.path
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-dim hover:text-text hover:bg-surface border border-transparent'
                  }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content viewer */}
        <div className="flex-1 bg-surface border border-border rounded overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-accent">{selected.name}</span>
                <span className="text-[9px] text-text-dim">memory/{selected.path}</span>
              </div>
              <div
                className="flex-1 overflow-y-auto p-4 text-xs text-text-dim font-mono leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-dim text-xs">
              Select a memory file
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
