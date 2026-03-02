import { createHmac, timingSafeEqual } from 'node:crypto'

export const getOgSecret = () => {
  const secret = (globalThis as any)?.process?.env?.OG_SIGNING_SECRET as string | undefined
  return secret && secret.trim().length >= 24 ? secret.trim() : null
}

export const encodeOgPayload = (payload: unknown) => {
  const json = JSON.stringify(payload)
  return base64UrlEncode(Buffer.from(json, 'utf8'))
}

export const decodeOgPayload = <T>(encoded: string): T | null => {
  try {
    const buf = base64UrlDecode(encoded)
    return JSON.parse(buf.toString('utf8')) as T
  } catch {
    return null
  }
}

export const signOgPayload = (encodedPayload: string, secret: string) => {
  const sig = createHmac('sha256', secret).update(encodedPayload).digest()
  return base64UrlEncode(sig)
}

export const verifyOgSignature = (encodedPayload: string, sig: string, secret: string) => {
  try {
    const expected = base64UrlDecode(signOgPayload(encodedPayload, secret))
    const actual = base64UrlDecode(sig)
    if (expected.length !== actual.length) return false
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

const base64UrlEncode = (buf: Buffer) =>
  buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')

const base64UrlDecode = (s: string) => {
  const padLen = (4 - (s.length % 4)) % 4
  const padded = s + '='.repeat(padLen)
  const b64 = padded.replaceAll('-', '+').replaceAll('_', '/')
  return Buffer.from(b64, 'base64')
}
