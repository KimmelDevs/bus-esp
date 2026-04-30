import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { mqttPublish } from '@/lib/mqtt-publish'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  console.log('[webhook] hit')

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (e) {
    console.error('[webhook] bad JSON:', e)
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const eventType = payload?.data?.attributes?.type
  console.log('[webhook] eventType:', eventType)

  const isPaid =
    eventType === 'checkout_session.payment.paid' ||
    eventType === 'payment.paid'

  if (!isPaid) {
    console.log('[webhook] ignoring event:', eventType)
    return NextResponse.json({ received: true })
  }

  const dataAttrs = payload?.data?.attributes?.data?.attributes ?? payload?.data?.attributes ?? {}
  const metadata = dataAttrs?.metadata ?? {}

  const rfid_uid    = metadata?.rfid_uid
  const payment_id  = metadata?.payment_id
  const amountCentavos = dataAttrs?.amount_due ?? dataAttrs?.amount ?? 0
  const amount = amountCentavos / 100

  console.log('[webhook] rfid_uid:', rfid_uid, '| payment_id:', payment_id, '| amount:', amount)

  if (!rfid_uid) {
    console.error('[webhook] no rfid_uid in metadata')
    return NextResponse.json({ error: 'Missing rfid_uid' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const cleanUid = rfid_uid.replace(/:/g, '').toUpperCase()

  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('rfid_uid', cleanUid)
    .single()

  console.log('[webhook] user:', user, '| error:', userErr)

  if (!user) {
    console.error('[webhook] user not found for uid:', cleanUid)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const newBalance = Number(user.balance) + amount

  const { error: balanceErr } = await supabaseAdmin
    .from('users')
    .update({ balance: newBalance })
    .eq('rfid_uid', cleanUid)
  console.log('[webhook] balance update error:', balanceErr)

  if (payment_id) {
    await supabaseAdmin
      .from('payments')
      .update({ status: 'paid' })
      .eq('id', payment_id)
  }

  const { error: txErr } = await supabaseAdmin
    .from('transactions')
    .insert({ rfid_uid: cleanUid, status: 'TOPUP', amount, balance_after: newBalance })
  console.log('[webhook] tx insert error:', txErr)

  // ── Notify ESP32 about the top-up so it shows on the LCD ──────────────────
  // ESP32 listens on  rfid/+/balance  and expects JSON: { uid, amount }
  await mqttPublish(
    `rfid/${cleanUid}/balance`,
    JSON.stringify({ uid: cleanUid, amount })
  )

  console.log('[webhook] success — new balance:', newBalance)
  return NextResponse.json({ received: true })
}
