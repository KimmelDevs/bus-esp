'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',    label: 'Dashboard',     icon: '📊' },
  { href: '/add-user',     label: 'Add User',       icon: '👤' },
  { href: '/topup',        label: 'Top Up',         icon: '💳' },
  { href: '/transactions', label: 'Transactions',   icon: '🧾' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '24px 16px',
      position: 'fixed',
      top: 0, left: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{ marginBottom: '32px', padding: '0 8px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px', marginBottom: '4px' }}>SYSTEM</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>🚌 BUSPAY</div>
      </div>

      {links.map(l => {
        const active = path === l.href
        return (
          <Link key={l.href} href={l.href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--accent)' : 'var(--muted)',
            background: active ? 'rgba(0,229,255,0.07)' : 'transparent',
            border: active ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
            transition: 'all 0.15s',
          }}>
            <span>{l.icon}</span>
            {l.label}
          </Link>
        )
      })}

      <div style={{ marginTop: 'auto', padding: '0 8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          TEST MODE
        </div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', display: 'inline-block', marginRight: '6px', marginTop: '6px' }} />
        <span style={{ fontSize: '11px', color: 'var(--warning)' }}>PayMongo Sandbox</span>
      </div>
    </aside>
  )
}
