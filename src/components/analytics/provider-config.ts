// Analytics provider constants baked at build time from PUBLIC_* env vars.
// Set PUBLIC_ANALYTICS_PROVIDER in the build environment to activate a provider.
// Supported values: 'cloudflare' | 'ga4' | '' (no provider — default)
export const ANALYTICS_PROVIDER = (
  import.meta.env.PUBLIC_ANALYTICS_PROVIDER || ''
).toLowerCase().trim() as 'cloudflare' | 'ga4' | ''

export const CF_TOKEN = (
  import.meta.env.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN || ''
).trim()

export const GA_ID = (
  import.meta.env.PUBLIC_GA_MEASUREMENT_ID || ''
).trim()
