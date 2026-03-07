export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc' | 'reviewcount-desc'

export type ActiveFilters = {
  stars: number[]
  neighborhoods: string[]
  amenities: string[]
  refundableOnly: boolean
  ratingMin: number | null
  priceMin: number | null
  priceMax: number | null

  checkIn: string | null
  checkOut: string | null
  adults: number | null
  rooms: number | null
}

export type HotelResult = {
  id: string
  slug: string
  name: string
  neighborhood: string
  stars: 2 | 3 | 4 | 5
  rating: number
  reviewCount: number
  priceFrom: number
  currency: string
  refundable: boolean
  amenities: string[]
  image: string
  badges: string[]
  score: number
}

export type HotelResultCardProps = {
  h: HotelResult
  nights: number | null
}

export type MobileDrawerProps = {
  title: string
  onClose$: import('@builder.io/qwik').QRL<() => void>
}

export type Facets = {
  stars: Record<string, number>
  neighborhoods: { name: string; count: number }[]
  amenities: { name: string; count: number }[]
}

export type OgSearchPayload = {
  v: 'hotels'
  q: string
  page: number
  title?: string
  subtitle?: string
  stats?: {
    priceMin?: number
    priceMax?: number
    currency?: string
    topArea?: string
    note?: string
  }
}
