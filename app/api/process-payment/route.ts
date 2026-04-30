import { NextRequest, NextResponse } from 'next/server'
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
 * ESP32 still receives the pipe-delimited string it expects:
 *   APPROVED|<newBalance>
 *   INSUFFICIENT|<currentBalance>
 *   INVALID
 *
 * Dashboard receives JSON:
 *   { status, name, type, amount, balance_after }
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)

  // UID arrives either as  "AA:BB:CC:DD"  or  "AABBCCDD" — normalise to no-colon uppercase
  const rawUid = params.get('uid') ?? ''
  const uid = rawUid.replace(/:/g, '').toUpperCase()

  if (!uid) return NextResponse.json({ error: 'NO UID' }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()

  // ── Lookup user ─────────────────────────────────────────────────────────────
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('rfid_uid', uid)
    .single()

  if (!user) {
    await supabaseAdmin
      .from('transactions')
      .insert({ rfid_uid: uid, status: 'NOT FOUND', amount: 0, balance_after: 0 })

    await mqttPublish(`rfid/${uid}/result`, 'INVALID')
    return NextResponse.json({ status: 'NOT FOUND', name: 'Unknown Card', type: '—', amount: 0, balance_after: 0 })
  }

  // ── Fare calculation ────────────────────────────────────────────────────────
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('fare')
    .eq('id', 1)
    .single()

  let fare = Number(settings?.fare ?? 10)
  if (user.type === 'Student') fare = Math.max(0, fare - 5)

  const balance = Number(user.balance)

  // ── Process ─────────────────────────────────────────────────────────────────
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

    await mqttPublish(`rfid/${uid}/result`, `APPROVED|${newBalance}`)

    return NextResponse.json({
      status: 'APPROVED',
      name: user.name,
      type: user.type,
      amount: fare,
      balance_after: newBalance,
    })

  } else {
    await supabaseAdmin.from('transactions').insert({
      rfid_uid: uid,
      status: 'INSUFFICIENT',
      amount: 0,
      balance_after: balance,
    })

    await mqttPublish(`rfid/${uid}/result`, `INSUFFICIENT|${balance}`)

    return NextResponse.json({
      status: 'INSUFFICIENT',
      name: user.name,
      type: user.type,
      amount: 0,
      balance_after: balance,
    })
  }
}
