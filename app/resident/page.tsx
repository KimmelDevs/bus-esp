'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useMqttScan } from '@/lib/useMqttScan'

type ResidentUser = {
  id: string
  name: string
  rfid_uid: string | null
  balance: number
  type: string
  email: string
}

type Tx = {
  id: string
  rfid_uid: string
  status: string
  amount: number
  balance_after: number
  created_at: string
  type?: 'fare' | 'topup'
}

function statusColor(s: string) {
  if (s === 'APPROVED' || s === 'topup') return '#059669'
  if (s === 'INSUFFICIENT') return '#d97706'
  return '#dc2626'
}
function statusBg(s: string) {
  if (s === 'APPROVED' || s === 'topup') return 'rgba(5,150,105,0.08)'
  if (s === 'INSUFFICIENT') return 'rgba(217,119,6,0.08)'
  return 'rgba(220,38,38,0.08)'
}

export default function ResidentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auth / user state
  const [authEmail, setAuthEmail] = useState('')
  const [resident, setResident] = useState<ResidentUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Card registration state
  const [showRegister, setShowRegister] = useState(false)
  const [registerType, setRegisterType] = useState('Passenger')
  const [registerMsg, setRegisterMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [scanFlash, setScanFlash] = useState(false)
  const [scannedUid, setScannedUid] = useState('')

  // Top-up state
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupError, setTopupError] = useState('')

  // Transactions
  const [txs, setTxs] = useState<Tx[]>([])
  const [txFilter, setTxFilter] = useState('ALL')
  const [loadingTxs, setLoadingTxs] = useState(true)

  const { lastScan, status, clearScan, claimScanner, releaseScanner } = useMqttScan()

  // Claim scanner only when register panel is open
  useEffect(() => {
    if (showRegister) {
      claimScanner('resident-register')
    } else {
      releaseScanner()
    }
    return () => releaseScanner()
  }, [showRegister])

  // Auto-fill RFID when card is scanned
  useEffect(() => {
    if (!lastScan || !showRegister) return
    setScannedUid(lastScan.replace(/:/g, '').toUpperCase())
    setScanFlash(true)
    setTimeout(() => setScanFlash(false), 1500)
    clearScan()
  }, [lastScan])

  // Load session + resident profile
  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setAuthEmail(session.user.email ?? '')

      // Look up resident by email in the users table
      const { data: u } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle()

      setResident(u ?? null)
      setLoadingUser(false)

      // Only fetch transactions if the RFID card is already linked
      if (u?.rfid_uid) fetchTransactions(u.rfid_uid)

      // If redirected back from a successful topup, poll until balance updates
      if (searchParams.get('topup') === 'success' && u?.id) {
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          const { data } = await supabase.from('users').select('balance').eq('id', u.id).single()
          if (data && Number(data.balance) !== Number(u.balance)) {
            setResident(r => r ? { ...r, balance: data.balance } : r)
            if (u.rfid_uid) fetchTransactions(u.rfid_uid)
            clearInterval(poll)
          }
          if (attempts >= 10) clearInterval(poll) // stop after 10s
        }, 1000)
      }
    })()
  }, [])

  async function fetchTransactions(rfid_uid: string) {
    setLoadingTxs(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('rfid_uid', rfid_uid)
      .order('created_at', { ascending: false })
      .limit(50)
    setTxs(data ?? [])
    setLoadingTxs(false)
  }

  async function refreshBalance() {
    if (!resident) return
    const { data } = await supabase
      .from('users')
      .select('balance')
      .eq('id', resident.id)
      .single()
    if (data) setResident(r => r ? { ...r, balance: data.balance } : r)
  }

  // Real-time balance subscription
  useEffect(() => {
    if (!resident?.id) return
    const channel = supabase
      .channel('resident-balance')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${resident.id}` },
        (payload) => {
          const updated = payload.new as ResidentUser
          setResident(r => r ? { ...r, balance: updated.balance } : r)
          if (updated.rfid_uid) fetchTransactions(updated.rfid_uid)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [resident?.id])

  async function handleRegister() {
    if (!scannedUid) { setRegisterMsg({ text: 'Please tap your RFID card on the reader first.', ok: false }); return }
    setRegisterLoading(true)
    setRegisterMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Check if UID already registered to a DIFFERENT account
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('rfid_uid', scannedUid)
      .maybeSingle()
    if (existing && existing.email !== session.user.email) {
      setRegisterMsg({ text: 'This card is already registered to another account.', ok: false })
      setRegisterLoading(false)
      return
    }

    const name = session.user.user_metadata?.full_name || authEmail.split('@')[0]

    let resultUser = null
    let error = null

    if (resident) {
      // Row already exists from signup — just update the rfid_uid and type
      const { data, error: err } = await supabase
        .from('users')
        .update({ rfid_uid: scannedUid, type: registerType, name })
        .eq('id', resident.id)
        .select()
        .single()
      resultUser = data
      error = err
    } else {
      // No row yet — insert fresh
      const { data, error: err } = await supabase
        .from('users')
        .insert({ name, rfid_uid: scannedUid, balance: 0, type: registerType, email: session.user.email })
        .select()
        .single()
      resultUser = data
      error = err
    }

    if (error) {
      setRegisterMsg({ text: error.message, ok: false })
    } else {
      setRegisterMsg({ text: 'Card registered successfully!', ok: true })
      setResident(resultUser)
      setShowRegister(false)
      fetchTransactions(scannedUid)
    }
    setRegisterLoading(false)
  }

  async function handleTopup() {
    if (!resident) return
    const amt = parseFloat(topupAmount)
    if (!topupAmount || isNaN(amt) || amt < 50) {
      setTopupError('Minimum top-up is ₱50.')
      return
    }
    setTopupLoading(true)
    setTopupError('')
    const res = await fetch('/api/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid_uid: resident.rfid_uid, amount: amt }),
    })
    const data = await res.json()
    if (data.checkout_url) {
      window.location.href = data.checkout_url
    } else {
      setTopupError(data.error ?? 'Something went wrong.')
      setTopupLoading(false)
    }
  }

  const quickAmounts = [50, 100, 200, 500]
  const statusLabel = status === 'connected' ? 'Reader ready — tap your card' : status === 'error' ? 'Reader error' : 'Connecting to reader…'
  const statusDot = status === 'connected' ? '#16a34a' : status === 'error' ? '#dc2626' : '#d97706'

  const statuses = ['ALL', 'APPROVED', 'INSUFFICIENT', 'DECLINED']
  const filtered = txFilter === 'ALL' ? txs : txs.filter(t => t.status === txFilter)
  const totalSpent = txs.filter(t => t.status === 'APPROVED').reduce((s, t) => s + Number(t.amount), 0)
  const totalRides = txs.filter(t => t.status === 'APPROVED').length

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid var(--border)', borderRadius: 9,
    background: 'var(--off-white)', color: 'var(--text)',
    fontSize: 14, fontFamily: 'var(--font-body)',
    transition: 'all 0.2s', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: 'var(--text-mid)', letterSpacing: '0.1em',
    textTransform: 'uppercase' as const, marginBottom: 7,
  }

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid var(--border)',
            borderTopColor: 'var(--royal)', borderRadius: '50%',
            margin: '0 auto 12px', animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>LOADING…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scanPop { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        .action-btn { transition: all 0.2s; }
        .action-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
        .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .tx-row:hover { background: var(--royal-subtle) !important; }
        input:focus { border-color: var(--royal) !important; box-shadow: 0 0 0 3px rgba(26,63,204,0.15) !important; }
        select:focus { border-color: var(--royal) !important; box-shadow: 0 0 0 3px rgba(26,63,204,0.15) !important; outline: none; }
      `}</style>

      {/* ── Header greeting ── */}
      <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>
              My BusPay Wallet
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{authEmail}</p>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
            style={{
              padding: '8px 16px', background: 'transparent',
              border: '1.5px solid var(--border)', borderRadius: 8,
              fontSize: 12, fontWeight: 700, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              letterSpacing: '0.06em',
            }}
          >
            SIGN OUT
          </button>
        </div>
      </div>

      {/* ── No card registered ── */}
      {(!resident || !resident.rfid_uid) && (
        <div style={{ animation: 'fadeUp 0.4s 0.1s ease both' }}>
          <div style={{
            background: 'var(--white)', border: '1.5px dashed var(--border)',
            borderRadius: 16, padding: '40px 32px', textAlign: 'center',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💳</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
              No RFID Card Linked
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Register your RFID card to start riding and topping up your wallet.
            </p>
            <button
              className="action-btn"
              onClick={() => setShowRegister(true)}
              style={{
                padding: '12px 28px', background: 'var(--royal)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-body)', letterSpacing: '0.08em',
                boxShadow: '0 4px 14px rgba(26,63,204,0.28)',
              }}
            >
              + REGISTER MY CARD
            </button>
          </div>
        </div>
      )}

      {/* ── Card Register Panel ── */}
      {showRegister && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px', marginBottom: 24,
          boxShadow: 'var(--shadow-md)', animation: 'fadeUp 0.3s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--royal-subtle)', border: '1px solid rgba(26,63,204,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>📡</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Register RFID Card</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tap your card on the reader to link it</div>
              </div>
            </div>
            <button onClick={() => { setShowRegister(false); setScannedUid(''); setRegisterMsg(null) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* MQTT status */}
          <div style={{
            marginBottom: 20, padding: '9px 14px', borderRadius: 8,
            background: status === 'connected' ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${statusDot}30`,
            fontSize: 12, color: statusDot,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: statusDot,
              display: 'inline-block',
              animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
            }} />
            {statusLabel}
          </div>

          {registerMsg && (
            <div style={{
              marginBottom: 18, padding: '11px 14px', borderRadius: 9,
              background: registerMsg.ok ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${registerMsg.ok ? '#05966940' : '#dc262640'}`,
              color: registerMsg.ok ? '#059669' : '#dc2626',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {registerMsg.ok ? '✓' : '⚠'} {registerMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Scanned UID display */}
            <div>
              <label style={labelStyle}>RFID Card UID</label>
              <div style={{
                padding: '12px 16px', borderRadius: 9,
                border: `1.5px solid ${scanFlash ? '#16a34a' : scannedUid ? 'var(--royal)' : 'var(--border)'}`,
                background: scanFlash ? '#f0fdf4' : scannedUid ? 'var(--royal-subtle)' : 'var(--off-white)',
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                color: scannedUid ? 'var(--royal)' : 'var(--muted)',
                letterSpacing: '0.08em', transition: 'all 0.3s',
                animation: scanFlash ? 'scanPop 0.3s ease' : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
                minHeight: 46,
              }}>
                {scannedUid ? (
                  <>
                    <span style={{ fontSize: 16 }}>{scanFlash ? '📡' : '✓'}</span>
                    {scannedUid}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13 }}>
                    Waiting for card tap…
                  </span>
                )}
              </div>
            </div>

            {/* Passenger type */}
            <div>
              <label style={labelStyle}>Passenger Type</label>
              <select
                value={registerType}
                onChange={e => setRegisterType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="Passenger">Passenger — ₱13.00 standard fare</option>
                <option value="Student">Student — ₱10.00 discounted fare</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="action-btn"
                onClick={handleRegister}
                disabled={registerLoading || !scannedUid}
                style={{
                  flex: 1, padding: '12px',
                  background: registerLoading || !scannedUid ? 'var(--border)' : 'var(--royal)',
                  border: 'none', borderRadius: 10,
                  color: registerLoading || !scannedUid ? 'var(--muted)' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: registerLoading || !scannedUid ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', letterSpacing: '0.08em',
                  boxShadow: registerLoading || !scannedUid ? 'none' : '0 4px 14px rgba(26,63,204,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {registerLoading ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Registering…
                  </>
                ) : '✓ REGISTER CARD'}
              </button>
              {scannedUid && (
                <button
                  onClick={() => setScannedUid('')}
                  style={{
                    padding: '12px 16px', background: 'transparent',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Registered card view ── */}
      {resident && resident.rfid_uid && (
        <>
          {/* Top row: Balance card + Top-up form */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.4fr',
            gap: 20, marginBottom: 20,
            animation: 'fadeUp 0.4s 0.1s ease both',
          }}>
            {/* Balance card */}
            <div style={{
              background: 'linear-gradient(140deg, var(--royal) 0%, var(--royal-dark) 55%, var(--royal-deep) 100%)',
              borderRadius: 16, padding: '28px 26px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 28px rgba(26,63,204,0.28)',
            }}>
              {/* Grid pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }} />
              <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 18 }}>
                  🚌 BUSPAY WALLET
                </div>

                <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 6 }}>
                  ₱{Number(resident.balance).toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                  Available balance
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{resident.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                    {resident.rfid_uid ?? '—'}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
                    padding: '3px 10px', borderRadius: 99,
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                    letterSpacing: '0.1em', width: 'fit-content',
                  }}>
                    {resident.type.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Refresh balance button */}
              <button
                onClick={refreshBalance}
                title="Refresh balance"
                style={{
                  position: 'absolute', top: 18, right: 18,
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', fontSize: 13,
                  transition: 'background 0.2s',
                }}
              >
                ↻
              </button>
            </div>

            {/* Top-up form */}
            <div style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 26px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'var(--royal-subtle)', border: '1px solid rgba(26,63,204,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>💸</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>GCash Top-Up</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Quick Amount</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {quickAmounts.map(a => (
                    <button
                      key={a}
                      onClick={() => setTopupAmount(String(a))}
                      style={{
                        padding: '9px 0',
                        border: '1.5px solid',
                        borderColor: topupAmount === String(a) ? 'var(--royal)' : 'var(--border)',
                        borderRadius: 9,
                        background: topupAmount === String(a) ? 'var(--royal-subtle)' : 'transparent',
                        color: topupAmount === String(a) ? 'var(--royal)' : 'var(--muted)',
                        fontSize: 13, fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      ₱{a}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Custom Amount (₱)</label>
                <input
                  style={inputStyle}
                  type="number" step="1" min="50"
                  placeholder="Min ₱50"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                />
              </div>

              {topupError && (
                <div style={{
                  marginBottom: 14, padding: '10px 13px', borderRadius: 8,
                  background: 'rgba(220,38,38,0.08)', border: '1px solid #dc262640',
                  color: '#dc2626', fontSize: 12, display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  ⚠ {topupError}
                </div>
              )}

              <button
                className="action-btn"
                onClick={handleTopup}
                disabled={topupLoading}
                style={{
                  width: '100%', padding: '12px',
                  background: topupLoading ? 'var(--border)' : 'var(--royal)',
                  border: 'none', borderRadius: 10,
                  color: topupLoading ? 'var(--muted)' : '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: topupLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', letterSpacing: '0.08em',
                  boxShadow: topupLoading ? 'none' : '0 4px 14px rgba(26,63,204,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {topupLoading ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Redirecting to GCash…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    PAY WITH GCASH
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14, marginBottom: 24,
            animation: 'fadeUp 0.4s 0.2s ease both',
          }}>
            {[
              { label: 'Total Rides', value: totalRides, icon: '🚌' },
              { label: 'Total Fare Paid', value: `₱${totalSpent.toFixed(2)}`, icon: '💳' },
              { label: 'Transactions', value: txs.length, icon: '📋' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--white)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--royal-subtle)', border: '1px solid rgba(26,63,204,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
                }}>
                  {s.icon}
                </span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--royal)', fontFamily: 'var(--font-mono)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction history */}
          <div style={{ animation: 'fadeUp 0.4s 0.3s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Transaction History</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{txs.length} records for card {resident.rfid_uid ?? '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {statuses.map(s => (
                  <button key={s} onClick={() => setTxFilter(s)} style={{
                    padding: '6px 13px', borderRadius: 99,
                    border: '1px solid',
                    fontSize: 10, fontWeight: 700,
                    fontFamily: 'var(--font-body)', letterSpacing: '0.06em',
                    cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: txFilter === s ? 'var(--royal)' : 'var(--border)',
                    background: txFilter === s ? 'var(--royal)' : 'var(--white)',
                    color: txFilter === s ? '#fff' : 'var(--muted)',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--off-white)' }}>
                    {['Status', 'Amount', 'Balance After', 'Date & Time'].map(h => (
                      <th key={h} style={{
                        padding: '10px 20px', textAlign: 'left',
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
                  {loadingTxs ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--royal)', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                        Loading transactions…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                        No {txFilter !== 'ALL' ? txFilter.toLowerCase() : ''} transactions found
                      </td>
                    </tr>
                  ) : filtered.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className="tx-row"
                      style={{
                        borderTop: '1px solid var(--border)',
                        background: i % 2 !== 0 ? 'var(--off-white)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          fontSize: 10, padding: '4px 10px', borderRadius: 99,
                          fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
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
        </>
      )}

      {/* Register card button (when card exists, allow re-registering via link) */}
      {resident && resident.rfid_uid && (
        <div style={{ marginTop: 20, textAlign: 'center', animation: 'fadeUp 0.4s 0.4s ease both' }}>
          <button
            onClick={() => setShowRegister(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-body)',
              textDecoration: 'underline', padding: 0,
            }}
          >
            {showRegister ? 'Cancel card registration' : 'Register a different card'}
          </button>
        </div>
      )}
    </div>
  )
}