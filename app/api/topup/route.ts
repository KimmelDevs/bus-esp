import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/paymongo'

export async function POST(req: NextRequest) {
  const { rfid_uid, amount } = await req.json()
  if (!rfid_uid || !amount || amount <= 0) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()
  const cleanUid = rfid_uid.replace(/:/g, '').toUpperCase()
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('rfid_uid', cleanUid).single()
  if (!user) return NextResponse.json({ error: 'RFID not found in system' }, { status: 404 })

  const { data: payment, error } = await supabaseAdmin.from('payments').insert({ rfid_uid: cleanUid, amount, status: 'pending' }).select().single()
  if (error || !payment) return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })

  const response = await createCheckoutSession({ amount, rfidUid: cleanUid, paymentId: payment.id })
  const checkoutUrl = response?.data?.attributes?.checkout_url
  if (!checkoutUrl) return NextResponse.json({ error: 'PayMongo error', details: response }, { status: 500 })

  return NextResponse.json({ checkout_url: checkoutUrl })
}
