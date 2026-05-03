'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const [href, setHref] = useState('/resident?topup=success')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.user_metadata?.role
      setHref(role === 'admin' ? '/dashboard' : '/resident?topup=success')
    })
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--success-bg)',
        border: '2px solid #05966940',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, margin: '0 auto 24px',
      }}>
        ✓
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        Payment Successful!
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
        Your wallet has been loaded. The balance will update shortly.
      </p>
      <a href={href} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--royal)', color: '#fff',
        padding: '12px 28px', borderRadius: 10,
        fontWeight: 700, fontSize: 13,
        letterSpacing: '0.06em',
        boxShadow: '0 4px 14px rgba(26,63,204,0.28)',
        textDecoration: 'none',
      }}>
        Back to Wallet
      </a>
    </div>
  )
}