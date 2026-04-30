const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY!
const BASE_URL = 'https://api.paymongo.com/v1'

function authHeader() {
  return 'Basic ' + Buffer.from(`${PAYMONGO_SECRET}:`).toString('base64')
}

export async function createCheckoutSession({ amount, rfidUid, paymentId }: { amount: number; rfidUid: string; paymentId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const res = await fetch(`${BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [{ name: 'RFID Top-up', amount: Math.round(amount * 100), currency: 'PHP', quantity: 1, description: 'Wallet load for Bus RFID system' }],
          payment_method_types: ['gcash'],
          success_url: `${appUrl}/topup/success?payment_id=${paymentId}`,
          cancel_url: `${appUrl}/topup/failed?payment_id=${paymentId}`,
          metadata: { rfid_uid: rfidUid, payment_id: paymentId },
        },
      },
    }),
  })
  return res.json()
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string, webhookSecret: string): boolean {
  const parts: Record<string, string> = {}
  signatureHeader.split(',').forEach((part) => { const [k, v] = part.split('='); parts[k] = v })
  const { t, te } = parts
  const crypto = require('crypto')
  const computed = crypto.createHmac('sha256', webhookSecret).update(`${t}.${rawBody}`).digest('hex')
  return computed === te
}
