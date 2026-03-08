// @ts-nocheck
import { SEED_CONFIG, DEMO_IMAGE_SETS } from "../config/seed-config.js";
import {
  createDeterministicRandom,
  deterministicId,
  hashParts,
} from "../fns/deterministic.js";
import {
  pickOne,
  randomFloat,
  randomInt,
  sampleUnique,
  weightedPick,
} from "../fns/random.js";
import { addDays, parseIsoDate, toIsoDate } from "../fns/format.js";
import { getTopTravelCities } from "../cities/top-100.js";

const HOTEL_BRANDS = [
  "Harborline",
  "Summit House",
  "Atlas",
  "Northlight",
  "Luma",
  "Grand Meridian",
  "Bluebird",
  "Civic Stay",
  "Aster",
  "Canopy Lane",
  "Ember",
  "Foundry",
];

const HOTEL_STYLE_WORDS = [
  "Suites",
  "Hotel",
  "Residences",
  "House",
  "Inn",
  "Lodge",
  "Resort",
  "Collection",
];

const AMENITIES_POOL = [
  "Free Wi-Fi",
  "Pool",
  "Gym",
  "Breakfast available",
  "Parking",
  "Air conditioning",
  "Pet-friendly",
  "24h front desk",
  "Workspace",
  "Spa",
  "Hot tub",
  "Laundry",
  "Restaurant",
  "Room service",
  "Airport shuttle",
  "Family rooms",
  "Beachfront",
  "EV charging",
  "Kitchenette",
];

const NEIGHBORHOOD_BY_REGION = {
  default: [
    "Downtown",
    "City Center",
    "Waterfront",
    "Old Town",
    "Midtown",
    "Central District",
  ],
  us: [
    "Downtown",
    "Midtown",
    "Waterfront",
    "Airport District",
    "Financial District",
    "Historic Quarter",
  ],
  europe: [
    "Old Town",
    "City Center",
    "Riverside",
    "Historic Core",
    "Museum District",
    "Business District",
  ],
  asia: [
    "City Center",
    "Central Business District",
    "Riverside",
    "Marina District",
    "Shopping District",
    "Old Quarter",
  ],
  beach: [
    "Beachfront",
    "Marina",
    "Coastal Strip",
    "Harbor District",
    "Resort Zone",
    "Boardwalk",
  ],
};

const PROPERTY_TYPE_KEYWORDS = [
  "hotel",
  "resort",
  "lodge",
  "aparthotel",
  "motel",
];

const ROOM_TEMPLATES = [
  {
    id: "studio-king",
    name: "Studio King",
    sleeps: 2,
    beds: "1 king",
    sizeSqft: 320,
  },
  {
    id: "suite-1br",
    name: "One Bedroom Suite",
    sleeps: 4,
    beds: "1 king + sofa",
    sizeSqft: 520,
  },
  {
    id: "suite-premium",
    name: "Premium Suite",
    sleeps: 4,
    beds: "1 king + sofa",
    sizeSqft: 620,
  },
];

const normalizeCountry = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isBeachCity = (slug) => {
  const beachTokens = [
    "miami",
    "honolulu",
    "san-diego",
    "cancun",
    "cabo-san-lucas",
    "puerto-vallarta",
    "rio-de-janeiro",
    "nice",
    "phuket",
    "denpasar",
    "cape-town",
  ];
  return beachTokens.includes(slug);
};

const neighborhoodPoolForCity = (city) => {
  if (isBeachCity(city.slug)) return NEIGHBORHOOD_BY_REGION.beach;

  const country = normalizeCountry(city.country);
  if (
    country === "united states" ||
    country === "canada" ||
    country === "mexico" ||
    country === "puerto rico"
  ) {
    return NEIGHBORHOOD_BY_REGION.us;
  }

  if (
    [
      "france",
      "spain",
      "italy",
      "portugal",
      "germany",
      "netherlands",
      "switzerland",
      "belgium",
      "denmark",
      "sweden",
      "norway",
      "finland",
      "iceland",
      "united kingdom",
      "ireland",
      "austria",
      "hungary",
      "greece",
      "turkey",
      "czechia",
    ].includes(country)
  ) {
    return NEIGHBORHOOD_BY_REGION.europe;
  }

  if (
    [
      "japan",
      "south korea",
      "singapore",
      "thailand",
      "vietnam",
      "indonesia",
      "malaysia",
      "hong kong",
      "taiwan",
      "china",
      "india",
    ].includes(country)
  ) {
    return NEIGHBORHOOD_BY_REGION.asia;
  }

  return NEIGHBORHOOD_BY_REGION.default;
};

const starsFromRand = (rand) => {
  return weightedPick(rand, [
    { value: 2, weight: 6 },
    { value: 3, weight: 24 },
    { value: 4, weight: 44 },
    { value: 5, weight: 26 },
  ]);
};

const propertyTypeFromRand = (rand) => {
  return weightedPick(rand, [
    { value: "hotel", weight: 48 },
    { value: "resort", weight: 15 },
    { value: "lodge", weight: 10 },
    { value: "aparthotel", weight: 18 },
    { value: "motel", weight: 9 },
  ]);
};

const cityCostMultiplier = (city) => {
  const rankFactor =
    (SEED_CONFIG.topCityCount - city.rank) / SEED_CONFIG.topCityCount;
  const expensive = new Set([
    "new-york",
    "london",
    "paris",
    "tokyo",
    "zurich",
    "geneva",
    "dubai",
    "singapore",
    "sydney",
  ]);
  const value = expensive.has(city.slug) ? 1.28 : 1;
  return 0.9 + rankFactor * 0.5 + value * 0.25;
};

const buildSummary = (city, propertyType, neighborhood) => {
  const prefix =
    propertyType === "resort"
      ? "Relaxed resort-style stay"
      : propertyType === "lodge"
        ? "Comfort-focused lodge stay"
        : propertyType === "aparthotel"
          ? "Apartment-style hotel stay"
          : propertyType === "motel"
            ? "Efficient roadside-style stay"
            : "Modern city stay";

  return `${prefix} in ${city.name}'s ${neighborhood}. Transparent totals, clear policies, and reliable service for planning-first trips.`;
};

const buildRooms = (rand, nightlyBase) => {
  return ROOM_TEMPLATES.map((template, index) => {
    const multiplier = index === 0 ? 1 : index === 1 ? 1.27 : 1.55;
    const priceFrom = Math.max(59, Math.round(nightlyBase * multiplier));

    return {
      id: template.id,
      name: template.name,
      sleeps: template.sleeps,
      beds: template.beds,
      sizeSqft: template.sizeSqft + randomInt(rand, -20, 45),
      priceFrom,
      refundable: rand() > 0.22,
      payLater: rand() > 0.35,
      badges:
        index === 0 ? ["Best value"] : index === 1 ? ["Top pick"] : ["Premium"],
      features: sampleUnique(
        rand,
        [
          "City view",
          "Balcony",
          "Workspace",
          "Kitchenette",
          "High floor",
          "Water view",
          "Smart TV",
        ],
        3,
      ),
    };
  });
};

const buildAvailability = (rand, citySlug, hotelIndex) => {
  const anchor = parseIsoDate(SEED_CONFIG.availabilityAnchorDate);
  if (!anchor) {
    return {
      checkInStart: SEED_CONFIG.availabilityAnchorDate,
      checkInEnd: SEED_CONFIG.availabilityAnchorDate,
      minNights: 1,
      maxNights: 14,
      blockedWeekdays: [],
    };
  }

  const startOffset = randomInt(rand, 0, 90);
  const span = randomInt(rand, 250, 620);
  const start = addDays(anchor, startOffset);
  const end = addDays(start, span);

  const blockedWeekdays = [];
  if (rand() > 0.65) blockedWeekdays.push(randomInt(rand, 0, 6));
  if (rand() > 0.82) {
    const day = randomInt(rand, 0, 6);
    if (!blockedWeekdays.includes(day)) blockedWeekdays.push(day);
  }

  return {
    checkInStart: toIsoDate(start),
    checkInEnd: toIsoDate(end),
    minNights: randomInt(rand, 1, 3),
    maxNights: randomInt(rand, 9, 16),
    blockedWeekdays,
    pairingKey: `${citySlug}:${hotelIndex}`,
  };
};

export const generateHotelsForCity = (city, options = {}) => {
  const count = Math.max(
    10,
    Number(options.count) || SEED_CONFIG.hotelsPerCity,
  );
  const citySeed = hashParts(SEED_CONFIG.seed, "hotels", city.slug);
  const hotels = [];

  for (let index = 0; index < count; index += 1) {
    const rand = createDeterministicRandom(hashParts(citySeed, index));
    const neighborhood =
      pickOne(rand, neighborhoodPoolForCity(city)) || "City Center";
    const stars = starsFromRand(rand);
    const propertyType = propertyTypeFromRand(rand);
    const nameBrand = pickOne(rand, HOTEL_BRANDS) || "Andacity";
    const styleWord = pickOne(rand, HOTEL_STYLE_WORDS) || "Hotel";
    const slug = `${city.slug}-${propertyType}-${String(index + 1).padStart(2, "0")}`;

    const cityMultiplier = cityCostMultiplier(city);
    const starMultiplier = 0.72 + stars * 0.19;
    const propertyMultiplier =
      propertyType === "resort"
        ? 1.26
        : propertyType === "lodge"
          ? 0.95
          : propertyType === "aparthotel"
            ? 1.08
            : propertyType === "motel"
              ? 0.68
              : 1;

    const nightlyBase = Math.round(
      (68 + randomInt(rand, 10, 180)) *
        cityMultiplier *
        starMultiplier *
        propertyMultiplier,
    );
    const fromNightly = Math.max(55, nightlyBase);

    const amenities = sampleUnique(
      rand,
      AMENITIES_POOL,
      randomInt(rand, 8, 13),
    );
    const availability = buildAvailability(rand, city.slug, index);

    const ratingBase = 3.4 + stars * 0.25 + randomFloat(rand, -0.3, 0.45, 2);
    const rating = Math.max(3.2, Math.min(4.9, Number(ratingBase.toFixed(1))));

    const hotel = {
      slug,
      name: `${nameBrand} ${styleWord}`,
      city: city.name,
      region: city.region,
      country: city.country,
      cityQuery: city.slug,
      neighborhood,
      propertyType,
      addressLine: `${randomInt(rand, 10, 989)} ${pickOne(rand, ["Main", "Market", "Harbor", "River", "Central", "Union", "Ocean", "King"]) || "Central"} ${pickOne(rand, ["St", "Ave", "Blvd", "Rd"]) || "St"}`,
      currency: "USD",
      stars,
      rating,
      reviewCount: randomInt(rand, 150, 18500),
      fromNightly,
      summary: buildSummary(city, propertyType, neighborhood),
      images: sampleUnique(rand, DEMO_IMAGE_SETS.hotels, 3),
      amenities,
      policies: {
        freeCancellation: rand() > 0.18,
        payLater: rand() > 0.35,
        noResortFees: rand() > 0.7,
        checkInTime:
          pickOne(rand, ["2:00 PM", "3:00 PM", "4:00 PM"]) || "3:00 PM",
        checkOutTime:
          pickOne(rand, ["10:00 AM", "11:00 AM", "12:00 PM"]) || "11:00 AM",
        cancellationBlurb:
          "Many room types include free cancellation until a cutoff time. Always verify room terms before booking.",
        paymentBlurb:
          "Some offers support pay-later and others require prepayment. The selected room shows exact timing.",
        feesBlurb:
          "Taxes and property fees vary by stay dates and room selection. Estimated totals are shown before checkout.",
      },
      rooms: buildRooms(rand, fromNightly),
      faq: [
        {
          q: `Is ${city.name} city tax included?`,
          a: "Quoted totals include estimated taxes and mandatory fees when available.",
        },
        {
          q: "Can I reserve now and pay later?",
          a: "Pay-later availability depends on the room and rate plan.",
        },
        {
          q: "Do rates change by date?",
          a: "Yes. Prices are deterministic mock rates that still vary by date and demand windows.",
        },
      ],
      availability,
      seedMeta: {
        id: deterministicId("hotel", city.slug, index),
      },
    };

    hotels.push(hotel);
  }

  return hotels;
};

let hotelsCache = null;
let hotelsBySlugCache = null;

export const generateHotelsInventory = () => {
  if (hotelsCache) return hotelsCache;

  const allHotels = [];
  for (const city of getTopTravelCities()) {
    allHotels.push(...generateHotelsForCity(city));
  }

  hotelsCache = allHotels;
  return hotelsCache;
};

export const hotelsBySlug = () => {
  if (hotelsBySlugCache) return hotelsBySlugCache;
  const entries = generateHotelsInventory().map((hotel) => [hotel.slug, hotel]);
  hotelsBySlugCache = Object.fromEntries(entries);
  return hotelsBySlugCache;
};

export const getHotelBySlug = (slug) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  const hotelsMap = hotelsBySlug();
  return hotelsMap[key] || null;
};

export const hotelPairingCountByCity = () => {
  const count = Math.max(10, SEED_CONFIG.hotelsPerCity);
  return getTopTravelCities().map((city) => ({ city: city.slug, count }));
};

export const hotelPropertyTypes = () => PROPERTY_TYPE_KEYWORDS.slice();
