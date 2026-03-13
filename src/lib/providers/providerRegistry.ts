import { DEFAULT_PROVIDER_ADAPTERS } from '~/lib/providers/defaultProviderAdapters'
import type { ProviderAdapter } from '~/lib/providers/providerAdapter'

const providers: Record<string, ProviderAdapter> = {}

const normalizeProviderKey = (provider: string) => String(provider || '').trim().toLowerCase()

export function registerProvider(adapter: ProviderAdapter) {
  const key = normalizeProviderKey(adapter.provider)
  if (!key) return
  providers[key] = adapter
}

export function getProvider(provider: string): ProviderAdapter | null {
  const key = normalizeProviderKey(provider)
  if (!key) return null
  return providers[key] ?? null
}

export function listProviders(): ProviderAdapter[] {
  return Object.values(providers)
}

export function clearProviderRegistry() {
  for (const key of Object.keys(providers)) {
    delete providers[key]
  }
}

export function resetProviderRegistry() {
  clearProviderRegistry()

  for (const adapter of DEFAULT_PROVIDER_ADAPTERS) {
    registerProvider(adapter)
  }
}

resetProviderRegistry()
