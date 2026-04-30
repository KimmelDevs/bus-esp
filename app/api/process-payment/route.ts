import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { mqttPublish } from '@/lib/mqtt-publish'

/**
 * ESP32 flow:
 *  1. ESP scans card → publishes UID to  esp/rfid/scan
 *  2. Web dashboard picks that up via useMqttScan, calls this endpoint
 *  3. This endpoint processes payment, then publishes result back to
 *       rfid/<uid_no_colons>/result
 *  4. ESP32 is already subscribed to that topic and handles door/LCD/buzzer
 *
 * Result format the ESP32 expects:
 *   APPROVED|<newBalance>
 *   INSUFFICIENT|<currentBalance>
 *   INVALID
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)

  // UID arrives either as  "AA:BB:CC:DD"  or  "AABBCCDD" — normalise to no-colon uppercase
  const rawUid = params.get('uid') ?? ''
  const uid = rawUid.replace(/:/g, '').toUpperCase()

  if (!uid) return new Response('NO UID', { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()

  // ── Lookup user ────────────────────────────────────────────────────────────
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('rfid_uid', uid)
    .single()

  if (!user) {
    await supabaseAdmin
      .from('transactions')
      .insert({ rfid_uid: uid, status: 'NOT FOUND', amount: 0, balance_after: 0 })

    // Tell the ESP32 this card is unknown
    await mqttPublish(`rfid/${uid}/result`, 'INVALID')
    return new Response('NOT FOUND', { status: 200 })
  }

  // ── Fare calculation ───────────────────────────────────────────────────────
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('fare')
    .eq('id', 1)
    .single()

  let fare = Number(settings?.fare ?? 10)
  if (user.type === 'Student') fare = Math.max(0, fare - 5)

  const balance = Number(user.balance)

  // ── Process ────────────────────────────────────────────────────────────────
  if (balance >= fare) {
    const newBalance = balance - fare

    await Promise.all([
      supabaseAdmin.from('users').update({ balance: newBalance }).eq('rfid_uid', uid),
      supabaseAdmin.from('transactions').insert({
        rfid_uid: uid,
        status: 'APPROVED',
        amount: fare,
        balance_after: newBalance,
      }),
    ])

    // ✅ Tell ESP32: open door, show balance on LCD
    await mqttPublish(`rfid/${uid}/result`, `APPROVED|${newBalance}`)

    return new Response(`APPROVED|${newBalance}`, { status: 200 })

  } else {
    await supabaseAdmin.from('transactions').insert({
      rfid_uid: uid,
      status: 'INSUFFICIENT',
      amount: 0,
      balance_after: balance,
    })

    // ⚠️ Tell ESP32: keep door closed, show NO BALANCE
    await mqttPublish(`rfid/${uid}/result`, `INSUFFICIENT|${balance}`)

    return new Response(`INSUFFICIENT|${balance}`, { status: 200 })
  }
}
