import { getServerRuntimeEnvValue } from '~/lib/server/runtime-env.server'
import type { PaymentProvider } from '~/types/payment'

export type StripePaymentProviderConfig = {
  provider: 'stripe'
  secretKey: string
  apiBase: string
  publishableKey: string | null
}

export const getPaymentProviderConfig = (
  provider: PaymentProvider,
): StripePaymentProviderConfig => {
  if (provider !== 'stripe') {
    throw new Error(`Payment provider "${provider}" is not supported.`)
  }

  const secretKey = String(getServerRuntimeEnvValue('STRIPE_SECRET_KEY') || '').trim()
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  const apiBase = String(
    getServerRuntimeEnvValue('STRIPE_API_BASE') || 'https://api.stripe.com',
  ).trim()
  const publishableKey = String(
    getServerRuntimeEnvValue('PUBLIC_STRIPE_PUBLISHABLE_KEY') ||
      getServerRuntimeEnvValue('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') ||
      '',
  ).trim()

  return {
    provider: 'stripe',
    secretKey,
    apiBase: apiBase || 'https://api.stripe.com',
    publishableKey: publishableKey || null,
  }
}
