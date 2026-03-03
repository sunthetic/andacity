import { component$, Slot } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set('x-robots-tag', 'noindex, follow')
}

export default component$(() => <Slot />)
