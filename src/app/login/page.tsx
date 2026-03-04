'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/tasks')
    } else {
      setError('Access denied.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,157,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,157,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-80 scan-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl text-accent mb-3" style={{ textShadow: '0 0 30px rgba(0,255,157,0.5)' }}>⬡</div>
          <h1 className="font-display text-xl font-800 text-text tracking-widest uppercase">Mission Control</h1>
          <p className="text-[10px] text-text-dim mt-1 tracking-widest uppercase">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-dim mb-2">
              Access Code
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password…"
              className="w-full bg-surface border border-border rounded px-4 py-3 text-sm text-text font-mono placeholder-text-dim focus:outline-none focus:border-accent/60 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-danger text-[10px] font-mono">&gt; {error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-accent/10 border border-accent/30 text-accent rounded py-3 text-xs uppercase tracking-widest font-700 hover:bg-accent/20 hover:border-accent/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating…' : 'Authenticate →'}
          </button>
        </form>

        <p className="text-center text-[9px] text-text-dim mt-6 tracking-widest">
          CLAWD · CLAWDBOT · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
