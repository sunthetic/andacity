import { component$, useStyles$ } from '@builder.io/qwik'
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city'
import { RouterHead } from './routes/router-head'
import { PageView } from '~/components/analytics/PageView'
import globalCss from '~/styles/global.css?inline'
import poppinsStyles from '@fontsource/poppins?inline'
import lexendStyles from '@fontsource-variable/lexend?inline'

export default component$(() => {
  useStyles$(poppinsStyles)
  useStyles$(lexendStyles)
  useStyles$(globalCss)

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#2563EB" />
        {/* Apply stored theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML="(function(){try{var t=localStorage.getItem('andacity-theme');if(t&&t!=='b1')document.documentElement.dataset.theme=t;}catch(e){}})();" />
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
