import { RequestEvent, RequestHandler } from "@builder.io/qwik-city"

export const onGet: RequestHandler = async ({ params, redirect }) => {
  const { vertical, query, pageNumber } = params
  throw redirect(302, `/search/${vertical}/${query}/1`)
}