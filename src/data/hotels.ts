export const HOTELS: Hotel[] = [
  {
    slug: 'harborline-suites-miami',
    name: 'Harborline Suites',
    city: 'Miami',
    region: 'FL',
    country: 'US',
    cityQuery: 'miami',
    neighborhood: 'Waterfront',
    addressLine: '100 Bayside Ave',
    currency: 'USD',
    stars: 4,
    rating: 4.6,
    reviewCount: 2841,
    fromNightly: 219,
    summary:
      'Modern waterfront suites with fast check-in, bright rooms, and walkable access to dining. Designed for clean stays: clear policies, solid amenities, and transparent totals.',
    images: ['/img/demo/hotel-1.jpg', '/img/demo/hotel-2.jpg', '/img/demo/hotel-3.jpg'],
    amenities: [
      'Free Wi-Fi',
      'Pool',
      'Gym',
      'Breakfast available',
      'Parking',
      'Air conditioning',
      'Pet-friendly',
      '24h front desk',
      'Workspace',
      'Hot tub',
      'Laundry',
      'Restaurant',
    ],
    policies: {
      freeCancellation: true,
      payLater: true,
      noResortFees: false,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      cancellationBlurb:
        'Many rooms offer free cancellation until a cutoff time. Always review the room policy before booking.',
      paymentBlurb:
        'Some rooms support pay-later. Others require prepayment. Your selection will show the exact schedule.',
      feesBlurb:
        'Taxes and fees vary by dates and room. We show estimates early and confirm totals at checkout.',
    },
    rooms: [
      {
        id: 'studio-king',
        name: 'Studio King',
        sleeps: 2,
        beds: '1 king',
        sizeSqft: 320,
        priceFrom: 219,
        refundable: true,
        payLater: true,
        badges: ['Best value'],
        features: ['City view', 'Kitchenette', 'Work desk'],
      },
      {
        id: 'suite-1br',
        name: 'One Bedroom Suite',
        sleeps: 4,
        beds: '1 king + sofa',
        sizeSqft: 540,
        priceFrom: 289,
        refundable: true,
        payLater: false,
        badges: ['Top pick'],
        features: ['Separate living area', 'Water view', 'Balcony'],
      },
      {
        id: 'suite-premium',
        name: 'Premium Waterfront Suite',
        sleeps: 4,
        beds: '1 king + sofa',
        sizeSqft: 620,
        priceFrom: 349,
        refundable: false,
        payLater: false,
        badges: ['Premium'],
        features: ['Waterfront', 'Corner unit', 'Upgraded bath'],
      },
    ],
    faq: [
      { q: 'Is parking available?', a: 'Yes. Parking is available on-site. Fees may apply depending on dates.' },
      { q: 'Are pets allowed?', a: 'Many stays are pet-friendly. Specific rooms may have restrictions and fees.' },
      { q: 'Does this hotel have free cancellation?', a: 'Many room types do. Always check the selected room’s cancellation terms.' },
    ],
  },
]

export const HOTELS_BY_SLUG = Object.fromEntries(HOTELS.map((h) => [h.slug, h])) as Record<string, Hotel>

export const getHotelBySlug = (slug: string) => {
  const key = String(slug || '').trim().toLowerCase()
  return HOTELS_BY_SLUG[key] || null
}

/* -----------------------------
   Types
----------------------------- */

export type HotelPolicy = {
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  checkInTime: string
  checkOutTime: string
  cancellationBlurb: string
  paymentBlurb: string
  feesBlurb: string
}

export type Room = {
  id: string
  name: string
  sleeps: number
  beds: string
  sizeSqft: number
  priceFrom: number
  refundable: boolean
  payLater: boolean
  badges: string[]
  features: string[]
}

export type FAQ = {
  q: string
  a: string
}

export type Hotel = {
  slug: string
  name: string
  city: string
  region: string
  country: string
  cityQuery: string
  neighborhood: string
  addressLine: string
  currency: string
  stars: 2 | 3 | 4 | 5
  rating: number
  reviewCount: number
  fromNightly: number
  summary: string
  images: string[]
  amenities: string[]
  policies: HotelPolicy
  rooms: Room[]
  faq: FAQ[]
}