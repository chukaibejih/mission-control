import Sidebar from '@/components/Sidebar'

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-52 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
