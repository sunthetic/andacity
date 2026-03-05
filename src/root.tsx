import { component$, useStyles$ } from '@builder.io/qwik'
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city'
import { RouterHead } from './routes/router-head'
import { PageView } from '~/components/analytics/PageView'
import globalCss from './styles/global.css?inline'

import openSansStyles from '@fontsource-variable/open-sans?inline'
import nunitoSansStyles from '@fontsource-variable/nunito-sans?inline'
import notoSansStyles from '@fontsource-variable/noto-sans?inline'
import barlowStyles from '@fontsource/barlow?inline'
import googleSansStyles from '@fontsource-variable/google-sans?inline'

export default component$(() => {
  useStyles$(openSansStyles)
  useStyles$(nunitoSansStyles)
  useStyles$(notoSansStyles)
  useStyles$(barlowStyles)
  useStyles$(googleSansStyles)
  useStyles$(globalCss)

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#2563EB" />
        <RouterHead />
        <PageView />
      </head>
      <body lang="en">
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  )
})
