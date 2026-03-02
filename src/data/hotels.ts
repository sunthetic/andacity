export const HOTELS: Hotel[] = [
  {
    slug: 'harborline-suites-miami',
    name: 'Harborline Suites',
    destinationSlug: 'miami',
    city: 'Miami, FL',
    address: {
      street: '1200 Ocean Ave',
      locality: 'Miami Beach',
      region: 'FL',
      postalCode: '33139',
      country: 'US',
    },
    geo: { lat: 25.790654, lng: -80.130045 },
    rating: 4.6,
    reviewCount: 2841,
    stars: 4,
    amenities: ['Free Wi-Fi', 'Pool', 'Fitness center', 'Air conditioning', '24-hour front desk'],
    images: ['/img/demo/hotel-1.jpg', '/img/demo/hotel-2.jpg', '/img/demo/hotel-3.jpg', '/img/demo/hotel-4.jpg'],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation available on select rates. Check the rate rules before booking.',
      payment: 'Pay now or pay later options may be available depending on rate.',
      fees: 'Some properties may charge resort fees. Always review total price breakdown.',
    },
    rooms: [
      {
        id: 'king-city',
        name: 'King Room · City View',
        beds: '1 king',
        sleeps: 2,
        refundability: 'Free cancellation',
        priceNightlyFrom: 219,
        currency: 'USD',
        inclusions: ['Wi-Fi included'],
      },
      {
        id: 'queen-2',
        name: 'Two Queens · Partial Ocean',
        beds: '2 queens',
        sleeps: 4,
        refundability: 'Non-refundable',
        priceNightlyFrom: 189,
        currency: 'USD',
        inclusions: ['Wi-Fi included'],
      },
      {
        id: 'suite',
        name: 'Suite · Ocean View',
        beds: '1 king + sofa bed',
        sleeps: 4,
        refundability: 'Free cancellation',
        priceNightlyFrom: 289,
        currency: 'USD',
        inclusions: ['Breakfast available', 'Wi-Fi included'],
      },
    ],
    faq: [
      { q: 'Does this hotel include parking?', a: 'Parking availability and pricing vary. Confirm during booking before you pay.' },
      { q: 'Are resort fees included in the nightly price?', a: 'Not always. Compare totals and review fee line items before booking.' },
      { q: 'Can I cancel for free?', a: 'Some rates allow free cancellation, others do not. Check the rate rules for the room you choose.' },
    ],
  },
]

export const HOTELS_BY_SLUG: Record<string, Hotel> = Object.fromEntries(
  HOTELS.map((h) => [h.slug, h])
) as Record<string, Hotel>

/* -----------------------------
   Types
----------------------------- */

export type Hotel = {
  slug: string
  name: string
  destinationSlug: string
  city: string
  address: {
    street: string
    locality: string
    region: string
    postalCode: string
    country: string
  }
  geo: { lat: number; lng: number }
  rating: number
  reviewCount: number
  stars: number
  amenities: string[]
  images: string[]
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    payment: string
    fees: string
  }
  rooms: HotelRoom[]
  faq: { q: string; a: string }[]
}

export type HotelRoom = {
  id: string
  name: string
  beds: string
  sleeps: number
  refundability: 'Free cancellation' | 'Non-refundable' | 'Partial refund'
  priceNightlyFrom: number
  currency: string
  inclusions: string[]
}
