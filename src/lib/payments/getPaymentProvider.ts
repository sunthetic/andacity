import { getServerRuntimeEnvValue } from '~/lib/server/runtime-env.server'
import type { PaymentProvider } from '~/types/payment'

export const getPaymentProvider = (): PaymentProvider => {
  const configured = String(getServerRuntimeEnvValue('PAYMENT_PROVIDER') || 'stripe')
    .trim()
    .toLowerCase()

  if (configured === 'stripe') return 'stripe'
  throw new Error(`Unsupported payment provider "${configured || '(empty)'}".`)
}
