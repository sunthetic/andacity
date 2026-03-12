import type { RequestHandler } from '@builder.io/qwik-city'
import { initializeServerRuntimeEnv } from '~/lib/server/runtime-env.server'

export const onRequest: RequestHandler = ({ env }) => {
  initializeServerRuntimeEnv(env)
}
