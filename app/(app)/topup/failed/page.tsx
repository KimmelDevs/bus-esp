export default function FailedPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--danger)', marginBottom: '8px' }}>Payment Cancelled</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>Your payment was not completed. No charges were made.</p>
      <a href="/topup" style={{
        background: 'var(--accent2)', color: 'white', padding: '12px 28px',
        borderRadius: '8px', fontWeight: 600, fontSize: '14px'
      }}>Try Again</a>
    </div>
  )
}
