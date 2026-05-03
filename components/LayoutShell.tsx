'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'
import { MqttProvider } from '@/lib/MqttContext'

const PUBLIC_PATHS = ['/login', '/signup', '/topup/success', '/topup/failed']
const RESIDENT_PATHS = ['/resident']
// Routes that only admins are allowed to visit
const ADMIN_ONLY_PATHS = ['/dashboard', '/add-user', '/fare-settings', '/transactions', '/topup']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [role, setRole] = useState<string | null>(null)

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isResident = RESIDENT_PATHS.some(p => pathname.startsWith(p))
  const isAdminOnly = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))

  useEffect(() => {
    ;(async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (session) {
        const userRole = session.user.user_metadata?.role ?? 'resident'
        setAuthed(true)
        setUserEmail(session.user.email ?? '')
        setRole(userRole)
        // Residents must not access admin-only routes
        if (userRole !== 'admin' && isAdminOnly) {
          router.replace('/resident')
        }
      } else {
        setAuthed(false)
        setRole(null)
        if (!isPublic) router.replace('/login')
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          const userRole = session.user.user_metadata?.role ?? 'resident'
          setAuthed(true)
          setUserEmail(session.user.email ?? '')
          setRole(userRole)
          if (userRole !== 'admin' && isAdminOnly) {
            router.replace('/resident')
          }
        } else {
          setAuthed(false)
          setRole(null)
          if (!isPublic) router.replace('/login')
        }
      })
    })()
  }, [])

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // Public routes — render without shell
  if (isPublic) return <>{children}</>

  // Still checking auth
  if (authed === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--off-white)',
        fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)',
        letterSpacing: '0.08em',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--royal)',
            margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
          }} />
          LOADING...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!authed) return null

  // Block render while a resident is being redirected away from an admin route
  if (role !== null && role !== 'admin' && isAdminOnly) return null

  // Resident routes — MqttProvider for scanner, but no admin sidebar/header
  if (isResident) return (
    <MqttProvider>
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--font-body)' }}>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </main>
      </div>
    </MqttProvider>
  )

  return (
    <MqttProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header userEmail={userEmail} onLogout={handleLogout} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 36px',
            background: 'var(--off-white)',
          }}>
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MqttProvider>
  )
}