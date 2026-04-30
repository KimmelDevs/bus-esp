import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: '220px',
        flex: 1,
        padding: '32px',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - 220px)',
        background: 'var(--bg)',
      }}>
        {children}
      </main>
    </div>
  )
}
