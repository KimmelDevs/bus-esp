'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',             label: 'Dashboard',   icon: '📊' },
  { href: '/add-user',     label: 'Add User',     icon: '👤' },
  { href: '/topup',        label: 'Top Up',       icon: '💳' },
  { href: '/transactions', label: 'Transactions', icon: '🧾' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: '220px',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '24px 14px',
      position: 'fixed',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      zIndex: 100,
    }}>
      <div style={{ padding: '0 10px', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>System</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '2px' }}>🚌 BUSPAY</div>
      </div>

      {links.map(l => {
        const active = l.href === '/' ? path === '/' : path === l.href || path.startsWith(l.href + '/')
        return (
          <Link key={l.href} href={l.href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--accent)' : 'var(--muted)',
            background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
            border: active ? '1px solid rgba(0,229,255,0.18)' : '1px solid transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '16px' }}>{l.icon}</span>
            {l.label}
          </Link>
        )
      })}

      <div style={{ marginTop: 'auto', padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Mode</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)' }} />
          <span style={{ fontSize: '12px', color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>TEST MODE</span>
        </div>
      </div>
    </aside>
  )
}
