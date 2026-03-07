export const CAR_RENTALS: CarRental[] = [
  {
    slug: 'suncoast-compact-mco',
    name: 'Suncoast Rentals',
    city: 'Orlando',
    region: 'FL',
    country: 'US',
    cityQuery: 'orlando',
    pickupArea: 'MCO Airport',
    pickupAddressLine: '1 Jeff Fuqua Blvd',
    currency: 'USD',
    rating: 4.5,
    reviewCount: 3921,
    fromDaily: 39,
    summary:
      'Fast airport pickup with clean cars and transparent totals. Clear cancellation rules, upfront inclusions, and simple upgrades.',
    images: ['/img/demo/car-1.jpg', '/img/demo/car-2.jpg', '/img/demo/car-3.jpg'],
    inclusions: [
      'Unlimited mileage',
      'Collision damage waiver options',
      'Airport pickup',
      'Free additional driver (select offers)',
      'Mobile check-in',
      '24/7 roadside assistance (select offers)',
      'Flexible fuel policy',
    ],
    policies: {
      freeCancellation: true,
      payAtCounter: true,
      securityDepositRequired: true,
      minDriverAge: 21,
      fuelPolicy: 'Full-to-full',
      cancellationBlurb:
        'Many offers allow free cancellation until a cutoff time. Always review the offer policy before booking.',
      paymentBlurb:
        'Some offers are pay-at-counter. Others require prepayment. Your selection shows the exact payment schedule.',
      feesBlurb:
        'Taxes, surcharges, and optional extras vary by dates and pickup location. We show estimates early and confirm totals at checkout.',
      depositBlurb:
        'A refundable security deposit may be required at pickup, depending on supplier, car class, and payment method.',
    },
    offers: [
      {
        id: 'economy-auto',
        name: 'Economy (Automatic)',
        category: 'Economy',
        seats: 4,
        bags: '1 large + 1 small',
        transmission: 'Automatic',
        doors: 4,
        ac: true,
        priceFrom: 39,
        freeCancellation: true,
        payAtCounter: true,
        badges: ['Best value'],
        features: ['Unlimited mileage', 'Airport pickup', 'Fuel: full-to-full'],
      },
      {
        id: 'compact-auto',
        name: 'Compact (Automatic)',
        category: 'Compact',
        seats: 5,
        bags: '1 large + 2 small',
        transmission: 'Automatic',
        doors: 4,
        ac: true,
        priceFrom: 49,
        freeCancellation: true,
        payAtCounter: false,
        badges: ['Top pick'],
        features: ['Unlimited mileage', 'Mobile check-in', 'Fuel: full-to-full'],
      },
      {
        id: 'suv-midsize',
        name: 'Midsize SUV',
        category: 'SUV',
        seats: 5,
        bags: '2 large + 1 small',
        transmission: 'Automatic',
        doors: 4,
        ac: true,
        priceFrom: 79,
        freeCancellation: false,
        payAtCounter: false,
        badges: ['Premium'],
        features: ['Higher clearance', 'Great for families', 'Fuel: full-to-full'],
      },
    ],
    faq: [
      {
        q: 'Is free cancellation available?',
        a: 'Many offers include free cancellation until a cutoff time. Always check the selected offer’s cancellation terms.',
      },
      {
        q: 'Do I pay now or at pickup?',
        a: 'Both options exist depending on the offer. Your selection will show the exact payment schedule.',
      },
      {
        q: 'Is a deposit required?',
        a: 'Often, yes. The supplier may require a refundable deposit at pickup based on car class and payment method.',
      },
    ],
  },
]

export const CAR_RENTALS_BY_SLUG = Object.fromEntries(CAR_RENTALS.map((c) => [c.slug, c])) as Record<
  string,
  CarRental
>

export const getCarRentalBySlug = (slug: string) => {
  const key = String(slug || '').trim().toLowerCase()
  return CAR_RENTALS_BY_SLUG[key] || null
}

/* -----------------------------
   Types
----------------------------- */

export type CarRentalPolicy = {
  freeCancellation: boolean
  payAtCounter: boolean
  securityDepositRequired: boolean
  minDriverAge: number
  fuelPolicy: string
  cancellationBlurb: string
  paymentBlurb: string
  feesBlurb: string
  depositBlurb: string
}

export type CarOffer = {
  id: string
  name: string
  category: string
  seats: number
  bags: string
  transmission: 'Automatic' | 'Manual'
  doors: 2 | 3 | 4 | 5
  ac: boolean
  priceFrom: number
  freeCancellation: boolean
  payAtCounter: boolean
  badges: string[]
  features: string[]
}

export type FAQ = {
  q: string
  a: string
}

export type CarRental = {
  slug: string
  name: string
  city: string
  region: string
  country: string
  cityQuery: string
  pickupArea: string
  pickupAddressLine: string
  currency: string
  rating: number
  reviewCount: number
  fromDaily: number
  summary: string
  images: string[]
  inclusions: string[]
  policies: CarRentalPolicy
  offers: CarOffer[]
  faq: FAQ[]
}
