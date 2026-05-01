'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EyeIcon = ({ visible }: { visible: boolean }) =>
  visible ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.auth.getSession()
      if (data.session) router.replace('/dashboard')
    })()
  }, [])

  const handleLogin = async () => {
    setError('')
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        const msgs: Record<string, string> = {
          'Invalid login credentials': 'Incorrect email or password.',
          'Email not confirmed': 'Please confirm your email first.',
        }
        throw new Error(msgs[err.message] || err.message)
      }
      router.replace('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Something went wrong.')
    } finally {
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

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--off-white); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
        :root {
          --white:#ffffff; --off-white:#f4f7fc; --surface:#eef2fa; --surface2:#e2eaf6;
          --border:#c8d6ef; --border-light:#dce8f8;
          --royal:#1a3fcc; --royal-dark:#122dab; --royal-deep:#0d1f7a; --royal-light:#2756e8;
          --royal-glow:rgba(26,63,204,.15); --royal-subtle:rgba(26,63,204,.06);
          --text:#0d1740; --text-mid:#3a4d7a; --muted:#6b7fae; --muted-light:#9aadd4;
          --success:#059669; --danger:#dc2626; --danger-bg:rgba(220,38,38,.08);
          --font-body:'Plus Jakarta Sans',sans-serif; --font-mono:'JetBrains Mono',monospace;
          --shadow-md:0 4px 16px rgba(26,63,204,.12),0 2px 6px rgba(26,63,204,.06);
          --shadow-glow:0 0 0 3px rgba(26,63,204,.18);
        }
        input:focus { outline:none; border-color:var(--royal)!important; box-shadow:var(--shadow-glow)!important; }
        .login-btn { transition: all 0.2s; }
        .login-btn:hover:not(:disabled) { background: var(--royal-dark)!important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,63,204,.35)!important; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--off-white)',
        fontFamily: 'var(--font-body)',
      }}>
        {/* Left panel */}
        <div style={{
          flex: '1 1 55%',
          background: 'linear-gradient(150deg, var(--royal) 0%, var(--royal-dark) 50%, var(--royal-deep) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background grid pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
          {/* Glow orb */}
          <div style={{
            position: 'absolute', bottom: '-80px', right: '-80px',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.6s ease forwards' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 52,
            }}>
              <div style={{
                width: 48, height: 48,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 14, backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>🚌</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>BUSPAY</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em', fontFamily: 'var(--font-mono)' }}>RFID PAYMENT SYSTEM</div>
              </div>
            </div>

            <h1 style={{
              fontSize: 40, fontWeight: 800, color: '#fff',
              lineHeight: 1.2, marginBottom: 16,
            }}>
              Intelligent<br />Transit Payments
            </h1>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7, maxWidth: 380,
            }}>
              Residents can top up their RFID cards anytime. Admins can manage card holders, monitor real-time transactions, and oversee the full payment system.
            </p>

            <div style={{ display: 'flex', gap: 32, marginTop: 52 }}>
              {[
                { label: 'Card Holders', value: 'RFID' },
                { label: 'Payments', value: 'GCash' },
                { label: 'Processing', value: 'Live' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={{
          flex: '1 1 45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          background: 'var(--white)',
        }}>
          <div style={{
            width: '100%', maxWidth: 380,
            animation: 'fadeUp 0.5s 0.1s ease both',
          }}>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Sign in to manage your RFID card or access the admin dashboard
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-mid)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 7,
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder="admin@buspay.ph"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-mid)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 7,
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: showPw ? 'var(--royal)' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', padding: 0,
                      transition: 'color 0.2s',
                    }}
                  >
                    <EyeIcon visible={showPw} />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 16,
                padding: '11px 14px',
                borderRadius: 9,
                background: 'var(--danger-bg)',
                border: '1px solid rgba(220,38,38,0.25)',
                fontSize: 13, color: 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                marginTop: 28,
                width: '100%', padding: '13px',
                background: 'var(--royal)',
                border: 'none', borderRadius: 10,
                color: '#fff',
                fontSize: 13, fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(26,63,204,0.30)',
                fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  SIGNING IN...
                </>
              ) : (
                <>
                  SIGN IN
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
              Don't have an account?{' '}
              <a href="/signup" style={{ color: 'var(--royal)', fontWeight: 600, textDecoration: 'underline' }}>
                Sign up
              </a>
            </p>

            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              BusPay RFID System • Resident & Admin Portal
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}