import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ redirect, url }) => {
  const query = url.searchParams.toString()
  throw redirect(301, query ? `/car-rentals?${query}` : '/car-rentals')
}
