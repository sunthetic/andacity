import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ params, url, redirect }) => {
  const { query } = params
  const qs = url.searchParams.toString()
  const target = `/search/hotels/${query}/1`
  throw redirect(302, qs ? `${target}?${qs}` : target)
}
