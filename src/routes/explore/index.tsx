/**
 * CLAUDE-UI-022 — Production Explore page implementation.
 *
 * Approved direction from CLAUDE-UI-021 sample:
 * - Cinematic discovery hero (--ui-hero gradient, no image file)
 * - Sticky mood/theme filter bar (8 chips, replaces vibe-card grid)
 * - Editorial idea cards with --ui-hero gradient header bands
 * - Destination cards with city name overlaid on gradient header
 * - Guided mode: next steps promoted above the grid
 * - Default mode: next steps at bottom
 * - Whole-trip handoff panel at the bottom
 * - All filter URLs target /explore?theme=<key> etc.
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'

// ─── types ───────────────────────────────────────────────────────────────────

type ThemeKey =
  | 'beach'
  | 'mountains'
  | 'weekend-cities'
  | 'warm-weather'
  | 'luxury'
  | 'budget'
  | 'family'
  | 'solo'

type IdeaKey =
  | 'warm-places-in-march'
  | 'cheap-long-weekends'
  | 'scenic-coastal-drives'
  | 'city-breaks-with-easy-flights'
  | 'beach-trips-with-rental-flexibility'
  | 'quick-mountain-escapes'

type DestinationKey = 'miami' | 'las-vegas' | 'san-diego' | 'new-york' | 'denver' | 'honolulu'

type ExploreStep = {
  title: string
  description: string
  href: string
  cta: string
}

type RouteAction = {
  label: string
  href: string
}

type ThemeOption = {
  key: ThemeKey
  label: string
  contextBanner: string
  nextStepsIntro: string
  popularTitle: string
  popularDescription: string
  destinationSlugs: DestinationKey[]
  nextSteps: ExploreStep[]
}

type IdeaOption = {
  key: IdeaKey
  title: string
  description: string
  contextBanner: string
  nextStepsIntro: string
  popularTitle: string
  popularDescription: string
  destinationSlugs: DestinationKey[]
  nextSteps: ExploreStep[]
}

type DestinationOption = {
  key: DestinationKey
  name: string
  blurb: string
  primaryLink: RouteAction
  flightLink: RouteAction
  hotelLink: RouteAction
  carLink: RouteAction
  guideLink: RouteAction
}

type ExploreContext = {
  bannerText: string | null
  nextStepsIntro: string
  nextSteps: ExploreStep[]
  destinationPriority: DestinationKey[]
  popularTitle: string
  popularDescription: string
}

// ─── url helpers ─────────────────────────────────────────────────────────────

const buildFlightsToHref = (to: string) => {
  const toSlug = slugifyLocation(to) || 'anywhere'
  return buildFlightsSearchPath('anywhere', toSlug, 'round-trip', 1)
}
const buildHotelsDestinationHref = (destination: string) =>
  `/hotels?destination=${encodeURIComponent(destination)}`
const buildCarRentalsDestinationHref = (destination: string) =>
  `/car-rentals?q=${encodeURIComponent(destination)}`

const buildExploreHref = (params: {
  theme?: ThemeKey | null
  idea?: IdeaKey | null
  destination?: DestinationKey | null
}) => {
  const sp = new URLSearchParams()
  if (params.theme) sp.set('theme', params.theme)
  if (params.idea) sp.set('idea', params.idea)
  if (params.destination) sp.set('destination', params.destination)
  const q = sp.toString()
  return q ? `/explore?${q}` : '/explore'
}

// ─── themes (8) ──────────────────────────────────────────────────────────────

const VIBE_ITEMS: ThemeOption[] = [
  {
    key: 'beach',
    label: 'Beach escapes',
    contextBanner: 'Showing beach-inspired trip ideas',
    nextStepsIntro:
      'Take this beach theme into real booking paths across flights, stays, and car rentals.',
    popularTitle: 'Popular destinations for beach escapes',
    popularDescription:
      'Start with beach-forward cities, then move directly into flights, hotels, and car rentals.',
    destinationSlugs: ['miami', 'san-diego', 'honolulu'],
    nextSteps: [
      {
        title: 'Miami flights',
        description: 'Search flights for a beach-first city with strong nonstop options.',
        href: buildFlightsToHref('Miami'),
        cta: 'Search flights',
      },
      {
        title: 'Miami hotels',
        description: 'Browse stays in a beach-forward city with flexible booking options.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'San Diego hotels',
        description: 'Compare coastal stays in a mild-weather city with flexible timing.',
        href: buildHotelsDestinationHref('San Diego'),
        cta: 'View hotels',
      },
      {
        title: 'Honolulu hotels',
        description: 'Explore warm-weather island stays and compare nightly price bands.',
        href: buildHotelsDestinationHref('Honolulu'),
        cta: 'View hotels',
      },
    ],
  },
  {
    key: 'mountains',
    label: 'Mountain getaways',
    contextBanner: 'Showing mountain-inspired trip ideas',
    nextStepsIntro:
      'Start with mountain-friendly routes and continue into stay and transport planning.',
    popularTitle: 'Popular destinations for mountain getaways',
    popularDescription:
      'Prioritizing cities that pair well with short mountain escapes and flexible planning.',
    destinationSlugs: ['denver', 'san-diego', 'las-vegas'],
    nextSteps: [
      {
        title: 'Flights to Denver',
        description: 'Check fast air access for quick mountain basecamp planning.',
        href: buildFlightsToHref('Denver'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare hotel options near mountain access points and transit.',
        href: buildHotelsDestinationHref('Denver'),
        cta: 'Browse hotels',
      },
      {
        title: 'Car rentals in Denver',
        description: 'Add flexible ground transport for trailheads and nearby towns.',
        href: buildCarRentalsDestinationHref('Denver'),
        cta: 'Search rentals',
      },
      {
        title: 'Quick mountain escapes',
        description: 'Move into a pre-filtered mountain idea flow for shorter trip windows.',
        href: '/explore?idea=quick-mountain-escapes',
        cta: 'Explore idea',
      },
    ],
  },
  {
    key: 'weekend-cities',
    label: 'Weekend cities',
    contextBanner: 'Showing weekend-city trip ideas',
    nextStepsIntro:
      'Use city-break routes with low-friction flight, stay, and local mobility options.',
    popularTitle: 'Popular destinations for weekend city breaks',
    popularDescription:
      'These cities pair well with short lead times and flexible departure windows.',
    destinationSlugs: ['new-york', 'las-vegas', 'miami'],
    nextSteps: [
      {
        title: 'Flights to New York',
        description: 'Check high-frequency routes for fast-turn city travel.',
        href: buildFlightsToHref('New York'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Las Vegas',
        description: 'Compare hotels for short city trips with broad price ranges.',
        href: buildHotelsDestinationHref('Las Vegas'),
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in New York',
        description: 'Browse city-center and neighborhood stays for quick breakouts.',
        href: buildHotelsDestinationHref('New York'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Las Vegas',
        description: 'Keep optional road-trip flexibility after city arrival.',
        href: '/car-rentals/in/las-vegas',
        cta: 'Browse rentals',
      },
    ],
  },
  {
    key: 'warm-weather',
    label: 'Warm weather',
    contextBanner: 'Showing warm-weather trip ideas',
    nextStepsIntro:
      'Start from sunny-weather intent, then branch into destination-specific booking surfaces.',
    popularTitle: 'Popular destinations for warm-weather trips',
    popularDescription: 'Prioritizing destinations that support beach or mild-climate planning.',
    destinationSlugs: ['honolulu', 'miami', 'san-diego'],
    nextSteps: [
      {
        title: 'Flights to Honolulu',
        description: 'Search warm-weather air options when local climate is still cold.',
        href: buildFlightsToHref('Honolulu'),
        cta: 'Search flights',
      },
      {
        title: 'Miami hotels',
        description: 'Browse warm-climate stays with clear nightly pricing context.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'San Diego hotels',
        description: 'Compare mild-weather coastal stays across neighborhoods.',
        href: buildHotelsDestinationHref('San Diego'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Orlando',
        description: 'Add local mobility for weather-driven, flexible itineraries.',
        href: '/car-rentals/in/orlando',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'luxury',
    label: 'Luxury stays',
    contextBanner: 'Showing luxury-focused trip ideas',
    nextStepsIntro:
      'Shift from premium inspiration into practical booking paths with city and route context.',
    popularTitle: 'Popular destinations for luxury stays',
    popularDescription:
      'Starting with destinations that support upscale inventory and premium trip pacing.',
    destinationSlugs: ['miami', 'honolulu', 'new-york'],
    nextSteps: [
      {
        title: 'Miami hotels',
        description: 'Browse premium stay inventory with waterfront and central options.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to Honolulu',
        description: 'Search long-haul routes for high-value warm-climate stays.',
        href: buildFlightsToHref('Honolulu'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in New York',
        description: 'Compare city luxury inventory by neighborhood and trip timing.',
        href: buildHotelsDestinationHref('New York'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in New York',
        description: 'Add optional premium mobility for specific borough or regional plans.',
        href: '/car-rentals/in/new-york',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'budget',
    label: 'Budget trips',
    contextBanner: 'Showing budget-oriented trip ideas',
    nextStepsIntro:
      'Move from price-sensitive inspiration into low-friction booking surfaces by vertical.',
    popularTitle: 'Popular destinations for budget trips',
    popularDescription:
      'These destinations typically support wider price spread and short-trip flexibility.',
    destinationSlugs: ['las-vegas', 'denver', 'miami'],
    nextSteps: [
      {
        title: 'Flights to Las Vegas',
        description: 'Check routes with frequent deals for short and flexible windows.',
        href: buildFlightsToHref('Las Vegas'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare stay options by neighborhood to manage total trip cost.',
        href: buildHotelsDestinationHref('Denver'),
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in Las Vegas',
        description: 'Review nightly price ranges across high-availability properties.',
        href: buildHotelsDestinationHref('Las Vegas'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Orlando',
        description: 'Check flexible ground transport options with transparent totals.',
        href: '/car-rentals/in/orlando',
        cta: 'Search rentals',
      },
    ],
  },
  {
    key: 'family',
    label: 'Family travel',
    contextBanner: 'Showing family-focused trip ideas',
    nextStepsIntro:
      'Start with family-friendly planning and move directly into bookable routes and stays.',
    popularTitle: 'Popular destinations for family travel',
    popularDescription:
      'Destinations below are prioritized for practical family logistics and flexibility.',
    destinationSlugs: ['san-diego', 'miami', 'honolulu'],
    nextSteps: [
      {
        title: 'Hotels in San Diego',
        description: 'Compare family-friendly neighborhoods and outdoor-access stays.',
        href: buildHotelsDestinationHref('San Diego'),
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to Orlando',
        description: 'Search route options for popular family travel windows.',
        href: buildFlightsToHref('Orlando'),
        cta: 'Search flights',
      },
      {
        title: 'Car rentals in Orlando',
        description: 'Keep itinerary flexibility with airport and city pickup options.',
        href: '/car-rentals/in/orlando',
        cta: 'Explore rentals',
      },
      {
        title: 'Miami hotels',
        description: 'Browse beach-access stays with amenities that work for groups.',
        href: '/hotels/in/miami',
        cta: 'View hotels',
      },
    ],
  },
  {
    key: 'solo',
    label: 'Solo escapes',
    contextBanner: 'Showing solo-travel trip ideas',
    nextStepsIntro:
      'Move from solo-travel inspiration into clear booking paths with minimal friction.',
    popularTitle: 'Popular destinations for solo escapes',
    popularDescription:
      'These destinations combine easy access, broad lodging options, and flexible mobility.',
    destinationSlugs: ['new-york', 'miami', 'san-diego'],
    nextSteps: [
      {
        title: 'Flights to New York',
        description: 'Search high-frequency routes that work for short notice solo trips.',
        href: buildFlightsToHref('New York'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Miami',
        description: 'Compare neighborhood stays with clear policies and total pricing.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in San Diego',
        description: 'Find coastal-city stays suitable for simple, independent itineraries.',
        href: buildHotelsDestinationHref('San Diego'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Las Vegas',
        description: 'Add optional road access for flexible extensions and day trips.',
        href: '/car-rentals/in/las-vegas',
        cta: 'Explore rentals',
      },
    ],
  },
]

// ─── ideas (6) ───────────────────────────────────────────────────────────────

const FLEX_IDEAS: IdeaOption[] = [
  {
    key: 'warm-places-in-march',
    title: 'Warm places in March',
    description: 'Find sunny destinations when late-winter weather is still holding on at home.',
    contextBanner: 'Showing ideas for warm places in March',
    nextStepsIntro:
      'Use this warm-weather idea to move directly into route, stay, and mobility planning.',
    popularTitle: 'Destinations for warm places in March',
    popularDescription: 'Prioritizing mild and sunny destinations for late-winter travel windows.',
    destinationSlugs: ['miami', 'san-diego', 'honolulu'],
    nextSteps: [
      {
        title: 'Flights to Miami',
        description: 'Search sunny route options with broad schedule coverage.',
        href: buildFlightsToHref('Miami'),
        cta: 'Search flights',
      },
      {
        title: 'Miami hotels',
        description: 'Browse city stays that support warm-weather planning.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in Honolulu',
        description: 'Compare island stays while keeping dates flexible.',
        href: buildHotelsDestinationHref('Honolulu'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Miami',
        description: 'Add flexible transportation for beaches and day trips.',
        href: buildCarRentalsDestinationHref('Miami'),
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'cheap-long-weekends',
    title: 'Cheap long weekends',
    description: 'Compare short getaways with lower total trip cost and easy timing windows.',
    contextBanner: 'Showing ideas for cheap long weekends',
    nextStepsIntro:
      'Focus on short-trip value by jumping straight into budget-aware booking surfaces.',
    popularTitle: 'Destinations for cheap long weekends',
    popularDescription:
      'Cities below are good first stops when balancing cost, schedule, and flexibility.',
    destinationSlugs: ['las-vegas', 'denver', 'new-york'],
    nextSteps: [
      {
        title: 'Flights to Las Vegas',
        description: 'Find frequent routes that support long-weekend timing.',
        href: buildFlightsToHref('Las Vegas'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare value-focused stay options for short breaks.',
        href: buildHotelsDestinationHref('Denver'),
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in New York',
        description: 'Check neighborhood pricing tradeoffs for quick city trips.',
        href: buildHotelsDestinationHref('New York'),
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Orlando',
        description: 'Use a strong rental market to keep ground costs flexible.',
        href: '/car-rentals/in/orlando',
        cta: 'Search rentals',
      },
    ],
  },
  {
    key: 'scenic-coastal-drives',
    title: 'Scenic coastal drives',
    description: 'Plan route-first escapes with beach towns, viewpoints, and flexible stops.',
    contextBanner: 'Showing ideas for scenic coastal drives',
    nextStepsIntro:
      'Start with coastal-route intent, then move into flights, hotels, and rental planning.',
    popularTitle: 'Destinations for scenic coastal drives',
    popularDescription:
      'These destinations support shoreline itineraries with flexible ground travel.',
    destinationSlugs: ['san-diego', 'miami', 'honolulu'],
    nextSteps: [
      {
        title: 'Car rentals in San Diego',
        description: 'Set up flexible coastal driving from a strong base city.',
        href: buildCarRentalsDestinationHref('San Diego'),
        cta: 'Explore rentals',
      },
      {
        title: 'Hotels in San Diego',
        description: 'Compare coastal neighborhoods for route-first trips.',
        href: buildHotelsDestinationHref('San Diego'),
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to Los Angeles',
        description: 'Search West Coast arrivals that pair well with road routes.',
        href: buildFlightsToHref('Los Angeles'),
        cta: 'Search flights',
      },
      {
        title: 'Explore coastal destinations',
        description: 'Browse destination guides before locking in a route.',
        href: '/destinations',
        cta: 'Browse destinations',
      },
    ],
  },
  {
    key: 'city-breaks-with-easy-flights',
    title: 'City breaks with easy flights',
    description: 'Prioritize destinations with frequent air service and low-friction arrivals.',
    contextBanner: 'Showing ideas for city breaks with easy flights',
    nextStepsIntro:
      'Use high-frequency routes as the entry point, then narrow to stays and local mobility.',
    popularTitle: 'Destinations for city breaks with easy flights',
    popularDescription:
      'These cities work well when air access and quick planning are the priorities.',
    destinationSlugs: ['new-york', 'las-vegas', 'miami'],
    nextSteps: [
      {
        title: 'Flights to New York',
        description: 'Start with high-frequency routes for short city windows.',
        href: buildFlightsToHref('New York'),
        cta: 'Search flights',
      },
      {
        title: 'Flights to Las Vegas',
        description: 'Compare nonstop-heavy options for low-friction arrivals.',
        href: buildFlightsToHref('Las Vegas'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Miami',
        description: 'Browse city stays once route timing is locked in.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'Car rentals in New York',
        description: 'Keep optional regional flexibility after city arrival.',
        href: '/car-rentals/in/new-york',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'beach-trips-with-rental-flexibility',
    title: 'Beach trips with rental flexibility',
    description: 'Pair shoreline stays with pickup-friendly car options for more freedom.',
    contextBanner: 'Showing ideas for beach trips with rental flexibility',
    nextStepsIntro:
      'Plan beach trips with mobility first so destination and stay choices stay flexible.',
    popularTitle: 'Destinations for beach trips with rental flexibility',
    popularDescription:
      'Prioritizing destinations where shoreline plans benefit from flexible car access.',
    destinationSlugs: ['miami', 'san-diego', 'honolulu'],
    nextSteps: [
      {
        title: 'Car rentals in Miami',
        description: 'Start with pickup flexibility for beach-to-city movement.',
        href: buildCarRentalsDestinationHref('Miami'),
        cta: 'Search rentals',
      },
      {
        title: 'Hotels in Miami',
        description: 'Compare beach-adjacent stays after setting transport options.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to San Diego',
        description: 'Search coastal arrivals that pair with drive-based itineraries.',
        href: buildFlightsToHref('San Diego'),
        cta: 'Search flights',
      },
      {
        title: 'Explore coastal destinations',
        description: 'Use destination guides to shape route stops and overnight pacing.',
        href: '/destinations',
        cta: 'Browse destinations',
      },
    ],
  },
  {
    key: 'quick-mountain-escapes',
    title: 'Quick mountain escapes',
    description: 'Browse high-altitude weekend options with shorter planning lead times.',
    contextBanner: 'Showing ideas for quick mountain escapes',
    nextStepsIntro:
      'Keep lead times short by moving from mountain inspiration to direct booking paths.',
    popularTitle: 'Destinations for quick mountain escapes',
    popularDescription: 'Prioritizing cities that support fast mountain-adjacent planning.',
    destinationSlugs: ['denver', 'las-vegas', 'san-diego'],
    nextSteps: [
      {
        title: 'Flights to Denver',
        description: 'Find fast routes for short mountain-focused itineraries.',
        href: buildFlightsToHref('Denver'),
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare stay options before locking the trip window.',
        href: buildHotelsDestinationHref('Denver'),
        cta: 'Browse hotels',
      },
      {
        title: 'Car rentals in Denver',
        description: 'Add optional road flexibility for nearby mountain areas.',
        href: buildCarRentalsDestinationHref('Denver'),
        cta: 'Explore rentals',
      },
      {
        title: 'Browse mountain vibes',
        description: 'Switch back to mountain mood filtering for additional variants.',
        href: '/explore?theme=mountains',
        cta: 'Explore vibes',
      },
    ],
  },
]

// ─── destinations (6) ────────────────────────────────────────────────────────

const POPULAR_DESTINATIONS: DestinationOption[] = [
  {
    key: 'miami',
    name: 'Miami',
    blurb: 'Beach-forward stays and nonstop routes',
    primaryLink: { label: 'Browse Miami hotels', href: '/hotels/in/miami' },
    flightLink: { label: 'Flights', href: buildFlightsToHref('Miami') },
    hotelLink: { label: 'Hotels', href: '/hotels/in/miami' },
    carLink: { label: 'Car rentals', href: buildCarRentalsDestinationHref('Miami') },
    guideLink: { label: 'Destination guide', href: '/destinations/miami' },
  },
  {
    key: 'las-vegas',
    name: 'Las Vegas',
    blurb: 'High-availability stays and short city trips',
    primaryLink: { label: 'Browse Las Vegas car rentals', href: '/car-rentals/in/las-vegas' },
    flightLink: { label: 'Flights', href: buildFlightsToHref('Las Vegas') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('Las Vegas') },
    carLink: { label: 'Car rentals', href: '/car-rentals/in/las-vegas' },
    guideLink: { label: 'Destinations hub', href: '/destinations' },
  },
  {
    key: 'san-diego',
    name: 'San Diego',
    blurb: 'Coastal neighborhoods and mild-weather planning',
    primaryLink: { label: 'Open San Diego guide', href: '/destinations/san-diego' },
    flightLink: { label: 'Flights', href: buildFlightsToHref('San Diego') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('San Diego') },
    carLink: { label: 'Car rentals', href: buildCarRentalsDestinationHref('San Diego') },
    guideLink: { label: 'Destination guide', href: '/destinations/san-diego' },
  },
  {
    key: 'new-york',
    name: 'New York',
    blurb: 'Dense lodging options and quick city breaks',
    primaryLink: { label: 'Browse New York car rentals', href: '/car-rentals/in/new-york' },
    flightLink: { label: 'Flights', href: buildFlightsToHref('New York') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('New York') },
    carLink: { label: 'Car rentals', href: '/car-rentals/in/new-york' },
    guideLink: { label: 'Destinations hub', href: '/destinations' },
  },
  {
    key: 'denver',
    name: 'Denver',
    blurb: 'Mountain access with strong weekend demand',
    primaryLink: { label: 'Search Denver flights', href: buildFlightsToHref('Denver') },
    flightLink: { label: 'Flights', href: buildFlightsToHref('Denver') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('Denver') },
    carLink: { label: 'Car rentals', href: buildCarRentalsDestinationHref('Denver') },
    guideLink: { label: 'Destinations hub', href: '/destinations' },
  },
  {
    key: 'honolulu',
    name: 'Honolulu',
    blurb: 'Island escapes with warm-weather demand',
    primaryLink: { label: 'Search Honolulu flights', href: buildFlightsToHref('Honolulu') },
    flightLink: { label: 'Flights', href: buildFlightsToHref('Honolulu') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('Honolulu') },
    carLink: { label: 'Car rentals', href: buildCarRentalsDestinationHref('Honolulu') },
    guideLink: { label: 'Destinations hub', href: '/destinations' },
  },
]

// ─── default next steps (no active filter) ───────────────────────────────────

const DEFAULT_NEXT_STEPS: ExploreStep[] = [
  {
    title: 'Start with Flights',
    description: 'Use route and traveler filters to shape the trip from air options first.',
    href: '/flights',
    cta: 'Open Flights',
  },
  {
    title: 'Browse Hotels',
    description: 'Move into destination and date-aware stay planning with clear totals.',
    href: '/hotels',
    cta: 'Open Hotels',
  },
  {
    title: 'Search Car Rentals',
    description: 'Add flexible local transport for route-first or multi-stop planning.',
    href: '/car-rentals',
    cta: 'Open Car Rentals',
  },
  {
    title: 'Pick a destination',
    description: 'Use destination guides when you need place-first planning context.',
    href: '/destinations',
    cta: 'Browse Destinations',
  },
]

// ─── context helpers ──────────────────────────────────────────────────────────

const findThemeByKey = (key: string): ThemeOption | null =>
  VIBE_ITEMS.find((theme) => theme.key === key) || null

const findIdeaByKey = (key: string): IdeaOption | null =>
  FLEX_IDEAS.find((idea) => idea.key === key) || null

const findDestinationByKey = (key: string): DestinationOption | null =>
  POPULAR_DESTINATIONS.find((destination) => destination.key === key) || null

const buildDestinationSteps = (destination: DestinationOption): ExploreStep[] => [
  {
    title: `Flights to ${destination.name}`,
    description: `Search air routes that fit ${destination.name} timing and trip flexibility.`,
    href: destination.flightLink.href,
    cta: 'Search flights',
  },
  {
    title: `${destination.name} hotels`,
    description: `Browse accommodation paths for ${destination.name} before fixing dates.`,
    href: destination.hotelLink.href,
    cta: 'Browse hotels',
  },
  {
    title: `Car rentals in ${destination.name}`,
    description: 'Keep local transport optional with destination-aligned rental paths.',
    href: destination.carLink.href,
    cta: 'Explore rentals',
  },
  {
    title: `Guide for ${destination.name}`,
    description: 'Use destination content to align neighborhood and planning tradeoffs.',
    href: destination.guideLink.href,
    cta: 'Read guide',
  },
]

const deriveExploreContext = (
  activeTheme: ThemeOption | null,
  activeIdea: IdeaOption | null,
  activeDestination: DestinationOption | null,
): ExploreContext => {
  if (activeIdea) {
    return {
      bannerText: activeIdea.contextBanner,
      nextStepsIntro: activeIdea.nextStepsIntro,
      nextSteps: activeIdea.nextSteps,
      destinationPriority: activeIdea.destinationSlugs,
      popularTitle: activeIdea.popularTitle,
      popularDescription: activeIdea.popularDescription,
    }
  }
  if (activeTheme) {
    return {
      bannerText: activeTheme.contextBanner,
      nextStepsIntro: activeTheme.nextStepsIntro,
      nextSteps: activeTheme.nextSteps,
      destinationPriority: activeTheme.destinationSlugs,
      popularTitle: activeTheme.popularTitle,
      popularDescription: activeTheme.popularDescription,
    }
  }
  if (activeDestination) {
    return {
      bannerText: `Showing trip paths for ${activeDestination.name}`,
      nextStepsIntro: `Use ${activeDestination.name} as the planning anchor, then branch into flights, hotels, and car rentals.`,
      nextSteps: buildDestinationSteps(activeDestination),
      destinationPriority: [activeDestination.key],
      popularTitle: `Popular destination paths from ${activeDestination.name}`,
      popularDescription:
        'Keep exploring nearby planning patterns while staying grounded in the selected destination.',
    }
  }
  return {
    bannerText: null,
    nextStepsIntro:
      'Start with one vertical, then expand into hotels, flights, and rentals as your plan takes shape.',
    nextSteps: DEFAULT_NEXT_STEPS,
    destinationPriority: [],
    popularTitle: 'Popular destinations',
    popularDescription:
      'Jump into places that pair well with flexible planning and multi-vertical booking.',
  }
}

const orderDestinationsByPriority = (
  items: DestinationOption[],
  priority: DestinationKey[],
): DestinationOption[] => {
  if (!priority.length) return items
  const rank = new Map(priority.map((key, i) => [key, i]))
  return [...items].sort((a, b) => {
    const aRank = rank.has(a.key) ? (rank.get(a.key) as number) : Number.MAX_SAFE_INTEGER
    const bRank = rank.has(b.key) ? (rank.get(b.key) as number) : Number.MAX_SAFE_INTEGER
    if (aRank === bRank) return 0
    return aRank - bRank
  })
}

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── next step cards ──────────────────────────────────────────────────────────

const NextStepsGrid = (props: { steps: ExploreStep[] }) => (
  <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {props.steps.map((step) => (
      <a
        key={step.href}
        href={step.href}
        class="block rounded-[var(--ui-radius)] p-5 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
      >
        <div
          class="mb-3 h-0.5 w-8 rounded-full"
          style="background:var(--ui-primary)"
          aria-hidden="true"
        />
        <h3
          class="text-sm font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          {step.title}
        </h3>
        <p class="mt-1 text-xs leading-relaxed" style="color:var(--ui-text-muted)">
          {step.description}
        </p>
        <div class="mt-3 text-xs font-semibold" style="color:var(--ui-primary)">
          {step.cta} &rarr;
        </div>
      </a>
    ))}
  </div>
)

// ─── main component ───────────────────────────────────────────────────────────

export default component$(() => {
  const location = useLocation()
  const rawTheme = String(location.url.searchParams.get('theme') || '').trim().toLowerCase()
  const rawIdea = String(location.url.searchParams.get('idea') || '').trim().toLowerCase()
  const rawDestination = String(location.url.searchParams.get('destination') || '').trim().toLowerCase()

  const activeTheme = findThemeByKey(rawTheme)
  const activeIdea = findIdeaByKey(rawIdea)
  const activeDestination = findDestinationByKey(rawDestination)
  const context = deriveExploreContext(activeTheme, activeIdea, activeDestination)
  const orderedDestinations = orderDestinationsByPriority(
    POPULAR_DESTINATIONS,
    context.destinationPriority,
  )
  const isGuidedMode = context.bannerText !== null

  const heroEyebrow = isGuidedMode ? 'Explore · Guided' : 'Explore'
  const heroTitle = isGuidedMode
    ? 'Exploring trips that match your selection'
    : 'Discover where to go next'
  const heroSubtitle = isGuidedMode
    ? 'Use the suggested next steps below to move from inspiration to active trip planning.'
    : 'Browse trips by mood, season, or budget — then turn inspiration into a whole-trip plan.'

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Cinematic hero ───────────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="explore-heading"
      >
        <div
          class="absolute inset-0 -z-10"
          style="background-image:var(--ui-hero-scrim)"
          aria-hidden="true"
        />
        <div class="mx-auto max-w-6xl px-4 py-20 md:py-28">

          <nav aria-label="Breadcrumb" class="mb-6">
            <ol
              class="flex flex-wrap items-center gap-2 text-[12px]"
              style="color:rgba(255,255,255,0.65)"
            >
              <li class="flex items-center gap-2">
                <a
                  href="/"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li style="color:rgba(255,255,255,0.9)" aria-current="page">
                Explore
              </li>
            </ol>
          </nav>

          <div class="max-w-2xl">
            <p
              class="text-[11px] font-bold uppercase tracking-[0.22em]"
              style="color:rgba(255,255,255,0.6)"
            >
              {heroEyebrow}
            </p>
            <h1
              id="explore-heading"
              class="mt-3 text-balance text-4xl font-bold leading-[1.05] md:text-6xl"
              style={`color:#fff;font-family:${FONT_DISPLAY}`}
            >
              {heroTitle}
            </h1>
            <p
              class="mt-4 max-w-[56ch] text-base leading-relaxed"
              style="color:rgba(255,255,255,0.82)"
            >
              {heroSubtitle}
            </p>

            {isGuidedMode && context.bannerText ? (
              <div
                class="mt-6 max-w-xl rounded-[var(--ui-radius-lg)] p-5"
                style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.28);backdrop-filter:blur(4px)"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.15em]"
                  style="color:rgba(255,255,255,0.62)"
                >
                  Current selection
                </p>
                <p
                  class="mt-2 text-sm font-semibold"
                  style={`color:#fff;font-family:${FONT_DISPLAY}`}
                >
                  {context.bannerText}
                </p>
                <p class="mt-1 text-sm" style="color:rgba(255,255,255,0.75)">
                  Use the next steps below to move from this mood into active booking.
                </p>
                <a
                  href="/explore"
                  class="mt-4 inline-flex rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style="background:#fff;color:var(--ui-text)"
                >
                  Clear selection
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Sticky mood filter bar ────────────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label="Browse by mood"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span
            class="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em]"
            style="color:var(--ui-text-muted)"
          >
            Mood
          </span>
          {VIBE_ITEMS.map((theme) => {
            const isActive = rawTheme === theme.key
            return (
              <a
                key={theme.key}
                href={buildExploreHref({ theme: theme.key })}
                class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  isActive
                    ? 'background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent'
                    : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
                }
                aria-current={isActive ? ('page' as const) : undefined}
              >
                {theme.label}
              </a>
            )
          })}
          {rawTheme ? (
            <a
              href="/explore"
              class="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2"
              style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
            >
              Clear
            </a>
          ) : null}
        </div>
      </div>

      {/* ── Guided next steps (top position) ─────────────────────────────── */}
      {isGuidedMode ? (
        <section class="mx-auto mt-10 max-w-6xl px-4">
          <h2
            class="text-2xl font-bold tracking-tight"
            style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
          >
            Suggested next steps
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
            {context.nextStepsIntro}
          </p>
          <NextStepsGrid steps={context.nextSteps} />
        </section>
      ) : null}

      {/* ── Trip ideas ────────────────────────────────────────────────────── */}
      <section class="mx-auto mt-12 max-w-6xl px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          Trip ideas
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Use themed starters when your destination is still open.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLEX_IDEAS.map((idea) => {
            const isActive = rawIdea === idea.key
            return (
              <a
                key={idea.key}
                href={buildExploreHref({ idea: idea.key })}
                class="group block overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                style={
                  isActive
                    ? 'background:var(--ui-surface);border:2px solid var(--ui-primary);box-shadow:var(--ui-shadow-panel)'
                    : 'background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)'
                }
                aria-current={isActive ? ('page' as const) : undefined}
              >
                {/* Gradient header band */}
                <div
                  class="flex items-end px-4 pb-3"
                  style="height:80px;background-image:var(--ui-hero);border-radius:var(--ui-radius) var(--ui-radius) 0 0"
                  aria-hidden="true"
                >
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style="background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)"
                  >
                    Flexible idea
                  </span>
                </div>

                <div class="p-4">
                  <h3
                    class="text-base font-bold tracking-tight"
                    style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                  >
                    {idea.title}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
                    {idea.description}
                  </p>
                  <div class="mt-3 text-sm font-semibold" style="color:var(--ui-primary)">
                    Explore idea &rarr;
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── Popular destinations ──────────────────────────────────────────── */}
      <section class="mx-auto mt-12 max-w-6xl px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          {context.popularTitle}
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          {context.popularDescription}
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedDestinations.map((destination) => {
            const isActive = rawDestination === destination.key
            return (
              <article
                key={destination.key}
                class="overflow-hidden rounded-[var(--ui-radius)] transition"
                style={
                  isActive
                    ? 'background:var(--ui-surface);border:2px solid var(--ui-primary);box-shadow:var(--ui-shadow-panel)'
                    : 'background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)'
                }
              >
                {/* Gradient header with city name — not aria-hidden so screen readers get the name */}
                <div
                  class="relative flex items-end justify-between px-4 pb-3"
                  style="height:72px;background-image:var(--ui-hero)"
                >
                  <span
                    class="text-xl font-bold"
                    style={`color:#fff;font-family:${FONT_DISPLAY};text-shadow:0 1px 4px rgba(0,0,0,0.4)`}
                  >
                    {destination.name}
                  </span>
                  {isActive ? (
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                      style="background:rgba(255,255,255,0.25);color:#fff"
                    >
                      In focus
                    </span>
                  ) : null}
                </div>

                <div class="p-4">
                  <p class="text-sm" style="color:var(--ui-text-muted)">
                    {destination.blurb}
                  </p>

                  {/* Quick links */}
                  <div class="mt-3 flex flex-wrap gap-2">
                    <a
                      href={destination.flightLink.href}
                      class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                      style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                    >
                      Flights
                    </a>
                    <a
                      href={destination.hotelLink.href}
                      class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                      style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                    >
                      Hotels
                    </a>
                    <a
                      href={destination.carLink.href}
                      class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                      style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                    >
                      Cars
                    </a>
                  </div>

                  {/* Primary action + Use in Explore */}
                  <div class="mt-4 flex items-center justify-between gap-2">
                    <a
                      href={destination.primaryLink.href}
                      class="text-sm font-semibold focus:outline-none focus-visible:ring-2"
                      style="color:var(--ui-primary)"
                    >
                      {destination.primaryLink.label} &rarr;
                    </a>
                    <a
                      href={buildExploreHref({ destination: destination.key })}
                      class="text-xs font-medium transition hover:underline focus:outline-none focus-visible:ring-2"
                      style="color:var(--ui-text-muted)"
                    >
                      Use in Explore
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Default next steps (bottom position) ─────────────────────────── */}
      {!isGuidedMode ? (
        <section class="mx-auto mt-12 max-w-6xl px-4">
          <h2
            class="text-2xl font-bold tracking-tight"
            style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
          >
            Suggested next steps
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
            {context.nextStepsIntro}
          </p>
          <NextStepsGrid steps={context.nextSteps} />
        </section>
      ) : null}

      {/* ── Whole-trip handoff ────────────────────────────────────────────── */}
      <section class="mx-auto mb-16 mt-14 max-w-6xl px-4">
        <div
          class="relative isolate overflow-hidden rounded-[var(--ui-radius-lg)] px-6 py-10 md:px-10"
          style="background-image:var(--ui-hero)"
        >
          <div
            class="absolute inset-0 -z-10"
            style="background-image:var(--ui-hero-scrim)"
            aria-hidden="true"
          />

          <p
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            style="color:rgba(255,255,255,0.62)"
          >
            Plan your trip
          </p>

          <h2
            class="mt-2 text-balance text-2xl font-bold md:text-3xl"
            style={`color:#fff;font-family:${FONT_DISPLAY}`}
          >
            Turn inspiration into a whole-trip plan
          </h2>

          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Pick a vertical to start — flights, hotels, or car rentals. Each opens a full
            search experience with filters, transparent totals, and clear policies.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  label: 'Search Flights',
                  href: '/flights',
                  sub: 'Routes, schedules, and nonstop options',
                },
                {
                  label: 'Browse Hotels',
                  href: '/hotels',
                  sub: 'Destination-aware stays with clear totals',
                },
                {
                  label: 'Compare Cars',
                  href: '/car-rentals',
                  sub: 'Flexible pickup dates and vehicle classes',
                },
              ] as const
            ).map(({ label, href, sub }) => (
              <a
                key={href}
                href={href}
                class="block rounded-[var(--ui-radius)] px-5 py-4 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.28)"
              >
                <div
                  class="text-base font-bold"
                  style={`color:#fff;font-family:${FONT_DISPLAY}`}
                >
                  {label}
                </div>
                <div class="mt-1 text-xs" style="color:rgba(255,255,255,0.75)">
                  {sub}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Explore | Andacity'
  const description =
    'Discover where to go next. Browse trips by mood, season, or budget — then turn inspiration into a whole-trip plan across flights, hotels, and car rentals.'
  const canonicalHref = new URL('/explore', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
