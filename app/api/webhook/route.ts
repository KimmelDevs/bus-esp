import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyWebhookSignature } from '@/lib/paymongo'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('paymongo-signature') ?? ''
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET!

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const eventType = payload?.data?.attributes?.type

  // Handle checkout session completed (payment.paid)
  if (eventType === 'checkout_session.payment.paid') {
    const attrs = payload.data.attributes.data.attributes
    const metadata = attrs.metadata ?? {}
    const rfid_uid = metadata.rfid_uid
    const payment_id = metadata.payment_id
    const amount = attrs.amount_due / 100 // convert centavos to pesos

    if (!rfid_uid || !payment_id) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 1. Add balance to user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('rfid_uid', rfid_uid)
      .single()

    if (user) {
      const newBalance = Number(user.balance) + amount
      await supabaseAdmin.from('users').update({ balance: newBalance }).eq('rfid_uid', rfid_uid)

      // 2. Mark payment as paid
      await supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment_id)

      // 3. Log transaction
      await supabaseAdmin.from('transactions').insert({
        rfid_uid,
        status: 'TOPUP',
        amount,
        balance_after: newBalance,
      })
    }
  }

  return NextResponse.json({ received: true })
}
