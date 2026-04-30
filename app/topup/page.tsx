'use client'
import { useState } from 'react'

export default function TopUpPage() {
  const [form, setForm] = useState({ uid: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.uid || !form.amount) { setError('All fields are required.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid_uid: form.uid, amount: parseFloat(form.amount) }),
    })
    const data = await res.json()
    if (data.checkout_url) {
      window.location.href = data.checkout_url
    } else {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    }
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

  const quickAmounts = [50, 100, 200, 500]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          GCash Top-Up
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Load wallet balance via GCash through PayMongo
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
              💳
            </span>
            Payment Details
          </div>

          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 9,
              background: 'var(--danger-bg)', border: '1px solid #dc262640',
              color: 'var(--danger)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>RFID UID</label>
              <input
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                placeholder="e.g. A1B2C3D4"
                value={form.uid}
                onChange={e => setForm({ ...form, uid: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Amount (₱)</label>
              {/* Quick amount buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setForm({ ...form, amount: String(a) })}
                    style={{
                      flex: 1, padding: '7px 0',
                      border: '1.5px solid',
                      borderColor: form.amount === String(a) ? 'var(--royal)' : 'var(--border)',
                      borderRadius: 8,
                      background: form.amount === String(a) ? 'var(--royal-subtle)' : 'transparent',
                      color: form.amount === String(a) ? 'var(--royal)' : 'var(--muted)',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    ₱{a}
                  </button>
                ))}
              </div>
              <input
                style={inputStyle}
                type="number"
                step="1"
                min="50"
                placeholder="Or enter custom amount (min ₱50)"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div style={{
              padding: '14px 16px',
              background: 'var(--royal-subtle)',
              border: '1px solid rgba(26,63,204,0.18)',
              borderRadius: 9,
              fontSize: 13, color: 'var(--text-mid)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--royal)' }}>ℹ</strong>&nbsp;
              You will be redirected to the GCash payment page via PayMongo. No card information is stored.
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                marginTop: 8, padding: '13px',
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
              {loading ? 'Redirecting to GCash...' : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Pay with GCash
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              How It Works
            </div>
            {[
              { step: '1', title: 'Enter RFID UID', desc: 'Input the card\'s unique identifier' },
              { step: '2', title: 'Choose Amount', desc: 'Select or enter the top-up amount (min ₱50)' },
              { step: '3', title: 'Pay via GCash', desc: 'Complete payment on the PayMongo checkout page' },
              { step: '4', title: 'Balance Updated', desc: 'Wallet loads automatically upon confirmation' },
            ].map((s, i) => (
              <div key={s.step} style={{
                display: 'flex', gap: 14,
                paddingBottom: i < 3 ? 16 : 0,
                marginBottom: i < 3 ? 16 : 0,
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--royal)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
