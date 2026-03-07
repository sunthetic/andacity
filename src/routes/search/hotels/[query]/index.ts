import { RequestHandler } from "@builder.io/qwik-city"

export const onGet: RequestHandler = async ({ params, redirect }) => {
  const { query } = params
  throw redirect(302, `/search/hotels/${query}/1`)
}