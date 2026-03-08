import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { ExplorePresetChips } from '~/components/explore/ExplorePresetChips'
import { HeroBackground } from '~/components/hero/HeroBackground'
import { Page } from '~/components/site/Page'
import type {
  ExploreCarPresets,
  ExploreDateHints,
  ExploreHotelPresets,
  ExploreIntent,
  ExploreTravelStyle,
} from '~/types/explore/intent'

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

type ExploreHeroOverlayVariant =
  | 'explore-default'
  | 'explore-guided'
  | 'explore-beach'
  | 'explore-mountains'
  | 'explore-weekend-cities'
  | 'explore-warm-weather'
  | 'explore-luxury'
  | 'explore-budget'
  | 'explore-family'
  | 'explore-solo'

const EXPLORE_BASE_HERO_IMAGE_URL = '/images/hero/explore.svg'

const EXPLORE_THEME_OVERLAY_MAP: Record<ThemeKey, ExploreHeroOverlayVariant> = {
  beach: 'explore-beach',
  mountains: 'explore-mountains',
  'weekend-cities': 'explore-weekend-cities',
  'warm-weather': 'explore-warm-weather',
  luxury: 'explore-luxury',
  budget: 'explore-budget',
  family: 'explore-family',
  solo: 'explore-solo',
}

const EXPLORE_IDEA_OVERLAY_MAP: Record<IdeaKey, ExploreHeroOverlayVariant> = {
  'warm-places-in-march': 'explore-warm-weather',
  'cheap-long-weekends': 'explore-budget',
  'scenic-coastal-drives': 'explore-beach',
  'city-breaks-with-easy-flights': 'explore-weekend-cities',
  'beach-trips-with-rental-flexibility': 'explore-beach',
  'quick-mountain-escapes': 'explore-mountains',
}

const buildFlightsToHref = (to: string) => `/flights?to=${encodeURIComponent(to)}`
const buildHotelsDestinationHref = (destination: string) => `/hotels?destination=${encodeURIComponent(destination)}`
const buildCarRentalsDestinationHref = (destination: string) => `/car-rentals?q=${encodeURIComponent(destination)}`

const DESTINATION_CITY_LABELS: Record<DestinationKey, string> = {
  miami: 'Miami',
  'las-vegas': 'Las Vegas',
  'san-diego': 'San Diego',
  'new-york': 'New York',
  denver: 'Denver',
  honolulu: 'Honolulu',
}

const THEME_TRAVEL_STYLE_MAP: Record<ThemeKey, ExploreTravelStyle[]> = {
  beach: ['beach'],
  mountains: ['adventure'],
  'weekend-cities': ['urban'],
  'warm-weather': ['beach', 'wellness'],
  luxury: ['luxury'],
  budget: ['budget'],
  family: ['family'],
  solo: ['urban', 'adventure'],
}

const THEME_HOTEL_PRESET_MAP: Partial<Record<ThemeKey, ExploreHotelPresets>> = {
  beach: {
    amenities: ['pool', 'beachfront'],
    propertyTypes: ['resort'],
    priceTier: 'upscale',
  },
  mountains: {
    amenities: ['parking'],
    propertyTypes: ['lodge', 'hotel'],
    priceTier: 'mid',
  },
  'weekend-cities': {
    neighborhoods: ['downtown', 'city center'],
    propertyTypes: ['hotel'],
    priceTier: 'mid',
  },
  'warm-weather': {
    amenities: ['pool'],
    priceTier: 'mid',
  },
  luxury: {
    starRatingMin: 5,
    amenities: ['spa', 'pool'],
    priceTier: 'luxury',
  },
  budget: {
    starRatingMin: 3,
    priceTier: 'budget',
  },
  family: {
    amenities: ['pool', 'family rooms'],
    propertyTypes: ['resort', 'aparthotel'],
    priceTier: 'mid',
  },
  solo: {
    amenities: ['wifi'],
    priceTier: 'mid',
  },
}

const THEME_CAR_PRESET_MAP: Partial<Record<ThemeKey, ExploreCarPresets>> = {
  beach: { vehicleClasses: ['convertible', 'suv'], pickupType: 'airport' },
  mountains: { vehicleClasses: ['suv'], pickupType: 'airport' },
  'weekend-cities': { vehicleClasses: ['compact'], pickupType: 'city' },
  'warm-weather': { vehicleClasses: ['suv'], pickupType: 'airport' },
  luxury: { vehicleClasses: ['luxury', 'convertible'], pickupType: 'airport' },
  budget: { vehicleClasses: ['economy', 'compact'], pickupType: 'city' },
  family: { vehicleClasses: ['suv', 'minivan'], pickupType: 'airport' },
  solo: { vehicleClasses: ['compact'], pickupType: 'city' },
}

const THEME_DATE_HINT_MAP: Partial<Record<ThemeKey, ExploreDateHints>> = {
  beach: { season: 'summer', tripLengthDays: 5 },
  mountains: { season: 'fall', tripLengthDays: 4 },
  'weekend-cities': { weekendFriendly: true, tripLengthDays: 3 },
  'warm-weather': { season: 'spring', tripLengthDays: 4 },
  luxury: { season: 'winter', tripLengthDays: 5 },
  budget: { weekendFriendly: true, tripLengthDays: 3 },
  family: { season: 'summer', tripLengthDays: 6 },
  solo: { season: 'spring', weekendFriendly: true, tripLengthDays: 3 },
}

const THEME_ACCENT_MAP: Record<ThemeKey, string> = {
  beach: 'amber',
  mountains: 'cobalt',
  'weekend-cities': 'slate',
  'warm-weather': 'sun',
  luxury: 'orchid',
  budget: 'mint',
  family: 'sea',
  solo: 'steel',
}

const IDEA_TRAVEL_STYLE_MAP: Record<IdeaKey, ExploreTravelStyle[]> = {
  'warm-places-in-march': ['beach', 'wellness'],
  'cheap-long-weekends': ['budget', 'urban'],
  'scenic-coastal-drives': ['adventure', 'beach'],
  'city-breaks-with-easy-flights': ['urban', 'business'],
  'beach-trips-with-rental-flexibility': ['beach', 'adventure'],
  'quick-mountain-escapes': ['adventure'],
}

const IDEA_HOTEL_PRESET_MAP: Partial<Record<IdeaKey, ExploreHotelPresets>> = {
  'warm-places-in-march': {
    amenities: ['pool', 'beachfront'],
    priceTier: 'mid',
  },
  'cheap-long-weekends': {
    starRatingMin: 3,
    priceTier: 'budget',
  },
  'scenic-coastal-drives': {
    amenities: ['parking'],
    propertyTypes: ['hotel', 'motel'],
  },
  'city-breaks-with-easy-flights': {
    neighborhoods: ['downtown'],
    propertyTypes: ['hotel'],
    priceTier: 'mid',
  },
  'beach-trips-with-rental-flexibility': {
    amenities: ['pool'],
    propertyTypes: ['resort'],
  },
  'quick-mountain-escapes': {
    propertyTypes: ['lodge', 'hotel'],
    amenities: ['parking'],
    priceTier: 'mid',
  },
}

const IDEA_CAR_PRESET_MAP: Partial<Record<IdeaKey, ExploreCarPresets>> = {
  'warm-places-in-march': { vehicleClasses: ['compact', 'suv'], pickupType: 'airport' },
  'cheap-long-weekends': { vehicleClasses: ['economy', 'compact'], pickupType: 'city' },
  'scenic-coastal-drives': { vehicleClasses: ['convertible', 'suv'], pickupType: 'city' },
  'city-breaks-with-easy-flights': { vehicleClasses: ['compact'], pickupType: 'airport' },
  'beach-trips-with-rental-flexibility': { vehicleClasses: ['suv', 'convertible'], pickupType: 'airport' },
  'quick-mountain-escapes': { vehicleClasses: ['suv'], pickupType: 'airport' },
}

const IDEA_DATE_HINT_MAP: Partial<Record<IdeaKey, ExploreDateHints>> = {
  'warm-places-in-march': { season: 'spring', tripLengthDays: 5 },
  'cheap-long-weekends': { weekendFriendly: true, tripLengthDays: 3 },
  'scenic-coastal-drives': { weekendFriendly: true, tripLengthDays: 5 },
  'city-breaks-with-easy-flights': { weekendFriendly: true, tripLengthDays: 3 },
  'beach-trips-with-rental-flexibility': { season: 'summer', tripLengthDays: 5 },
  'quick-mountain-escapes': { season: 'fall', weekendFriendly: true, tripLengthDays: 3 },
}

const IDEA_ACCENT_MAP: Record<IdeaKey, string> = {
  'warm-places-in-march': 'sun',
  'cheap-long-weekends': 'mint',
  'scenic-coastal-drives': 'amber',
  'city-breaks-with-easy-flights': 'slate',
  'beach-trips-with-rental-flexibility': 'teal',
  'quick-mountain-escapes': 'cobalt',
}

const DESTINATION_TRAVEL_STYLE_MAP: Record<DestinationKey, ExploreTravelStyle[]> = {
  miami: ['beach', 'nightlife'],
  'las-vegas': ['nightlife', 'urban'],
  'san-diego': ['beach', 'family'],
  'new-york': ['urban', 'business'],
  denver: ['adventure'],
  honolulu: ['beach', 'wellness'],
}

const DESTINATION_HOTEL_PRESET_MAP: Partial<Record<DestinationKey, ExploreHotelPresets>> = {
  miami: { amenities: ['pool'], propertyTypes: ['resort'], priceTier: 'upscale' },
  'las-vegas': { starRatingMin: 4, propertyTypes: ['hotel'], priceTier: 'mid' },
  'san-diego': { amenities: ['pool'], propertyTypes: ['hotel'], priceTier: 'mid' },
  'new-york': { neighborhoods: ['manhattan'], propertyTypes: ['hotel'], priceTier: 'upscale' },
  denver: { amenities: ['parking'], propertyTypes: ['hotel'], priceTier: 'mid' },
  honolulu: { amenities: ['pool', 'beachfront'], propertyTypes: ['resort'], priceTier: 'upscale' },
}

const DESTINATION_CAR_PRESET_MAP: Partial<Record<DestinationKey, ExploreCarPresets>> = {
  miami: { vehicleClasses: ['suv', 'convertible'], pickupType: 'airport' },
  'las-vegas': { vehicleClasses: ['compact', 'suv'], pickupType: 'airport' },
  'san-diego': { vehicleClasses: ['compact', 'suv'], pickupType: 'city' },
  'new-york': { vehicleClasses: ['compact'], pickupType: 'city' },
  denver: { vehicleClasses: ['suv'], pickupType: 'airport' },
  honolulu: { vehicleClasses: ['compact', 'suv'], pickupType: 'airport' },
}

const DESTINATION_ACCENT_MAP: Record<DestinationKey, string> = {
  miami: 'amber',
  'las-vegas': 'neon',
  'san-diego': 'teal',
  'new-york': 'slate',
  denver: 'cobalt',
  honolulu: 'sun',
}

const VIBE_ITEMS: ThemeOption[] = [
  {
    key: 'beach',
    label: 'Beach escapes',
    contextBanner: 'Showing beach-inspired trip ideas',
    nextStepsIntro: 'Take this beach theme into real booking paths across flights, stays, and car rentals.',
    popularTitle: 'Popular destinations for beach escapes',
    popularDescription: 'Start with beach-forward cities, then move directly into flights, hotels, and car rentals.',
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
        description: 'Browse indexable Miami hotel inventory before committing to dates.',
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
      {
        title: 'Car rentals in Miami',
        description: 'Add flexible ground travel for beach neighborhoods and day trips.',
        href: buildCarRentalsDestinationHref('Miami'),
        cta: 'Explore car rentals',
      },
    ],
  },
  {
    key: 'mountains',
    label: 'Mountain getaways',
    contextBanner: 'Showing mountain-inspired trip ideas',
    nextStepsIntro: 'Start with mountain-friendly routes and continue into stay and transport planning.',
    popularTitle: 'Popular destinations for mountain getaways',
    popularDescription: 'Prioritizing cities that pair well with short mountain escapes and flexible planning.',
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
    nextStepsIntro: 'Use city-break routes with low-friction flight, stay, and local mobility options.',
    popularTitle: 'Popular destinations for weekend city breaks',
    popularDescription: 'These cities pair well with short lead times and flexible departure windows.',
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
    nextStepsIntro: 'Start from sunny-weather intent, then branch into destination-specific booking surfaces.',
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
    nextStepsIntro: 'Shift from premium inspiration into practical booking paths with city and route context.',
    popularTitle: 'Popular destinations for luxury stays',
    popularDescription: 'Starting with destinations that support upscale inventory and premium trip pacing.',
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
        href: '/car-rentals/in/new-york-city',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'budget',
    label: 'Budget trips',
    contextBanner: 'Showing budget-oriented trip ideas',
    nextStepsIntro: 'Move from price-sensitive inspiration into low-friction booking surfaces by vertical.',
    popularTitle: 'Popular destinations for budget trips',
    popularDescription: 'These destinations typically support wider price spread and short-trip flexibility.',
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
    nextStepsIntro: 'Start with family-friendly planning and move directly into bookable routes and stays.',
    popularTitle: 'Popular destinations for family travel',
    popularDescription: 'Destinations below are prioritized for practical family logistics and flexibility.',
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
    nextStepsIntro: 'Move from solo-travel inspiration into clear booking paths with minimal friction.',
    popularTitle: 'Popular destinations for solo escapes',
    popularDescription: 'These destinations combine easy access, broad lodging options, and flexible mobility.',
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

const FLEX_IDEAS: IdeaOption[] = [
  {
    key: 'warm-places-in-march',
    title: 'Warm places in March',
    description: 'Find sunny destinations when late-winter weather is still holding on at home.',
    contextBanner: 'Showing ideas for warm places in March',
    nextStepsIntro: 'Use this warm-weather idea to move directly into route, stay, and mobility planning.',
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
    nextStepsIntro: 'Focus on short-trip value by jumping straight into budget-aware booking surfaces.',
    popularTitle: 'Destinations for cheap long weekends',
    popularDescription: 'Cities below are good first stops when balancing cost, schedule, and flexibility.',
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
    nextStepsIntro: 'Start with coastal-route intent, then move into flights, hotels, and rental planning.',
    popularTitle: 'Destinations for scenic coastal drives',
    popularDescription: 'These destinations support shoreline itineraries with flexible ground travel.',
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
    nextStepsIntro: 'Use high-frequency routes as the entry point, then narrow to stays and local mobility.',
    popularTitle: 'Destinations for city breaks with easy flights',
    popularDescription: 'These cities work well when air access and quick planning are the priorities.',
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
        href: '/car-rentals/in/new-york-city',
        cta: 'Explore rentals',
      },
    ],
  },
  {
    key: 'beach-trips-with-rental-flexibility',
    title: 'Beach trips with rental flexibility',
    description: 'Pair shoreline stays with pickup-friendly car options for more freedom.',
    contextBanner: 'Showing ideas for beach trips with rental flexibility',
    nextStepsIntro: 'Plan beach trips with mobility first so destination and stay choices stay flexible.',
    popularTitle: 'Destinations for beach trips with rental flexibility',
    popularDescription: 'Prioritizing destinations where shoreline plans benefit from flexible car access.',
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
    nextStepsIntro: 'Keep lead times short by moving from mountain inspiration to direct booking paths.',
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
    primaryLink: { label: 'Browse New York car rentals', href: '/car-rentals/in/new-york-city' },
    flightLink: { label: 'Flights', href: buildFlightsToHref('New York') },
    hotelLink: { label: 'Hotels', href: buildHotelsDestinationHref('New York') },
    carLink: { label: 'Car rentals', href: '/car-rentals/in/new-york-city' },
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

const findThemeByKey = (key: string): ThemeOption | null => {
  return VIBE_ITEMS.find((theme) => theme.key === key) || null
}

const findIdeaByKey = (key: string): IdeaOption | null => {
  return FLEX_IDEAS.find((idea) => idea.key === key) || null
}

const findDestinationByKey = (key: string): DestinationOption | null => {
  return POPULAR_DESTINATIONS.find((destination) => destination.key === key) || null
}

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

const buildDestinationSteps = (destination: DestinationOption): ExploreStep[] => {
  return [
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
      description: `Keep local transport optional with destination-aligned rental paths.`,
      href: destination.carLink.href,
      cta: 'Explore rentals',
    },
    {
      title: `Guide for ${destination.name}`,
      description: `Use destination content to align neighborhood and planning tradeoffs.`,
      href: destination.guideLink.href,
      cta: 'Read guide',
    },
  ]
}

const toIntentLocation = (destinationKey: DestinationKey | undefined) => {
  if (!destinationKey) return undefined
  const city = DESTINATION_CITY_LABELS[destinationKey]
  if (!city) return undefined

  return {
    city,
    country: 'US',
  }
}

const toThemeExploreIntent = (theme: ThemeOption): ExploreIntent => {
  return {
    kind: 'vibe',
    label: theme.label,
    slug: theme.key,
    location: toIntentLocation(theme.destinationSlugs[0]),
    travelStyle: THEME_TRAVEL_STYLE_MAP[theme.key],
    hotelPresets: THEME_HOTEL_PRESET_MAP[theme.key],
    carPresets: THEME_CAR_PRESET_MAP[theme.key],
    dateHints: THEME_DATE_HINT_MAP[theme.key],
    ui: {
      accent: THEME_ACCENT_MAP[theme.key],
      heroMode: EXPLORE_THEME_OVERLAY_MAP[theme.key],
      backgroundMode: 'explore-hero',
    },
  }
}

const toIdeaExploreIntent = (idea: IdeaOption): ExploreIntent => {
  const kind = idea.key === 'warm-places-in-march' ? 'seasonal' : 'idea'

  return {
    kind,
    label: idea.title,
    slug: idea.key,
    location: toIntentLocation(idea.destinationSlugs[0]),
    travelStyle: IDEA_TRAVEL_STYLE_MAP[idea.key],
    hotelPresets: IDEA_HOTEL_PRESET_MAP[idea.key],
    carPresets: IDEA_CAR_PRESET_MAP[idea.key],
    dateHints: IDEA_DATE_HINT_MAP[idea.key],
    ui: {
      accent: IDEA_ACCENT_MAP[idea.key],
      heroMode: EXPLORE_IDEA_OVERLAY_MAP[idea.key],
      backgroundMode: 'explore-hero',
    },
  }
}

const toDestinationExploreIntent = (destination: DestinationOption): ExploreIntent => {
  return {
    kind: 'city',
    label: destination.name,
    slug: destination.key,
    location: toIntentLocation(destination.key),
    travelStyle: DESTINATION_TRAVEL_STYLE_MAP[destination.key],
    hotelPresets: DESTINATION_HOTEL_PRESET_MAP[destination.key],
    carPresets: DESTINATION_CAR_PRESET_MAP[destination.key],
    ui: {
      accent: DESTINATION_ACCENT_MAP[destination.key],
      heroMode: 'explore-guided',
      backgroundMode: 'explore-hero',
    },
  }
}

const deriveActiveExploreIntent = (
  activeTheme: ThemeOption | null,
  activeIdea: IdeaOption | null,
  activeDestination: DestinationOption | null,
): ExploreIntent | null => {
  if (activeIdea) return toIdeaExploreIntent(activeIdea)
  if (activeTheme) return toThemeExploreIntent(activeTheme)
  if (activeDestination) return toDestinationExploreIntent(activeDestination)
  return null
}

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
      popularDescription: 'Keep exploring nearby planning patterns while staying grounded in the selected destination.',
    }
  }

  return {
    bannerText: null,
    nextStepsIntro: 'Start with one vertical, then expand into hotels, flights, and rentals as your plan takes shape.',
    nextSteps: DEFAULT_NEXT_STEPS,
    destinationPriority: [],
    popularTitle: 'Popular destinations',
    popularDescription: 'Jump into places that pair well with flexible planning and multi-vertical booking.',
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

const deriveExploreOverlayVariant = (params: {
  rawTheme: string
  rawIdea: string
  rawDestination: string
  activeTheme: ThemeOption | null
  activeIdea: IdeaOption | null
  activeDestination: DestinationOption | null
}): ExploreHeroOverlayVariant => {
  const querySelectionCount = [params.rawTheme, params.rawIdea, params.rawDestination].filter((value) => value).length

  if (querySelectionCount > 1) return 'explore-guided'
  if (params.activeTheme) return EXPLORE_THEME_OVERLAY_MAP[params.activeTheme.key]
  if (params.activeIdea) return EXPLORE_IDEA_OVERLAY_MAP[params.activeIdea.key]
  if (params.activeDestination) return 'explore-guided'
  if (querySelectionCount === 1) return 'explore-guided'
  return 'explore-default'
}

export default component$(() => {
  const location = useLocation()
  const rawTheme = String(location.url.searchParams.get('theme') || '').trim().toLowerCase()
  const rawIdea = String(location.url.searchParams.get('idea') || '').trim().toLowerCase()
  const rawDestination = String(location.url.searchParams.get('destination') || '').trim().toLowerCase()

  const activeTheme = findThemeByKey(rawTheme)
  const activeIdea = findIdeaByKey(rawIdea)
  const activeDestination = findDestinationByKey(rawDestination)
  const activeExploreIntent = deriveActiveExploreIntent(activeTheme, activeIdea, activeDestination)
  const context = deriveExploreContext(activeTheme, activeIdea, activeDestination)
  const heroOverlayVariant = deriveExploreOverlayVariant({
    rawTheme,
    rawIdea,
    rawDestination,
    activeTheme,
    activeIdea,
    activeDestination,
  })
  const orderedDestinations = orderDestinationsByPriority(POPULAR_DESTINATIONS, context.destinationPriority)
  const activeSelectionCount = [activeTheme, activeIdea, activeDestination].reduce(
    (count, selection) => (selection ? count + 1 : count),
    0,
  )
  const isGuidedMode = context.bannerText !== null
  const heroEyebrow = isGuidedMode ? 'Explore Results' : 'Explore'
  const heroTitle = isGuidedMode
    ? 'Exploring trips that match your selection'
    : 'Discover trips by mood, season, or budget'
  const heroDescription = isGuidedMode
    ? 'Use your current selection to discover destinations, trip ideas, and next steps across Andacity.'
    : "Browse destinations, flexible ideas, and trip inspiration when you're not starting with a fixed plan."
  const contextSurfaceText =
    activeSelectionCount > 1 ? 'Showing trips that match your selections' : context.bannerText

  const nextStepsSection = (
    <section class="mt-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Suggested next steps
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            {context.nextStepsIntro}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {context.nextSteps.map((step) => (
          <a
            key={`${step.title}-${step.href}`}
            href={step.href}
            class="t-card block h-full rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] p-5 transition hover:-translate-y-px hover:bg-white"
          >
            <h3 class="text-base font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {step.title}
            </h3>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {step.description}
            </p>
            <div class="mt-4 pt-1 text-sm font-medium text-[color:var(--color-action)]">
              {step.cta} →
            </div>
          </a>
        ))}
      </div>
    </section>
  )

  return (
    <Page
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Explore' },
      ]}
    >
      <section class="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <HeroBackground imageUrl={EXPLORE_BASE_HERO_IMAGE_URL} overlay={heroOverlayVariant}>
          <div class="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-16">
            <div class="max-w-3xl">
              <p class="text-sm font-medium text-[color:var(--color-text-on-hero-muted)]">{heroEyebrow}</p>

              <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-on-hero)] md:text-5xl">
                {heroTitle}
              </h1>

              <p class="mt-3 max-w-[68ch] text-sm leading-6 text-[color:var(--color-text-on-hero-muted)] md:text-base">
                {heroDescription}
              </p>

              {activeExploreIntent ? (
                <ExplorePresetChips class="mt-6 max-w-3xl" intent={activeExploreIntent} />
              ) : null}

              {isGuidedMode && contextSurfaceText ? (
                <div class="mt-6 max-w-2xl rounded-2xl border border-white/35 bg-white/15 p-5 shadow-[var(--shadow-md)] backdrop-blur-[2px]">
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-on-hero-muted)]">
                    Current selection
                  </p>
                  <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-on-hero)] md:text-base">
                    {contextSurfaceText}
                  </p>
                  <p class="mt-2 text-sm text-[color:var(--color-text-on-hero-muted)]">
                    Use the suggested next steps below to move from inspiration to active trip planning.
                  </p>
                  <a
                    class="mt-4 inline-flex rounded-xl border border-white/40 bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-text-strong)] transition hover:bg-white/90"
                    href="/explore"
                  >
                    Clear selection
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </HeroBackground>
      </section>

      {isGuidedMode ? nextStepsSection : null}

      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Browse by vibe
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Start from how you want the trip to feel, then drill into destination and timing.
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VIBE_ITEMS.map((item) => (
            <a
              key={item.key}
              class={[
                't-card block p-4 text-sm font-medium text-[color:var(--color-text-strong)] transition hover:-translate-y-px hover:bg-white',
                activeTheme?.key === item.key ? 'border-[color:var(--color-action)] bg-white shadow-[var(--shadow-md)]' : '',
              ]}
              href={buildExploreHref({ theme: item.key })}
              aria-current={activeTheme?.key === item.key ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Flexible trip ideas
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Use themed starters when your destination is still open.
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLEX_IDEAS.map((idea) => (
            <a
              key={idea.key}
              href={buildExploreHref({ idea: idea.key })}
              class={[
                't-card block h-full rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] p-5 transition hover:-translate-y-px hover:bg-white',
                activeIdea?.key === idea.key ? 'border-[color:var(--color-action)] bg-white shadow-[var(--shadow-md)]' : '',
              ]}
              aria-current={activeIdea?.key === idea.key ? 'page' : undefined}
            >
              <h3 class="text-lg font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                {idea.title}
              </h3>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {idea.description}
              </p>
              <div class="mt-4 pt-1 text-sm font-medium text-[color:var(--color-action)]">
                Explore idea →
              </div>
            </a>
          ))}
        </div>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {context.popularTitle}
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              {context.popularDescription}
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedDestinations.map((destination) => (
            <article
              key={destination.key}
              class={[
                't-card p-5 transition hover:bg-white',
                activeDestination?.key === destination.key
                  ? 'border-[color:var(--color-action)] bg-white shadow-[var(--shadow-md)]'
                  : '',
              ]}
            >
              <div class="flex items-start justify-between gap-2">
                <div class="text-base font-semibold text-[color:var(--color-text-strong)]">
                  {destination.name}
                </div>
                {activeDestination?.key === destination.key ? (
                  <span class="t-badge">In focus</span>
                ) : null}
              </div>

              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {destination.blurb}
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  class="rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-white"
                  href={destination.flightLink.href}
                >
                  {destination.flightLink.label}
                </a>
                <a
                  class="rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-white"
                  href={destination.hotelLink.href}
                >
                  {destination.hotelLink.label}
                </a>
                <a
                  class="rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-white"
                  href={destination.carLink.href}
                >
                  {destination.carLink.label}
                </a>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
                <a class="text-sm font-medium text-[color:var(--color-action)]" href={destination.primaryLink.href}>
                  {destination.primaryLink.label} →
                </a>

                <a
                  class="text-xs font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-action)] hover:underline"
                  href={buildExploreHref({ destination: destination.key })}
                >
                  Use in Explore
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {!isGuidedMode ? nextStepsSection : null}
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Explore | Andacity'
  const description =
    'Discover trips by mood, season, or budget with discovery-first destination ideas across flights, stays, and car rentals.'
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
