export const DESTINATIONS: Destination[] = [
  {
    slug: 'miami',
    name: 'Miami',
    query: 'Miami, FL',
    airportCode: 'MIA',
    priceFrom: 129,
    bestFor: ['Beach', 'Nightlife', 'Food'],
    neighborhoods: [
      { slug: 'south-beach', name: 'South Beach', blurb: 'Iconic beach scene, walkable, high energy' },
      { slug: 'downtown', name: 'Downtown', blurb: 'Convenient transit, dining, modern hotels' },
      { slug: 'wynwood', name: 'Wynwood', blurb: 'Art district, boutique stays, creative vibe' },
      { slug: 'coconut-grove', name: 'Coconut Grove', blurb: 'Quieter, leafy, great for longer stays' },
    ],
    faq: [
      { q: 'Where should I stay in Miami?', a: 'South Beach for walkability and energy, Downtown for convenience, Wynwood for boutique vibes.' },
      { q: 'When is Miami most expensive?', a: 'Peak season is typically winter through early spring. Prices rise around holidays and major events.' },
      { q: 'Do most Miami hotels require a resort fee?', a: 'Many do. Always compare total price and check the fee breakdown before booking.' },
    ],
  },
  {
    slug: 'san-diego',
    name: 'San Diego',
    query: 'San Diego, CA',
    airportCode: 'SAN',
    priceFrom: 149,
    bestFor: ['Waterfront', 'Family', 'Outdoor'],
    neighborhoods: [
      { slug: 'gaslamp', name: 'Gaslamp Quarter', blurb: 'Central, nightlife, easy access to dining' },
      { slug: 'la-jolla', name: 'La Jolla', blurb: 'Scenic coast, quieter, premium stays' },
      { slug: 'mission-beach', name: 'Mission Beach', blurb: 'Beachfront fun, lively boardwalk' },
      { slug: 'little-italy', name: 'Little Italy', blurb: 'Food-centric, walkable, charming' },
    ],
    faq: [
      { q: 'What’s the best area to stay in San Diego?', a: 'Gaslamp for central access, La Jolla for coastal calm, Mission Beach for beachfront energy.' },
      { q: 'Do I need a car?', a: 'Not always. Many areas are walkable, but a car helps if you plan to explore beaches and neighborhoods.' },
      { q: 'What should I compare when booking?', a: 'Compare total price, cancellation policy, and parking/resort fees if applicable.' },
    ],
  },
]

export const DESTINATIONS_BY_SLUG: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.slug, d])
) as Record<string, Destination>

/* -----------------------------
   Types
----------------------------- */

export type Destination = {
  slug: string
  name: string
  query: string
  airportCode: string
  priceFrom: number
  bestFor: string[]
  neighborhoods: { slug: string; name: string; blurb: string }[]
  faq: { q: string; a: string }[]
}
