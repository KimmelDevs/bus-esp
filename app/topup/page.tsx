'use client'
import { useState } from 'react'

export default function TopUpPage() {
  const [form, setForm] = useState({ uid: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', marginBottom: '8px' }}>GCash Top-Up</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '14px' }}>Load wallet balance via GCash through PayMongo</p>

      <div style={{ maxWidth: '440px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(255,68,68,0.08)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '14px' }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>RFID UID</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="e.g. A1B2C3D4"
              value={form.uid} onChange={e => setForm({ ...form, uid: e.target.value })} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (₱)</label>
            <input style={inputStyle} type="number" step="1" min="50" placeholder="Minimum ₱50"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>

          <div style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>
            💡 You will be redirected to the GCash payment page.
          </div>

          <button type="submit" disabled={loading} style={{
            background: '#0040cc', color: 'white', border: 'none', borderRadius: '8px',
            padding: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '15px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Redirecting...' : '💳 Pay with GCash'}
          </button>
        </form>
      </div>
    </div>
  )
}
