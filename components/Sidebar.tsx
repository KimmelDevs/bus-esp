'use client'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    group: 'MAIN',
    links: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        href: '/transactions',
        label: 'Transactions',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'MANAGEMENT',
    links: [
      {
        href: '/topup',
        label: 'Top Up',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'SETTINGS',
    links: [
      {
        href: '/fare-settings',
        label: 'Fare Settings',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
          </svg>
        ),
      },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/'
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--white)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
      paddingTop: 8,
    }}>

      {NAV.map(({ group, links }) => (
        <div key={group} style={{ padding: '20px 14px 8px' }}>
          <div style={{
            fontSize: 9, fontFamily: 'var(--font-mono)',
            color: 'var(--muted-light)', letterSpacing: '0.18em',
            marginBottom: 8, paddingLeft: 10,
          }}>
            {group}
          </div>

          {links.map((link) => {
            const active = isActive(link.href)
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 9,
                  marginBottom: 3,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--royal)' : 'var(--text-mid)',
                  background: active ? 'var(--royal-subtle)' : 'transparent',
                  border: active ? '1px solid rgba(26,63,204,0.18)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--surface)'
                    e.currentTarget.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-mid)'
                  }
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 18,
                    background: 'var(--royal)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <span style={{ color: active ? 'var(--royal)' : 'var(--muted)', flexShrink: 0 }}>
                  {link.icon}
                </span>
                {link.label}
              </a>
            )
          })}
        </div>
      ))}

      {/* Bottom section */}
      <div style={{ marginTop: 'auto', padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          background: 'var(--royal-subtle)',
          borderRadius: 9,
          border: '1px solid rgba(26,63,204,0.18)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#d97706',
            boxShadow: '0 0 6px #d9770680',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--warning)', letterSpacing: '0.1em', fontWeight: 700 }}>
              TEST MODE
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>Sandbox environment</div>
          </div>
        </div>
      </div>
    </aside>
  )
}