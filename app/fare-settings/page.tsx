'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type FareRow = { id: number; fare: number; updated_at?: string }

function InputRow({ label, description, value, onChange, prefix = '₱' }: {
  label: string; description: string; value: string; onChange: (v: string) => void; prefix?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border)', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--white)', flexShrink: 0 }}>
        <span style={{ padding: '10px 12px', background: 'var(--off-white)', fontSize: 13, fontWeight: 700, color: 'var(--muted)', borderRight: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>{prefix}</span>
        <input
          type="number"
          min="0"
          step="0.50"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', border: 'none', outline: 'none', width: 100, background: 'transparent' }}
        />
      </div>
    </div>
  )
}

export default function FareSettingsPage() {
  const [fare, setFare] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseFare = parseFloat(fare) || 0
  const studentFare = Math.max(0, baseFare - 5)

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (data) {
        setFare(String(data.fare))
        setLastUpdated(data.updated_at ?? null)
      }
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    const val = parseFloat(fare)
    if (isNaN(val) || val < 0) { setError('Please enter a valid fare amount.'); return }
    setError(null)
    setSaving(true)
    try {
      const { error: err } = await supabase
        .from('settings')
        .upsert({ id: 1, fare: val, updated_at: new Date().toISOString() })
      if (err) throw err
      setLastUpdated(new Date().toISOString())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Fare Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Configure fare amounts deducted when an RFID card is scanned</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Main card */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--off-white)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18 }}>⚙️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Fare Configuration</div>
              {lastUpdated && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Last updated: {new Date(lastUpdated).toLocaleString('en-PH')}</div>}
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading settings...</div>
            ) : (
              <>
                <InputRow
                  label="Base Fare (Regular)"
                  description="Amount deducted for regular passengers (non-student)"
                  value={fare}
                  onChange={setFare}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 0', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Student Discount Fare</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Automatically ₱5.00 less than base fare — applied when user type is "Student"</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--off-white)', flexShrink: 0, opacity: 0.6 }}>
                    <span style={{ padding: '10px 12px', background: 'var(--surface)', fontSize: 13, fontWeight: 700, color: 'var(--muted)', borderRight: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>₱</span>
                    <span style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-mid)', width: 100 }}>
                      {studentFare.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {error ? (
              <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>⚠️ {error}</span>
            ) : saved ? (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✅ Fare saved successfully!</span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Changes take effect immediately on next scan</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '10px 24px', background: saving ? 'var(--muted)' : 'var(--royal)', color: '#fff',
                borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(26,63,204,0.3)',
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#1a2fcc' }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = 'var(--royal)' }}
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Preview card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text)', background: 'var(--off-white)' }}>
              📋 Fare Preview
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Regular Passenger', fare: baseFare, color: 'var(--royal)', badge: 'REGULAR' },
                { label: 'Student Passenger', fare: studentFare, color: '#16a34a', badge: 'STUDENT' },
              ].map(row => (
                <div key={row.badge} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: row.color + '10', borderRadius: 10, border: `1px solid ${row.color}30` }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: row.color + '20', color: row.color, letterSpacing: '0.08em' }}>{row.badge}</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{row.label}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 900, color: row.color }}>
                    ₱{row.fare.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', marginBottom: 6 }}>💡 How fare works</div>
            <div style={{ fontSize: 11, color: '#713f12', lineHeight: 1.6 }}>
              When an RFID card is scanned, the system checks the user type. Regular passengers are charged the base fare. Students automatically receive a ₱5.00 discount. If balance is insufficient, the transaction is rejected.
            </div>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>⚡ Cooldown protection</div>
            <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.6 }}>
              Each card has a 5-second cooldown after scanning. If the same card is tapped again within 5 seconds, the charge is blocked and shown as COOLDOWN — preventing accidental double payments.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
