/**
 * CLAUDE-UI-021 — Explore page sample static data.
 *
 * All data mirrors the production /explore route content exactly so the sample
 * demonstrates real direction, not fabricated copy. The only intentional
 * difference: filter chip links target /dev/ui-explore (via buildSampleExploreHref)
 * so theme/idea/destination filtering works inside the dev preview.
 */

// ─── types ───────────────────────────────────────────────────────────────────

export type SampleNextStep = {
  title: string
  description: string
  href: string
  cta: string
}

export type SampleTheme = {
  key: string
  label: string
  contextBanner: string
  nextStepsIntro: string
  popularTitle: string
  popularDescription: string
  destinationSlugs: string[]
  nextSteps: SampleNextStep[]
}

export type SampleIdea = {
  key: string
  title: string
  description: string
  contextBanner: string
  nextStepsIntro: string
  popularTitle: string
  popularDescription: string
  destinationSlugs: string[]
  nextSteps: SampleNextStep[]
}

export type SampleDestination = {
  key: string
  name: string
  blurb: string
  primaryLabel: string
  primaryHref: string
  flightHref: string
  hotelHref: string
  carHref: string
  guideHref: string
}

// ─── url helpers ─────────────────────────────────────────────────────────────

export const buildSampleExploreHref = (params: {
  theme?: string | null
  idea?: string | null
  destination?: string | null
}) => {
  const sp = new URLSearchParams()
  if (params.theme) sp.set('theme', params.theme)
  if (params.idea) sp.set('idea', params.idea)
  if (params.destination) sp.set('destination', params.destination)
  const q = sp.toString()
  return q ? `/dev/ui-explore?${q}` : '/dev/ui-explore'
}

// Pre-computed flight hrefs: /search/flights/from/anywhere/to/<slug>/round-trip/1
const FLY: Record<string, string> = {
  miami: '/search/flights/from/anywhere/to/miami/round-trip/1',
  'las-vegas': '/search/flights/from/anywhere/to/las-vegas/round-trip/1',
  'san-diego': '/search/flights/from/anywhere/to/san-diego/round-trip/1',
  'new-york': '/search/flights/from/anywhere/to/new-york/round-trip/1',
  denver: '/search/flights/from/anywhere/to/denver/round-trip/1',
  honolulu: '/search/flights/from/anywhere/to/honolulu/round-trip/1',
  orlando: '/search/flights/from/anywhere/to/orlando/round-trip/1',
  'los-angeles': '/search/flights/from/anywhere/to/los-angeles/round-trip/1',
}

// ─── themes (8) ──────────────────────────────────────────────────────────────

export const SAMPLE_THEMES: SampleTheme[] = [
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
        href: FLY.miami,
        cta: 'Search flights',
      },
      {
        title: 'Miami hotels',
        description: 'Browse Miami hotel inventory before committing to dates.',
        href: '/hotels/in/miami',
        cta: 'Browse hotels',
      },
      {
        title: 'San Diego hotels',
        description: 'Compare coastal stays in a mild-weather city with flexible timing.',
        href: '/hotels?destination=San%20Diego',
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Miami',
        description: 'Add flexible ground travel for beach neighborhoods and day trips.',
        href: '/car-rentals?q=Miami',
        cta: 'Explore car rentals',
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
        href: FLY.denver,
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare hotel options near mountain access points and transit.',
        href: '/hotels?destination=Denver',
        cta: 'Browse hotels',
      },
      {
        title: 'Car rentals in Denver',
        description: 'Add flexible ground transport for trailheads and nearby towns.',
        href: '/car-rentals?q=Denver',
        cta: 'Search rentals',
      },
      {
        title: 'Quick mountain escapes',
        description: 'Move into a pre-filtered mountain idea flow for shorter trip windows.',
        href: buildSampleExploreHref({ idea: 'quick-mountain-escapes' }),
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
        href: FLY['new-york'],
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Las Vegas',
        description: 'Compare hotels for short city trips with broad price ranges.',
        href: '/hotels?destination=Las%20Vegas',
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in New York',
        description: 'Browse city-center and neighborhood stays for quick breakouts.',
        href: '/hotels?destination=New%20York',
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
    popularDescription:
      'Prioritizing destinations that support beach or mild-climate planning.',
    destinationSlugs: ['honolulu', 'miami', 'san-diego'],
    nextSteps: [
      {
        title: 'Flights to Honolulu',
        description: 'Search warm-weather air options when local climate is still cold.',
        href: FLY.honolulu,
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
        href: '/hotels?destination=San%20Diego',
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
        href: FLY.honolulu,
        cta: 'Search flights',
      },
      {
        title: 'Hotels in New York',
        description: 'Compare city luxury inventory by neighborhood and trip timing.',
        href: '/hotels?destination=New%20York',
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
        href: FLY['las-vegas'],
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare stay options by neighborhood to manage total trip cost.',
        href: '/hotels?destination=Denver',
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in Las Vegas',
        description: 'Review nightly price ranges across high-availability properties.',
        href: '/hotels?destination=Las%20Vegas',
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
        href: '/hotels?destination=San%20Diego',
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to Orlando',
        description: 'Search route options for popular family travel windows.',
        href: FLY.orlando,
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
        href: FLY['new-york'],
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
        href: '/hotels?destination=San%20Diego',
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

export const SAMPLE_IDEAS: SampleIdea[] = [
  {
    key: 'warm-places-in-march',
    title: 'Warm places in March',
    description: 'Find sunny destinations when late-winter weather is still holding on at home.',
    contextBanner: 'Showing ideas for warm places in March',
    nextStepsIntro:
      'Use this warm-weather idea to move directly into route, stay, and mobility planning.',
    popularTitle: 'Destinations for warm places in March',
    popularDescription:
      'Prioritizing mild and sunny destinations for late-winter travel windows.',
    destinationSlugs: ['miami', 'san-diego', 'honolulu'],
    nextSteps: [
      {
        title: 'Flights to Miami',
        description: 'Search sunny route options with broad schedule coverage.',
        href: FLY.miami,
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
        href: '/hotels?destination=Honolulu',
        cta: 'View hotels',
      },
      {
        title: 'Car rentals in Miami',
        description: 'Add flexible transportation for beaches and day trips.',
        href: '/car-rentals?q=Miami',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'cheap-long-weekends',
    title: 'Cheap long weekends',
    description:
      'Compare short getaways with lower total trip cost and easy timing windows.',
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
        href: FLY['las-vegas'],
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare value-focused stay options for short breaks.',
        href: '/hotels?destination=Denver',
        cta: 'Browse hotels',
      },
      {
        title: 'Hotels in New York',
        description: 'Check neighborhood pricing tradeoffs for quick city trips.',
        href: '/hotels?destination=New%20York',
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
    description:
      'Plan route-first escapes with beach towns, viewpoints, and flexible stops.',
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
        href: '/car-rentals?q=San%20Diego',
        cta: 'Explore rentals',
      },
      {
        title: 'Hotels in San Diego',
        description: 'Compare coastal neighborhoods for route-first trips.',
        href: '/hotels?destination=San%20Diego',
        cta: 'Browse hotels',
      },
      {
        title: 'Flights to Los Angeles',
        description: 'Search West Coast arrivals that pair well with road routes.',
        href: FLY['los-angeles'],
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
    description:
      'Prioritize destinations with frequent air service and low-friction arrivals.',
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
        href: FLY['new-york'],
        cta: 'Search flights',
      },
      {
        title: 'Flights to Las Vegas',
        description: 'Compare nonstop-heavy options for low-friction arrivals.',
        href: FLY['las-vegas'],
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
    description:
      'Pair shoreline stays with pickup-friendly car options for more freedom.',
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
        href: '/car-rentals?q=Miami',
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
        href: FLY['san-diego'],
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
    description:
      'Browse high-altitude weekend options with shorter planning lead times.',
    contextBanner: 'Showing ideas for quick mountain escapes',
    nextStepsIntro:
      'Keep lead times short by moving from mountain inspiration to direct booking paths.',
    popularTitle: 'Destinations for quick mountain escapes',
    popularDescription:
      'Prioritizing cities that support fast mountain-adjacent planning.',
    destinationSlugs: ['denver', 'las-vegas', 'san-diego'],
    nextSteps: [
      {
        title: 'Flights to Denver',
        description: 'Find fast routes for short mountain-focused itineraries.',
        href: FLY.denver,
        cta: 'Search flights',
      },
      {
        title: 'Hotels in Denver',
        description: 'Compare stay options before locking the trip window.',
        href: '/hotels?destination=Denver',
        cta: 'Browse hotels',
      },
      {
        title: 'Car rentals in Denver',
        description: 'Add optional road flexibility for nearby mountain areas.',
        href: '/car-rentals?q=Denver',
        cta: 'Explore rentals',
      },
      {
        title: 'Browse mountain vibes',
        description: 'Switch back to mountain mood filtering for additional variants.',
        href: buildSampleExploreHref({ theme: 'mountains' }),
        cta: 'Explore vibes',
      },
    ],
  },
]

// ─── destinations (6) ────────────────────────────────────────────────────────

export const SAMPLE_DESTINATIONS: SampleDestination[] = [
  {
    key: 'miami',
    name: 'Miami',
    blurb: 'Beach-forward stays and nonstop routes',
    primaryLabel: 'Browse Miami hotels',
    primaryHref: '/hotels/in/miami',
    flightHref: FLY.miami,
    hotelHref: '/hotels/in/miami',
    carHref: '/car-rentals?q=Miami',
    guideHref: '/destinations/miami',
  },
  {
    key: 'las-vegas',
    name: 'Las Vegas',
    blurb: 'High-availability stays and short city trips',
    primaryLabel: 'Browse Las Vegas car rentals',
    primaryHref: '/car-rentals/in/las-vegas',
    flightHref: FLY['las-vegas'],
    hotelHref: '/hotels?destination=Las%20Vegas',
    carHref: '/car-rentals/in/las-vegas',
    guideHref: '/destinations',
  },
  {
    key: 'san-diego',
    name: 'San Diego',
    blurb: 'Coastal neighborhoods and mild-weather planning',
    primaryLabel: 'Open San Diego guide',
    primaryHref: '/destinations/san-diego',
    flightHref: FLY['san-diego'],
    hotelHref: '/hotels?destination=San%20Diego',
    carHref: '/car-rentals?q=San%20Diego',
    guideHref: '/destinations/san-diego',
  },
  {
    key: 'new-york',
    name: 'New York',
    blurb: 'Dense lodging options and quick city breaks',
    primaryLabel: 'Browse New York car rentals',
    primaryHref: '/car-rentals/in/new-york',
    flightHref: FLY['new-york'],
    hotelHref: '/hotels?destination=New%20York',
    carHref: '/car-rentals/in/new-york',
    guideHref: '/destinations',
  },
  {
    key: 'denver',
    name: 'Denver',
    blurb: 'Mountain access with strong weekend demand',
    primaryLabel: 'Search Denver flights',
    primaryHref: FLY.denver,
    flightHref: FLY.denver,
    hotelHref: '/hotels?destination=Denver',
    carHref: '/car-rentals?q=Denver',
    guideHref: '/destinations',
  },
  {
    key: 'honolulu',
    name: 'Honolulu',
    blurb: 'Island escapes with warm-weather demand',
    primaryLabel: 'Search Honolulu flights',
    primaryHref: FLY.honolulu,
    flightHref: FLY.honolulu,
    hotelHref: '/hotels?destination=Honolulu',
    carHref: '/car-rentals?q=Honolulu',
    guideHref: '/destinations',
  },
]

// ─── default next steps (no active filter) ───────────────────────────────────

export const DEFAULT_NEXT_STEPS: SampleNextStep[] = [
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
