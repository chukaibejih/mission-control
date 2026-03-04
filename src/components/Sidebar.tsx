'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/tasks',    label: 'Tasks',    icon: '◈' },
  { href: '/projects', label: 'Projects', icon: '◇' },
  { href: '/calendar', label: 'Calendar', icon: '◷' },
  { href: '/agents',   label: 'Agents',   icon: '◉' },
  { href: '/memory',   label: 'Memory',   icon: '◎' },
  { href: '/docs',     label: 'Docs',     icon: '◻' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 flex flex-col border-r border-border bg-surface z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent text-lg">⬡</span>
          <span className="font-display text-sm font-700 text-text tracking-widest uppercase">Mission<br/>Control</span>
        </div>
        <div className="mt-2 text-[10px] text-text-dim font-mono">CLAWD · CLAWDBOT</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-widest uppercase transition-all duration-150
                ${active
                  ? 'bg-accent/10 text-accent border border-accent/20 glow'
                  : 'text-text-dim hover:text-text hover:bg-white/5 border border-transparent'
                }`}
            >
              <span className="text-sm w-4 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <form action="/api/logout" method="POST">
          <button className="text-[10px] text-text-dim hover:text-danger tracking-widest uppercase transition-colors">
            ⏻ Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
