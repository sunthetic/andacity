// src/lib/seo/og-sign.ts
import { getServerRuntimeEnvValue } from '~/lib/server/runtime-env.server'

const te = new TextEncoder()

export const getOgSecret = () => {
  const secret = getServerRuntimeEnvValue('OG_SIGNING_SECRET')
  return secret && secret.trim().length ? secret : null
}

export const encodeOgPayload = (payload: unknown) => {
  const json = JSON.stringify(payload)
  return base64UrlEncode(te.encode(json))
}

export const decodeOgPayload = <T = unknown>(p: string): T | null => {
  try {
    const bytes = base64UrlDecode(p)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

// Returns base64url signature
export const signOgPayload = async (p: string, secret: string) => {
  const key = await importHmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(p))
  return base64UrlEncode(new Uint8Array(sig))
}

export const verifyOgSignature = async (p: string, sig: string, secret: string) => {
  try {
    const key = await importHmacKey(secret)
    const sigBytes = base64UrlDecode(sig)
    return await crypto.subtle.verify('HMAC', key, sigBytes, te.encode(p))
  } catch {
    return false
  }
}

const importHmacKey = async (secret: string) => {
  return await crypto.subtle.importKey(
    'raw',
    te.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

const base64UrlEncode = (bytes: Uint8Array) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const b64 = btoa(bin)
  return b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const base64UrlDecode = (b64url: string) => {
  const b64 = b64url.replaceAll('-', '+').replaceAll('_', '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
