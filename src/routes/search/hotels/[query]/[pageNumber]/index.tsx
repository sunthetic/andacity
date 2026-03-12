import type { RequestHandler } from '@builder.io/qwik-city'
import { buildHotelsSrpPath, isIsoDate, normalizeCitySlug } from '~/lib/search/hotels/canonical'

export const onGet: RequestHandler = async ({ params, url, redirect }) => {
  const citySlug = normalizeCitySlug(String(params.query || ''))
  const page = Number.parseInt(String(params.pageNumber || '1'), 10)
  const checkIn = String(url.searchParams.get('checkIn') || '').trim()
  const checkOut = String(url.searchParams.get('checkOut') || '').trim()

  if (citySlug && isIsoDate(checkIn) && isIsoDate(checkOut)) {
    const canonicalPath = buildHotelsSrpPath({
      citySlug,
      checkIn: checkIn,
      checkOut: checkOut,
      pageNumber: page,
    })

    if (canonicalPath) {
      const sp = new URLSearchParams(url.searchParams)
      sp.delete('checkIn')
      sp.delete('checkOut')
      const qs = sp.toString()
      throw redirect(301, qs ? `${canonicalPath}?${qs}` : canonicalPath)
    }
  }

  throw redirect(302, citySlug ? `/hotels/in/${encodeURIComponent(citySlug)}` : '/hotels')
}
