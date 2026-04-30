import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const uid = params.get('uid')?.replace(/:/g, '').toUpperCase()

  if (!uid) return new Response('NO UID', { status: 400 })

  // Get user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('rfid_uid', uid)
    .single()

  if (!user) {
    await supabaseAdmin.from('transactions').insert({ rfid_uid: uid, status: 'NOT FOUND', amount: 0, balance_after: 0 })
    return new Response('NOT FOUND', { status: 200 })
  }

  // Get fare from settings
  const { data: settings } = await supabaseAdmin.from('settings').select('fare').eq('id', 1).single()
  let fare = Number(settings?.fare ?? 10)

  // Discount for students
  if (user.type === 'Student') {
    fare = Math.max(0, fare - 5)
  }

  const balance = Number(user.balance)

  if (balance >= fare) {
    const newBalance = balance - fare

    await supabaseAdmin.from('users').update({ balance: newBalance }).eq('rfid_uid', uid)
    await supabaseAdmin.from('transactions').insert({ rfid_uid: uid, status: 'APPROVED', amount: fare, balance_after: newBalance })

    return new Response(`APPROVED|${newBalance}`, { status: 200 })
  } else {
    await supabaseAdmin.from('transactions').insert({ rfid_uid: uid, status: 'INSUFFICIENT', amount: 0, balance_after: balance })
    return new Response(`INSUFFICIENT|${balance}`, { status: 200 })
  }
}
