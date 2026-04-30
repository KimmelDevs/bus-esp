'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Tx = { id: string; rfid_uid: string; status: string; amount: number; balance_after: number; created_at: string; users?: { type: string } }

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('transactions')
      .select('*, users(type)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTxs(data ?? []); setLoading(false) })
  }, [])

  const statusColor = (s: string) => s === 'APPROVED' ? 'var(--success)' : s === 'INSUFFICIENT' ? 'var(--warning)' : 'var(--danger)'

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', marginBottom: '8px' }}>Transaction History</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '14px' }}>{txs.length} records total</p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['RFID UID', 'Type', 'Status', 'Amount', 'Balance After', 'Date'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>No transactions yet</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>{tx.rfid_uid}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{tx.users?.type ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, color: statusColor(tx.status), border: `1px solid ${statusColor(tx.status)}44` }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>₱{Number(tx.amount).toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>₱{Number(tx.balance_after).toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)' }}>{new Date(tx.created_at).toLocaleString('en-PH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
