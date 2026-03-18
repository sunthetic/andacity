import { getPaymentProviderConfig } from '~/lib/payments/getPaymentProviderConfig'
import type { PaymentIntentStatus } from '~/types/payment'

type StripeLikeResponse = {
  id?: string
  status?: string
  client_secret?: string | null
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
  last_payment_error?: {
    message?: string
  } | null
  error?: {
    message?: string
  } | null
}

const toPaymentIntentStatus = (value: unknown): PaymentIntentStatus => {
  switch (value) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'processing':
    case 'requires_capture':
    case 'succeeded':
    case 'canceled':
      return value
    default:
      return 'failed'
  }
}

const readErrorMessage = (payload: StripeLikeResponse) => {
  return (
    String(payload.error?.message || '').trim() ||
    String(payload.last_payment_error?.message || '').trim() ||
    ''
  )
}

const toUrlEncoded = (values: Record<string, string | number | boolean | null | undefined>) => {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue
    body.set(key, String(value))
  }
  return body
}

export const stripeRequest = async (
  path: string,
  init: {
    method?: 'GET' | 'POST'
    body?: URLSearchParams
  } = {},
): Promise<StripeLikeResponse> => {
  const config = getPaymentProviderConfig('stripe')
  const response = await fetch(`${config.apiBase}${path}`, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      ...(init.body
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : {}),
    },
    body: init.body ? init.body.toString() : undefined,
  })

  const payload = (await response.json().catch(() => ({}))) as StripeLikeResponse
  if (!response.ok) {
    const message = readErrorMessage(payload)
    throw new Error(message || `Stripe request failed with ${response.status}.`)
  }

  return payload
}

export const mapStripeIntentResponse = (payload: StripeLikeResponse) => {
  const providerPaymentIntentId = String(payload.id || '').trim()
  if (!providerPaymentIntentId) {
    throw new Error('Stripe did not return a payment intent id.')
  }

  const amount = Number(payload.amount)
  const currency = String(payload.currency || '')
    .trim()
    .toUpperCase()
  if (!Number.isFinite(amount) || amount < 0 || !currency) {
    throw new Error('Stripe returned an invalid payment intent payload.')
  }

  return {
    provider: 'stripe' as const,
    providerPaymentIntentId,
    status: toPaymentIntentStatus(payload.status),
    clientSecret:
      typeof payload.client_secret === 'string' && payload.client_secret.trim()
        ? payload.client_secret
        : null,
    amount: Math.round(amount),
    currency,
    metadata: payload.metadata || null,
  }
}

export const buildStripeIntentBody = (input: {
  amount: number
  currency: string
  checkoutSessionId: string
  metadata?: Record<string, string>
}) => {
  const body = toUrlEncoded({
    amount: input.amount,
    currency: input.currency.toLowerCase(),
    'automatic_payment_methods[enabled]': true,
    'metadata[checkout_session_id]': input.checkoutSessionId,
  })

  for (const [key, value] of Object.entries(input.metadata || {})) {
    body.set(`metadata[${key}]`, value)
  }

  return body
}
