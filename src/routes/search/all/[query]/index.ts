import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = ({ params, redirect }) => {
  throw redirect(302, `/search/all/${encodeURIComponent(params.query)}/1`)
}
