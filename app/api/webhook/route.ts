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

  const rfid_uid   = metadata?.rfid_uid
  const payment_id = metadata?.payment_id
  const amountCentavos = dataAttrs?.amount_due ?? dataAttrs?.amount ?? 0
  const amount = amountCentavos / 100

  console.log('[webhook] rfid_uid:', rfid_uid, '| payment_id:', payment_id, '| amount:', amount)

  if (!rfid_uid) {
    console.error('[webhook] no rfid_uid in metadata')
    return NextResponse.json({ error: 'Missing rfid_uid' }, { status: 400 })
  }

  if (!amount || amount <= 0) {
    console.log('[webhook] skipping — amount is 0 or missing')
    return NextResponse.json({ received: true })
  }

  if (!payment_id) {
    console.error('[webhook] no payment_id — cannot deduplicate')
    return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const cleanUid = rfid_uid.replace(/:/g, '').toUpperCase()

  // Atomic dedup via DB function — marks payment paid only if still pending,
  // so two simultaneous webhook calls cannot both process the same payment
  const { data: result, error: rpcErr } = await supabaseAdmin
    .rpc('process_topup', {
      p_payment_id: payment_id,
      p_rfid_uid: cleanUid,
      p_amount: amount,
    })

  console.log('[webhook] process_topup result:', result, '| error:', rpcErr)

  if (rpcErr) {
    console.error('[webhook] process_topup error:', rpcErr)
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  if (result === 'duplicate') {
    console.log('[webhook] duplicate webhook — skipping')
    return NextResponse.json({ received: true })
  }

  // Fetch updated balance for MQTT notification
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('rfid_uid', cleanUid)
    .single()

  const newBalance = Number(user?.balance ?? 0)

  // Notify ESP32 about the top-up so it shows on the LCD
  await mqttPublish(
    `rfid/${cleanUid}/balance`,
    JSON.stringify({ uid: cleanUid, amount })
  )

  console.log('[webhook] success — new balance:', newBalance)
  return NextResponse.json({ received: true })
}