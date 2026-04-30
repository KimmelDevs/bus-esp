'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AddUserPage() {
  const [form, setForm] = useState({ name: '', rfid_uid: '', balance: '', type: '' })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!form.name || !form.rfid_uid || !form.balance || !form.type) {
      setMsg({ text: 'All fields are required.', ok: false })
      return
    }
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.from('users').insert({
      name: form.name,
      rfid_uid: form.rfid_uid.replace(/:/g, '').toUpperCase(),
      balance: parseFloat(form.balance),
      type: form.type,
    })
    if (error) {
      setMsg({ text: error.message, ok: false })
    } else {
      setMsg({ text: 'User registered successfully!', ok: true })
      setForm({ name: '', rfid_uid: '', balance: '', type: '' })
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 9,
    background: 'var(--off-white)',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    transition: 'all 0.2s',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 700,
    color: 'var(--text-mid)',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 7,
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          Add RFID User
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Register a new card holder in the system
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '28px 28px 32px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--royal-subtle)', border: '1px solid rgba(26,63,204,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              👤
            </span>
            Card Holder Details
          </div>

          {msg && (
            <div style={{
              marginBottom: 20, padding: '12px 16px',
              borderRadius: 9,
              background: msg.ok ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: `1px solid ${msg.ok ? '#05966940' : '#dc262640'}`,
              color: msg.ok ? 'var(--success)' : 'var(--danger)',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {msg.ok ? '✓' : '⚠'} {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Juan Dela Cruz"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>RFID UID</label>
              <input
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                placeholder="e.g. A1B2C3D4"
                value={form.rfid_uid}
                onChange={e => setForm({ ...form, rfid_uid: e.target.value })}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                Colons will be stripped automatically. Case-insensitive.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Initial Balance (₱)</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.balance}
                onChange={e => setForm({ ...form, balance: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Passenger Type</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="Passenger">Passenger</option>
                <option value="Student">Student (discounted)</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '13px',
                background: loading ? 'var(--border)' : 'var(--royal)',
                border: 'none', borderRadius: 10,
                color: loading ? 'var(--muted)' : '#fff',
                fontSize: 13, fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(26,63,204,0.28)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? 'Registering...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Register Card Holder
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--royal-subtle)',
            border: '1px solid rgba(26,63,204,0.18)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--royal)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Passenger Types
            </div>
            {[
              { type: 'Passenger', fare: '₱13.00', desc: 'Standard fare rate' },
              { type: 'Student', fare: '₱10.00', desc: '20% discount applied' },
            ].map(t => (
              <div key={t.type} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid rgba(26,63,204,0.12)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{t.desc}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--royal)', fontSize: 14 }}>
                  {t.fare}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              RFID UID Format
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
              color: 'var(--royal)', letterSpacing: '0.2em',
              padding: '10px 14px', background: 'var(--off-white)',
              borderRadius: 8, border: '1px solid var(--border)',
              marginBottom: 10,
            }}>
              A1:B2:C3:D4
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
              Accepted as-is or with colons. All characters are converted to uppercase automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
