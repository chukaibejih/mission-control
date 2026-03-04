'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Doc } from '@/lib/api'

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<Doc | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/docs')
      const json = await res.json()
      const data: Doc[] = json.data ?? json
      setDocs(data)
      if (data.length > 0) setSelected(data[0])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = docs.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase()) ||
    d.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in h-full">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-800 text-text tracking-tight cursor">Docs</h1>
        <p className="text-text-dim text-xs mt-1">Workspace documents, READMEs, and knowledge base</p>
      </header>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Doc list */}
        <div className="w-52 shrink-0 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search docs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:border-accent/50 font-mono"
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="text-xs text-text-dim animate-pulse-slow px-2">Loading…</div>
            ) : filtered.map(d => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`w-full text-left px-3 py-2 rounded transition-colors
                  ${selected?.id === d.id
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-dim hover:text-text hover:bg-surface border border-transparent'
                  }`}
              >
                <div className="text-[10px] font-mono">{d.label}</div>
                <div className="text-[9px] text-text-dim/60 truncate">{d.path}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Doc viewer */}
        <div className="flex-1 bg-surface border border-border rounded overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-accent">{selected.label}</span>
                <span className="text-[9px] text-text-dim">{selected.path}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-xs text-text-dim font-mono leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-dim text-xs">
              Select a document
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
