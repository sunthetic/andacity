// @ts-nocheck
import {
  DEMO_IMAGE_SETS,
  SEED_CONFIG,
  carInventoryCountForCity,
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

const PROVIDERS = [
  "SwiftDrive",
  "Apex Rentals",
  "MetroCar",
  "Blue Route",
  "Skyline Auto",
  "Harbor Mobility",
  "Northstar Car Hire",
  "Jetway Rentals",
  "Citylane Auto",
  "OpenRoad",
];

const VEHICLE_CLASSES = [
  {
    key: "economy",
    category: "Economy",
    seats: 4,
    doors: 4,
    bags: "1 large + 1 small",
    base: 34,
  },
  {
    key: "compact",
    category: "Compact",
    seats: 5,
    doors: 4,
    bags: "1 large + 2 small",
    base: 39,
  },
  {
    key: "standard",
    category: "Standard",
    seats: 5,
    doors: 4,
    bags: "2 large + 1 small",
    base: 49,
  },
  {
    key: "full-size",
    category: "Full-size",
    seats: 5,
    doors: 4,
    bags: "2 large + 2 small",
    base: 58,
  },
  {
    key: "suv",
    category: "SUV",
    seats: 5,
    doors: 4,
    bags: "3 large + 1 small",
    base: 67,
  },
  {
    key: "minivan",
    category: "Minivan",
    seats: 7,
    doors: 5,
    bags: "3 large + 2 small",
    base: 79,
  },
  {
    key: "pickup",
    category: "Pickup",
    seats: 5,
    doors: 4,
    bags: "2 large + 1 small",
    base: 72,
  },
  {
    key: "luxury",
    category: "Luxury",
    seats: 5,
    doors: 4,
    bags: "2 large + 2 small",
    base: 98,
  },
  {
    key: "convertible",
    category: "Convertible",
    seats: 4,
    doors: 2,
    bags: "1 large + 1 small",
    base: 92,
  },
];

const INCLUSIONS_POOL = [
  "Unlimited mileage",
  "Mobile check-in",
  "Airport pickup",
  "City-center pickup",
  "Collision damage waiver options",
  "24/7 roadside assistance",
  "Flexible fuel policy",
  "Additional driver options",
  "Digital contract",
  "Fast return lane",
  "EV charging support",
];

const FUEL_POLICIES = [
  "Full-to-full",
  "Pre-purchase optional",
  "Return as received",
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
    config.carDensity.denseCityInventory,
    config.carDensity.secondaryCityInventory,
  ].join(":");
};

const cityCostMultiplier = (city, config) => {
  const rankFactor =
    (config.topCityCount - city.rank) / config.topCityCount;
  const expensive = new Set([
    "new-york",
    "london",
    "paris",
    "tokyo",
    "dubai",
    "zurich",
    "singapore",
  ]);
  return 0.9 + rankFactor * 0.36 + (expensive.has(city.slug) ? 0.34 : 0);
};

const pickupAreaForCity = (city, pickupType) => {
  if (pickupType === "city") {
    return `${city.name} City Center`;
  }

  const code = city.airportCodes[0] || "AIR";
  return `${code} Airport`;
};

const buildAvailability = (rand, city, index, count, config) => {
  const anchor = parseIsoDate(config.horizonStartDate);
  if (!anchor) {
    return {
      pickupStart: config.horizonStartDate,
      pickupEnd: config.horizonStartDate,
      minDays: 1,
      maxDays: 30,
      blockedWeekdays: [],
    };
  }

  const blockedWeekdays = [];
  const denseCity = isDenseInventoryCity(city, config);
  const nightlyMinimum = denseCity ? 3 : 1;
  const guaranteedNightly = Math.min(count, nightlyMinimum);
  const nightlyBaseline = index < guaranteedNightly;
  const weeklongFriendly = index < Math.max(guaranteedNightly, Math.ceil(count * 0.85));
  if (!nightlyBaseline && !weeklongFriendly && rand() > (denseCity ? 0.64 : 0.55)) {
    blockedWeekdays.push(randomInt(rand, 0, 6));
  }

  return {
    pickupStart: config.horizonStartDate,
    pickupEnd: config.horizonEndDate,
    minDays: nightlyBaseline
      ? 1
      : weeklongFriendly
        ? (rand() > 0.35 ? 1 : 2)
        : randomInt(rand, 1, 3),
    maxDays: weeklongFriendly ? randomInt(rand, 9, 30) : randomInt(rand, 5, 18),
    blockedWeekdays,
    pairingKey: `${city.slug}:${index}`,
  };
};

const buildOffers = (rand, cityMultiplier, preferredClass) => {
  const classes = [
    preferredClass,
    ...sampleUnique(
      rand,
      VEHICLE_CLASSES.filter((item) => item.key !== preferredClass.key),
      3,
    ),
  ];

  return classes.map((vehicleClass, index) => {
    const transmission = rand() > 0.2 ? "Automatic" : "Manual";
    const fuelType =
      vehicleClass.key === "luxury" && rand() > 0.45
        ? "Plug-in hybrid"
        : vehicleClass.key === "compact" && rand() > 0.72
          ? "Electric"
          : vehicleClass.key === "suv" && rand() > 0.68
            ? "Hybrid"
            : "Gasoline";
    const priceFrom = Math.round(
      (vehicleClass.base + randomInt(rand, -6, 16)) *
        cityMultiplier *
        (index >= 2 ? 1.25 : 1),
    );

    return {
      id: `${vehicleClass.key}-${index + 1}`,
      name: `${vehicleClass.category} (${transmission})`,
      category: vehicleClass.category,
      seats: vehicleClass.seats,
      bags: vehicleClass.bags,
      transmission,
      doors: vehicleClass.doors,
      ac: true,
      priceFrom: Math.max(24, priceFrom),
      freeCancellation: rand() > 0.22,
      payAtCounter: rand() > 0.4,
      badges:
        index === 0
          ? ["Best value"]
          : index === 1
            ? ["Top pick"]
            : index === 2
              ? ["Family-ready"]
              : ["Premium"],
      features: sampleUnique(
        rand,
        [
          "Unlimited mileage",
          "Mobile check-in",
          "Fuel: full-to-full",
          "Fast return lane",
          "Roadside assistance",
          `Fuel type: ${fuelType}`,
          vehicleClass.seats >= 7 ? "Third-row seating" : "Easy city parking",
        ],
        3,
      ),
    };
  });
};

const providerScore = (rating, priceFrom, freeCancellation, payAtCounter) => {
  return (
    rating * 0.62 +
    (freeCancellation ? 0.2 : 0) +
    (payAtCounter ? 0.15 : 0) +
    (Math.max(0, 160 - priceFrom) / 160) * 0.35
  );
};

export const generateCarRentalsForCity = (city, options = {}) => {
  const config = resolveConfig(options);
  const defaultCount = carInventoryCountForCity(city, config);
  const count = Math.max(1, Number(options.count) || defaultCount);
  const citySeed = hashParts(config.seed, "cars", city.slug);
  const rentals = [];

  for (let index = 0; index < count; index += 1) {
    const rand = createDeterministicRandom(hashParts(citySeed, index));
    const provider = pickOne(rand, PROVIDERS) || "Andacity Mobility";
    const preferredClass = pickOne(rand, VEHICLE_CLASSES) || VEHICLE_CLASSES[0];
    const pickupType = rand() > 0.36 ? "airport" : "city";
    const pickupArea = pickupAreaForCity(city, pickupType);

    const cityMultiplier = cityCostMultiplier(city, config);
    const offers = buildOffers(rand, cityMultiplier, preferredClass);
    const fromDaily = Math.min(...offers.map((offer) => offer.priceFrom));

    const rating = Math.max(
      3.3,
      Math.min(4.9, Number((3.5 + randomFloat(rand, 0, 1.3, 2)).toFixed(1))),
    );

    const rental = {
      slug: `${city.slug}-${preferredClass.key}-${String(index + 1).padStart(2, "0")}`,
      name: provider,
      city: city.name,
      region: city.region,
      country: city.country,
      cityQuery: city.slug,
      pickupArea,
      pickupAddressLine: `${randomInt(rand, 1, 980)} ${pickOne(rand, ["Terminal", "Central", "Harbor", "Market", "Transit"]) || "Terminal"} ${pickOne(rand, ["Way", "Rd", "Blvd", "Ave"]) || "Way"}`,
      currency: "USD",
      rating,
      reviewCount: randomInt(rand, 120, 19850),
      fromDaily,
      summary: `Reliable ${pickupType === "airport" ? "airport" : "city"} pickup in ${city.name} with transparent totals and flexible cancellation options.`,
      images: sampleUnique(rand, DEMO_IMAGE_SETS.cars, 3),
      inclusions: sampleUnique(rand, INCLUSIONS_POOL, randomInt(rand, 6, 9)),
      policies: {
        freeCancellation: rand() > 0.18,
        payAtCounter: rand() > 0.35,
        securityDepositRequired: rand() > 0.15,
        minDriverAge: weightedPick(rand, [
          { value: 21, weight: 60 },
          { value: 23, weight: 25 },
          { value: 25, weight: 15 },
        ]),
        fuelPolicy: pickOne(rand, FUEL_POLICIES) || "Full-to-full",
        cancellationBlurb:
          "Many offers allow free cancellation until a cutoff time. Review the selected offer terms before booking.",
        paymentBlurb:
          "Some offers are pay-at-counter while others are prepaid. The final checkout view shows exact payment timing.",
        feesBlurb:
          "Taxes, surcharges, and add-ons vary by dates and pickup location. Estimates are shown before checkout.",
        depositBlurb:
          "A refundable deposit can be required at pickup depending on vehicle class and payment method.",
      },
      offers,
      faq: [
        {
          q: "Can I pick up at the airport?",
          a: "Airport and city-center options are both included in this deterministic seed inventory.",
        },
        {
          q: "Are there unlimited mileage options?",
          a: "Most offers include unlimited mileage, with details shown per offer.",
        },
        {
          q: "Do rates vary by date?",
          a: "Yes. Availability and pricing windows vary deterministically across the rolling horizon.",
        },
      ],
      availability: buildAvailability(rand, city, index, count, config),
      seedMeta: {
        id: deterministicId(
          "car",
          config.seed,
          config.horizonStartDate,
          config.horizonDays,
          city.slug,
          index,
        ),
        score: providerScore(rating, fromDaily, rand() > 0.25, rand() > 0.4),
      },
    };

    rentals.push(rental);
  }

  return rentals;
};

const rentalsCache = new Map();
const rentalsBySlugCache = new Map();

export const generateCarRentalsInventory = (options = {}) => {
  const config = resolveConfig(options);
  const cacheKey = cacheKeyForConfig(config);
  if (rentalsCache.has(cacheKey)) return rentalsCache.get(cacheKey);

  const all = [];
  for (const city of getTopTravelCities()) {
    all.push(...generateCarRentalsForCity(city, { seedConfig: config }));
  }

  rentalsCache.set(cacheKey, all);
  return all;
};

export const carRentalsBySlug = (options = {}) => {
  const config = resolveConfig(options);
  const cacheKey = cacheKeyForConfig(config);
  if (rentalsBySlugCache.has(cacheKey)) return rentalsBySlugCache.get(cacheKey);

  const bySlug = Object.fromEntries(
    generateCarRentalsInventory({ seedConfig: config }).map((rental) => [
      rental.slug,
      rental,
    ]),
  );
  rentalsBySlugCache.set(cacheKey, bySlug);
  return bySlug;
};

export const getCarRentalBySlug = (slug, options = {}) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  return carRentalsBySlug(options)[key] || null;
};
