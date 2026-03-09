// @ts-nocheck
import {
  DEMO_IMAGE_SETS,
  SEED_CONFIG,
  hotelCountForCity,
  isDenseInventoryCity,
  resolveSeedConfig,
} from "../config/seed-config.js";
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
import { parseIsoDate } from "../fns/format.js";
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
    id: "double-queen",
    name: "Deluxe Double Queen",
    sleeps: 4,
    beds: "2 queen",
    sizeSqft: 410,
  },
  {
    id: "suite-1br",
    name: "One Bedroom Suite",
    sleeps: 4,
    beds: "1 king + sofa",
    sizeSqft: 520,
  },
  {
    id: "family-suite",
    name: "Family Suite",
    sleeps: 5,
    beds: "2 queen + sofa",
    sizeSqft: 590,
  },
  {
    id: "suite-premium",
    name: "Premium Suite",
    sleeps: 4,
    beds: "1 king + sofa",
    sizeSqft: 620,
  },
];

const resolveConfig = (options = {}) => {
  return resolveSeedConfig(options.seedConfig || {});
};

const cacheKeyForConfig = (config) => {
  return [
    config.seed,
    config.topCityCount,
    config.horizonStartDate,
    config.horizonDays,
    config.hotelDensity.denseCityHotels,
    config.hotelDensity.secondaryCityHotels,
  ].join(":");
};

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

const cityCostMultiplier = (city, config) => {
  const rankFactor =
    (config.topCityCount - city.rank) / config.topCityCount;
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
    const multiplier =
      index === 0
        ? 1
        : index === 1
          ? 1.16
          : index === 2
            ? 1.3
            : index === 3
              ? 1.44
              : 1.62;
    const priceFrom = Math.max(59, Math.round(nightlyBase * multiplier));
    const smokingToken =
      index === 0 || rand() > 0.72 ? "Non-smoking" : "Smoking optional";
    const occupancyToken =
      template.sleeps >= 5
        ? "Group-friendly layout"
        : template.sleeps >= 4
          ? "Family layout"
          : "Couples layout";

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
        index === 0
          ? ["Best value"]
          : index === 1
            ? ["Most booked"]
            : index === 2
              ? ["Top pick"]
              : index === 3
                ? ["Family-ready"]
                : ["Premium"],
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
          smokingToken,
          occupancyToken,
        ],
        3,
      ),
    };
  });
};

const buildAvailability = (rand, city, hotelIndex, count, config) => {
  const anchor = parseIsoDate(config.horizonStartDate);
  const end = parseIsoDate(config.horizonEndDate);
  if (!anchor) {
    return {
      checkInStart: config.horizonStartDate,
      checkInEnd: config.horizonStartDate,
      minNights: 1,
      maxNights: 14,
      blockedWeekdays: [],
    };
  }

  const blockedWeekdays = [];
  const denseCity = isDenseInventoryCity(city, config);
  const nightlyMinimum = denseCity ? 6 : 3;
  const guaranteedNightly = Math.min(count, nightlyMinimum);
  const continuityTargetIndex = Math.max(
    guaranteedNightly,
    Math.ceil(count * 0.7),
  );
  const weeklongFriendly = hotelIndex < Math.max(guaranteedNightly, Math.ceil(count * 0.8));
  const continuityFriendly = hotelIndex < continuityTargetIndex;
  const nightlyBaseline = hotelIndex < guaranteedNightly;

  if (!nightlyBaseline && !continuityFriendly && rand() > (denseCity ? 0.58 : 0.5)) {
    blockedWeekdays.push(randomInt(rand, 0, 6));
  }

  return {
    checkInStart: config.horizonStartDate,
    checkInEnd: end ? config.horizonEndDate : config.horizonStartDate,
    minNights: nightlyBaseline
      ? 1
      : continuityFriendly
        ? (rand() > 0.4 ? 1 : 2)
        : randomInt(rand, 1, 3),
    maxNights: weeklongFriendly ? randomInt(rand, 8, 16) : randomInt(rand, 5, 12),
    blockedWeekdays,
    pairingKey: `${city.slug}:${hotelIndex}`,
  };
};

export const generateHotelsForCity = (city, options = {}) => {
  const config = resolveConfig(options);
  const defaultCount = hotelCountForCity(city, config);
  const count = Math.max(3, Number(options.count) || defaultCount);
  const citySeed = hashParts(config.seed, "hotels", city.slug);
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

    const cityMultiplier = cityCostMultiplier(city, config);
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
    const availability = buildAvailability(rand, city, index, count, config);

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
          a: "Yes. Prices are deterministic mock rates that still vary by demand windows inside the rolling horizon.",
        },
      ],
      availability,
      seedMeta: {
        id: deterministicId(
          "hotel",
          config.seed,
          config.horizonStartDate,
          config.horizonDays,
          city.slug,
          index,
        ),
      },
    };

    hotels.push(hotel);
  }

  return hotels;
};

const hotelsCache = new Map();
const hotelsBySlugCache = new Map();

export const generateHotelsInventory = (options = {}) => {
  const config = resolveConfig(options);
  const cacheKey = cacheKeyForConfig(config);
  if (hotelsCache.has(cacheKey)) return hotelsCache.get(cacheKey);

  const allHotels = [];
  for (const city of getTopTravelCities()) {
    allHotels.push(...generateHotelsForCity(city, { seedConfig: config }));
  }

  hotelsCache.set(cacheKey, allHotels);
  return allHotels;
};

export const hotelsBySlug = (options = {}) => {
  const config = resolveConfig(options);
  const cacheKey = cacheKeyForConfig(config);
  if (hotelsBySlugCache.has(cacheKey)) return hotelsBySlugCache.get(cacheKey);
  const entries = generateHotelsInventory({ seedConfig: config }).map((hotel) => [
    hotel.slug,
    hotel,
  ]);
  const bySlug = Object.fromEntries(entries);
  hotelsBySlugCache.set(cacheKey, bySlug);
  return bySlug;
};

export const getHotelBySlug = (slug, options = {}) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  const hotelsMap = hotelsBySlug(options);
  return hotelsMap[key] || null;
};

export const hotelPairingCountByCity = (options = {}) => {
  const config = resolveConfig(options);
  return getTopTravelCities().map((city) => ({
    city: city.slug,
    count: hotelCountForCity(city, config),
  }));
};

export const hotelPropertyTypes = () => PROPERTY_TYPE_KEYWORDS.slice();
