export default function SuccessPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--success)', marginBottom: '8px' }}>Payment Successful!</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>Your wallet has been loaded. The balance will update shortly.</p>
      <a href="/dashboard" style={{
        background: 'var(--accent2)', color: 'white', padding: '12px 28px',
        borderRadius: '8px', fontWeight: 600, fontSize: '14px'
      }}>Back to Dashboard</a>
    </div>
  )
}
