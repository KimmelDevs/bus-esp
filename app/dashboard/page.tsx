'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = { users: number; transactions: number; income: number; pendingTopups: number }
type Tx = { id: string; rfid_uid: string; status: string; amount: number; balance_after: number; created_at: string; users?: { type: string } }

function StatCard({
  label, value, unit, color, icon, sub,
}: {
  label: string; value: string | number; unit?: string; color: string; icon: React.ReactNode; sub?: string
}) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 90, height: 90,
        background: color,
        opacity: 0.06,
        borderRadius: '0 14px 0 100%',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
          boxShadow: `0 2px 8px ${color}55`,
        }}>
          {icon}
        </div>
        {sub && (
          <span style={{
            fontSize: 10, color: 'var(--success)',
            background: 'var(--success-bg)', padding: '3px 8px',
            borderRadius: 99, fontWeight: 700,
          }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
        {unit && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{unit}</div>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function statusColor(s: string) {
  if (s === 'APPROVED') return 'var(--success)'
  if (s === 'INSUFFICIENT') return 'var(--warning)'
  return 'var(--danger)'
}
function statusBg(s: string) {
  if (s === 'APPROVED') return 'var(--success-bg)'
  if (s === 'INSUFFICIENT') return 'var(--warning-bg)'
  return 'var(--danger-bg)'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, transactions: 0, income: 0, pendingTopups: 0 })
  const [recent, setRecent] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [usersRes, txRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('*, users(type)').order('created_at', { ascending: false }).limit(6),
      ])

      const txAll = await supabase
        .from('transactions')
        .select('amount, status')
        .eq('status', 'APPROVED')

      const income = (txAll.data ?? []).reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      setStats({
        users: usersRes.count ?? 0,
        transactions: txRes.data?.length ?? 0,
        income,
        pendingTopups: 0,
      })
      setRecent(txRes.data ?? [])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Overview of your RFID payment system
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard label="Registered Users" value={stats.users} unit="RFID card holders" color="var(--royal)" icon="👤" />
        <StatCard label="Total Transactions" value={stats.transactions} unit="processed entries" color="#7c3aed" icon="🧾" />
        <StatCard label="Total Income" value={`₱${stats.income.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} unit="approved fare payments" color="var(--success)" icon="💰" />
        <StatCard label="System Mode" value="TEST" unit="sandbox environment" color="var(--warning)" icon="⚠️" />
      </div>

      {/* Recent Transactions */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent Transactions</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Latest 6 entries</div>
          </div>
          <a href="/transactions" style={{
            fontSize: 12, fontWeight: 600, color: 'var(--royal)',
            border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 12px',
            transition: 'all 0.15s',
          }}>
            View All →
          </a>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--off-white)' }}>
              {['RFID UID', 'Type', 'Status', 'Amount', 'Balance After', 'Date'].map(h => (
                <th key={h} style={{
                  padding: '10px 20px', textAlign: 'left',
                  fontSize: 10, color: 'var(--muted)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: 700, fontFamily: 'var(--font-mono)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Loading...
                </td>
              </tr>
            ) : recent.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No transactions yet
                </td>
              </tr>
            ) : recent.map((tx, i) => (
              <tr key={tx.id} style={{
                borderTop: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--off-white)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--royal-subtle)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'var(--off-white)' }}
              >
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mid)', fontWeight: 600 }}>
                  {tx.rfid_uid}
                </td>
                <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text)' }}>
                  {tx.users?.type ?? '—'}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 99,
                    fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: statusColor(tx.status),
                    background: statusBg(tx.status),
                    border: `1px solid ${statusColor(tx.status)}44`,
                    letterSpacing: '0.06em',
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  ₱{Number(tx.amount).toFixed(2)}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--royal)', fontWeight: 700 }}>
                  ₱{Number(tx.balance_after).toFixed(2)}
                </td>
                <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(tx.created_at).toLocaleString('en-PH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
