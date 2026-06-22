import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = ({ headers, send }) => {
  headers.set('Content-Type', 'application/json')
  headers.set('Cache-Control', 'no-store')
  send(200, JSON.stringify({ ok: true }))
}
