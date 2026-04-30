export default function FailedPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--danger-bg)',
        border: '2px solid #dc262640',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, margin: '0 auto 24px',
      }}>
        ✕
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        Payment Cancelled
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
        Your payment was not completed. No charges were made to your account.
      </p>
      <a href="/topup" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--royal)', color: '#fff',
        padding: '12px 28px', borderRadius: 10,
        fontWeight: 700, fontSize: 13,
        letterSpacing: '0.06em',
        boxShadow: '0 4px 14px rgba(26,63,204,0.28)',
        textDecoration: 'none',
      }}>
        Try Again
      </a>
    </div>
  )
}
