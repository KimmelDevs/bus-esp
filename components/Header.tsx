'use client'
import { useEffect, useState } from 'react'

interface HeaderProps {
  userEmail: string
  onLogout: () => void
}

export default function Header({ userEmail, onLogout }: HeaderProps) {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--white)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0,
      zIndex: 200,
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, var(--royal) 0%, var(--royal-light) 100%)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(26,63,204,0.30)',
        }}>
          🚌
        </div>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: 'var(--royal)',
            letterSpacing: '0.04em',
            lineHeight: 1.15,
          }}>
            BUSPAY
          </div>
          <div style={{
            fontSize: 9, color: 'var(--muted)',
            letterSpacing: '0.14em', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}>
            RFID Payment System
          </div>
        </div>
      </div>

      {/* Center — live status badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--royal-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 99,
        padding: '5px 14px',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#059669',
          boxShadow: '0 0 6px #05966980',
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          color: 'var(--text-mid)', letterSpacing: '0.1em',
        }}>
          SYSTEM ONLINE
        </span>
      </div>

      {/* Right — clock + user + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {time && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: 'var(--royal)', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}>
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
              {time.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
            </div>
          </div>
        )}

        <div style={{
          height: 28, width: 1,
          background: 'var(--border)',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--royal-subtle), var(--surface2))',
            border: '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
          }}>
            👤
          </div>
          <div style={{ maxWidth: 140, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail || 'Admin'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>ADMINISTRATOR</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 11, fontWeight: 600,
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--danger)'
            e.currentTarget.style.color = 'var(--danger)'
            e.currentTarget.style.background = 'var(--danger-bg)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          LOGOUT
        </button>
      </div>
    </header>
  )
}
