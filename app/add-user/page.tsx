'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AddUserPage() {
  const [form, setForm] = useState({ name: '', rfid_uid: '', balance: '', type: '' })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      setMsg({ text: 'User added successfully!', ok: true })
      setForm({ name: '', rfid_uid: '', balance: '', type: '' })
    }
    setLoading(false)
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
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', marginBottom: '8px' }}>Add RFID User</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '14px' }}>Register a new card holder in the system</p>

      <div style={{ maxWidth: '480px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
        {msg && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '8px',
            background: msg.ok ? 'rgba(0,255,153,0.08)' : 'rgba(255,68,68,0.08)',
            border: `1px solid ${msg.ok ? 'var(--success)' : 'var(--danger)'}`,
            color: msg.ok ? 'var(--success)' : 'var(--danger)',
            fontSize: '14px',
          }}>
            {msg.ok ? '✅' : '❌'} {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Full Name</label>
            <input style={inputStyle} placeholder="e.g. Juan Dela Cruz" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>RFID UID</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="e.g. A1B2C3D4"
              value={form.rfid_uid} onChange={e => setForm({ ...form, rfid_uid: e.target.value })} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Initial Balance (₱)</label>
            <input style={inputStyle} type="number" step="0.01" placeholder="0.00"
              value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Passenger Type</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
              <option value="">Select type</option>
              <option value="Passenger">Passenger</option>
              <option value="Student">Student (discounted)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: '8px', background: 'var(--accent2)', color: 'white', border: 'none',
            borderRadius: '8px', padding: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '15px'
          }}>
            {loading ? 'Adding...' : '+ Add User'}
          </button>
        </form>
      </div>
    </div>
  )
}
