import { DEMO_IMAGE_SETS, SEED_CONFIG } from "../config/seed-config.js";
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

const cityCostMultiplier = (city) => {
  const rankFactor =
    (SEED_CONFIG.topCityCount - city.rank) / SEED_CONFIG.topCityCount;
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

const buildAvailability = (rand, citySlug, index) => {
  const anchor = parseIsoDate(SEED_CONFIG.availabilityAnchorDate);
  if (!anchor) {
    return {
      pickupStart: SEED_CONFIG.availabilityAnchorDate,
      pickupEnd: SEED_CONFIG.availabilityAnchorDate,
      minDays: 1,
      maxDays: 30,
      blockedWeekdays: [],
    };
  }

  const startOffset = randomInt(rand, 0, 80);
  const span = randomInt(rand, 280, 680);

  const start = addDays(anchor, startOffset);
  const end = addDays(start, span);

  const blockedWeekdays = [];
  if (rand() > 0.7) blockedWeekdays.push(randomInt(rand, 0, 6));

  return {
    pickupStart: toIsoDate(start),
    pickupEnd: toIsoDate(end),
    minDays: randomInt(rand, 1, 3),
    maxDays: randomInt(rand, 12, 30),
    blockedWeekdays,
    pairingKey: `${citySlug}:${index}`,
  };
};

const buildOffers = (rand, cityMultiplier, preferredClass) => {
  const classes = [
    preferredClass,
    ...sampleUnique(
      rand,
      VEHICLE_CLASSES.filter((item) => item.key !== preferredClass.key),
      2,
    ),
  ];

  return classes.map((vehicleClass, index) => {
    const transmission = rand() > 0.2 ? "Automatic" : "Manual";
    const priceFrom = Math.round(
      (vehicleClass.base + randomInt(rand, -6, 16)) *
        cityMultiplier *
        (index === 2 ? 1.25 : 1),
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
        index === 0 ? ["Best value"] : index === 1 ? ["Top pick"] : ["Premium"],
      features: sampleUnique(
        rand,
        [
          "Unlimited mileage",
          "Mobile check-in",
          "Fuel: full-to-full",
          "Fast return lane",
          "Roadside assistance",
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
  const count = Math.max(20, Number(options.count) || SEED_CONFIG.carsPerCity);
  const citySeed = hashParts(SEED_CONFIG.seed, "cars", city.slug);
  const rentals = [];

  for (let index = 0; index < count; index += 1) {
    const rand = createDeterministicRandom(hashParts(citySeed, index));
    const provider = pickOne(rand, PROVIDERS) || "Andacity Mobility";
    const preferredClass = pickOne(rand, VEHICLE_CLASSES) || VEHICLE_CLASSES[0];
    const pickupType = rand() > 0.36 ? "airport" : "city";
    const pickupArea = pickupAreaForCity(city, pickupType);

    const cityMultiplier = cityCostMultiplier(city);
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
          a: "Yes. Availability and pricing windows vary deterministically by route and date inputs.",
        },
      ],
      availability: buildAvailability(rand, city.slug, index),
      seedMeta: {
        id: deterministicId("car", city.slug, index),
        score: providerScore(rating, fromDaily, rand() > 0.25, rand() > 0.4),
      },
    };

    rentals.push(rental);
  }

  return rentals;
};

let rentalsCache = null;
let rentalsBySlugCache = null;

export const generateCarRentalsInventory = () => {
  if (rentalsCache) return rentalsCache;

  const all = [];
  for (const city of getTopTravelCities()) {
    all.push(...generateCarRentalsForCity(city));
  }

  rentalsCache = all;
  return rentalsCache;
};

export const carRentalsBySlug = () => {
  if (rentalsBySlugCache) return rentalsBySlugCache;

  rentalsBySlugCache = Object.fromEntries(
    generateCarRentalsInventory().map((rental) => [rental.slug, rental]),
  );
  return rentalsBySlugCache;
};

export const getCarRentalBySlug = (slug) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  return carRentalsBySlug()[key] || null;
};
