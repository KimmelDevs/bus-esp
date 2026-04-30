'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = { users: number; transactions: number; income: number; fare: number }
type User = { id: string; name: string; rfid_uid: string; type: string; balance: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, transactions: 0, income: 0, fare: 0 })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count: userCount }, { count: txCount }, { data: incomeData }, { data: fareData }, { data: usersData }] =
        await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('transactions').select('*', { count: 'exact', head: true }),
          supabase.from('transactions').select('amount'),
          supabase.from('settings').select('fare').eq('id', 1).single(),
          supabase.from('users').select('*').order('name'),
        ])

      const income = incomeData?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0
      setStats({ users: userCount ?? 0, transactions: txCount ?? 0, income, fare: fareData?.fare ?? 0 })
      setUsers(usersData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const [fare, setFare] = useState('')
  const [saving, setSaving] = useState(false)

  async function updateFare(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('settings').upsert({ id: 1, fare: parseFloat(fare) })
    setStats(s => ({ ...s, fare: parseFloat(fare) }))
    setFare('')
    setSaving(false)
  }

  const card = (label: string, value: string | number) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', marginBottom: '8px', color: 'var(--text)' }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '14px' }}>Bus RFID Payment System Overview</p>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {card('Total Users', stats.users)}
            {card('Transactions', stats.transactions)}
            {card('Total Income', `₱${stats.income.toFixed(2)}`)}
          </div>

          {/* Fare */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              💰 Current Fare: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>₱{stats.fare}</span>
            </div>
            <form onSubmit={updateFare} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number" step="0.01" placeholder="New fare amount"
                value={fare} onChange={e => setFare(e.target.value)} required
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px', width: '200px' }}
              />
              <button type="submit" disabled={saving} style={{
                background: 'var(--accent2)', color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
              }}>
                {saving ? 'Saving...' : 'Update Fare'}
              </button>
            </form>
          </div>

          {/* Live RFID */}
          <div style={{ background: '#000', border: '1px solid var(--accent)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: '12px', fontSize: '14px' }}>📡 LIVE RFID MONITOR</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)' }}>
              Card: <span id="scan" style={{ color: 'var(--text)' }}>Waiting for scan...</span>
            </div>
          </div>

          {/* Users table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 600 }}>👥 Registered Users</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Name', 'RFID UID', 'Type', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{u.name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>{u.rfid_uid}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600,
                        background: u.type === 'Student' ? '#1e3a5f' : '#3b1f2b',
                        color: u.type === 'Student' ? '#60a5fa' : '#f472b6',
                      }}>{u.type ?? 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: u.balance < 20 ? 'var(--warning)' : 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ₱{Number(u.balance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
