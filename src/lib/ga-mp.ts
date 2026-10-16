import { logger } from '@/lib/logger'

// GA4 Measurement Protocol, server-side `purchase`. Only called when the
// checkout carried a GA client id, which the browser reads from the `_ga`
// cookie and which exists only after the visitor granted analytics consent.
export type GaPurchase = {
  clientId: string
  transactionId: string
  plan: string
  value: number
  currency: string
}

export async function sendGaPurchase(purchase: GaPurchase): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID
  const apiSecret = process.env.GA4_MP_API_SECRET
  if (!measurementId || !apiSecret) return

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        client_id: purchase.clientId,
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: purchase.transactionId,
              value: purchase.value,
              currency: purchase.currency,
              plan: purchase.plan,
              engagement_time_msec: 1,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      logger.warn('GA4 purchase send failed', { source: 'sendGaPurchase', status: response.status })
    }
  } catch (error) {
    logger.warn('GA4 purchase send threw', {
      source: 'sendGaPurchase',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
