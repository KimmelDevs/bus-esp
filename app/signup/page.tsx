'use client'
import { useState } from 'react'
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

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError('')

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
        },
      })
      if (err) throw new Error(err.message)
      setSuccess(true)
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-mid)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 7,
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
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkPop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
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
        .signup-btn { transition: all 0.2s; }
        .signup-btn:hover:not(:disabled) { background: var(--royal-dark)!important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,63,204,.35)!important; }
        .signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .link-btn { background: none; border: none; cursor: pointer; color: var(--royal); font-size: 13px; font-family: var(--font-body); font-weight: 600; text-decoration: underline; padding: 0; }
        .link-btn:hover { color: var(--royal-dark); }
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
          {/* Top orb */}
          <div style={{
            position: 'absolute', top: '-60px', left: '-60px',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
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
              Join the<br />Transit Network
            </h1>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7, maxWidth: 380,
            }}>
              Create your admin account to start managing RFID card holders, track live transactions, and oversee GCash top-up processing.
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

        {/* Right panel — signup form */}
        <div style={{
          flex: '1 1 45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          background: 'var(--white)',
          overflowY: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: 400,
            animation: 'fadeUp 0.5s 0.1s ease both',
          }}>

            {success ? (
              /* Success state */
              <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
                <div style={{
                  width: 72, height: 72,
                  borderRadius: '50%',
                  background: 'rgba(5,150,105,0.1)',
                  border: '2px solid rgba(5,150,105,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: 32,
                  animation: 'checkPop 0.5s ease both',
                }}>
                  ✓
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
                  Account Created!
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>
                  We sent a confirmation link to <strong style={{ color: 'var(--text-mid)' }}>{form.email}</strong>. Please check your inbox to verify your account before signing in.
                </p>
                <button
                  className="signup-btn"
                  onClick={() => router.push('/login')}
                  style={{
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
                  GO TO SIGN IN
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                    Create account
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Set up your admin access to the dashboard
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      placeholder="e.g. Juan Dela Cruz"
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      placeholder="admin@buspay.ph"
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        placeholder="Min. 8 characters"
                        onChange={e => setForm({ ...form, password: e.target.value })}
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
                    {/* Password strength indicator */}
                    {form.password.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        {[1, 2, 3, 4].map(i => {
                          const strength = Math.min(Math.floor(form.password.length / 3), 4)
                          const colors = ['#dc2626', '#f59e0b', '#3b82f6', '#059669']
                          return (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 4,
                              background: i <= strength ? colors[strength - 1] : 'var(--border)',
                              transition: 'background 0.3s',
                            }} />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={form.confirmPassword}
                        placeholder="Re-enter your password"
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleSignup()}
                        style={{
                          ...inputStyle,
                          paddingRight: 44,
                          borderColor: form.confirmPassword && form.confirmPassword !== form.password
                            ? 'var(--danger)' : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(v => !v)}
                        style={{
                          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: showConfirmPw ? 'var(--royal)' : 'var(--muted)',
                          display: 'flex', alignItems: 'center', padding: 0,
                          transition: 'color 0.2s',
                        }}
                      >
                        <EyeIcon visible={showConfirmPw} />
                      </button>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>
                        Passwords do not match
                      </div>
                    )}
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
                  className="signup-btn"
                  onClick={handleSignup}
                  disabled={loading}
                  style={{
                    marginTop: 24,
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
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    <>
                      CREATE ACCOUNT
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>

                <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  Already have an account?{' '}
                  <button className="link-btn" onClick={() => router.push('/login')}>
                    Sign in
                  </button>
                </p>

                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                  BusPay RFID System • Admin Portal
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}