'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Tx = {
  id: string
  rfid_uid: string
  status: string
  amount: number
  balance_after: number
  created_at: string
  users?: { type: string }
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

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    supabase
      .from('transactions')
      .select('*, users(type)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTxs(data ?? []); setLoading(false) })
  }, [])

  const statuses = ['ALL', 'APPROVED', 'INSUFFICIENT', 'DECLINED']
  const filtered = filter === 'ALL' ? txs : txs.filter(t => t.status === filter)

  const approved = txs.filter(t => t.status === 'APPROVED').length
  const totalFare = txs.filter(t => t.status === 'APPROVED').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          Transaction History
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {txs.length} records total
        </p>
      </div>

      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, marginBottom: 24,
      }}>
        {[
          { label: 'Total Records', value: txs.length, mono: true },
          { label: 'Approved', value: approved, mono: true },
          { label: 'Total Fare Collected', value: `₱${totalFare.toFixed(2)}`, mono: true },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              fontSize: 20, fontWeight: 800, color: 'var(--royal)',
              fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-body)',
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '7px 16px',
            borderRadius: 99,
            border: '1px solid',
            fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.15s',
            borderColor: filter === s ? 'var(--royal)' : 'var(--border)',
            background: filter === s ? 'var(--royal)' : 'var(--white)',
            color: filter === s ? '#fff' : 'var(--muted)',
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--off-white)' }}>
              {['RFID UID', 'Passenger Type', 'Status', 'Amount', 'Balance After', 'Date & Time'].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left',
                  fontSize: 10, color: 'var(--muted)',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontWeight: 700, fontFamily: 'var(--font-mono)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Loading transactions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No transactions found
                </td>
              </tr>
            ) : filtered.map((tx, i) => (
              <tr
                key={tx.id}
                style={{
                  borderTop: '1px solid var(--border)',
                  background: i % 2 !== 0 ? 'var(--off-white)' : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--royal-subtle)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 !== 0 ? 'var(--off-white)' : 'transparent' }}
              >
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-mid)' }}>
                  {tx.rfid_uid}
                </td>
                <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text)' }}>
                  {tx.users?.type ?? '—'}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 99,
                    fontWeight: 700, fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    color: statusColor(tx.status),
                    background: statusBg(tx.status),
                    border: `1px solid ${statusColor(tx.status)}44`,
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  ₱{Number(tx.amount).toFixed(2)}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--royal)' }}>
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
