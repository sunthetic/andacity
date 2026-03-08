import { SEED_CONFIG } from "../config/seed-config.js";
import { findTopTravelCity, getTopTravelCities } from "../cities/top-100.js";
import {
  createDeterministicRandom,
  deterministicId,
  hashParts,
} from "../fns/deterministic.js";
import { haversineKm } from "../fns/geo.js";
import {
  clamp,
  dayDiff,
  formatDuration,
  normalizeMinutes,
  parseIsoDate,
  toClock,
  windowFromMinutes,
} from "../fns/format.js";
import {
  pickOne,
  randomFloat,
  randomInt,
  weightedPick,
} from "../fns/random.js";

const AIRLINES = [
  "Delta",
  "United",
  "American",
  "Southwest",
  "JetBlue",
  "Alaska",
  "Air Canada",
  "Lufthansa",
  "British Airways",
  "Air France",
  "KLM",
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "ANA",
  "Japan Airlines",
  "Korean Air",
  "Turkish Airlines",
  "Iberia",
  "LATAM",
];

const CABIN_CLASS_WEIGHTS = [
  { value: "economy", weight: 60 },
  { value: "premium-economy", weight: 19 },
  { value: "business", weight: 16 },
  { value: "first", weight: 5 },
];

const STOPS_BY_DISTANCE = (distanceKm) => {
  if (distanceKm < 700) {
    return [
      { value: 0, weight: 72 },
      { value: 1, weight: 24 },
      { value: 2, weight: 4 },
    ];
  }

  if (distanceKm < 2500) {
    return [
      { value: 0, weight: 47 },
      { value: 1, weight: 39 },
      { value: 2, weight: 14 },
    ];
  }

  return [
    { value: 0, weight: 28 },
    { value: 1, weight: 51 },
    { value: 2, weight: 21 },
  ];
};

const CABIN_PRICE_MULTIPLIER = {
  economy: 1,
  "premium-economy": 1.38,
  business: 2.22,
  first: 3.4,
};

const SEASON_PRICE_MULTIPLIER = [0.92, 1.0, 1.08, 1.15, 1.24, 1.03];

const FLIGHT_WINDOWS = {
  morning: { min: 300, max: 719 },
  afternoon: { min: 720, max: 1019 },
  evening: { min: 1020, max: 1319 },
  overnight: { min: 1320, max: 299 },
};

const ORDERED_WINDOWS = ["morning", "afternoon", "evening", "overnight"];

const STOPS_LABEL = {
  0: "Nonstop",
  1: "1 stop",
  2: "2+ stops",
};

const cityBySlug = Object.fromEntries(
  getTopTravelCities().map((city) => [city.slug, city]),
);

const resolveCity = (input) => {
  if (!input) return null;
  if (cityBySlug[input]) return cityBySlug[input];
  return findTopTravelCity(input);
};

const anchorDate = parseIsoDate(SEED_CONFIG.availabilityAnchorDate);

export const getFlightSeasonBucket = (dateString, fallbackSeed = "default") => {
  if (!anchorDate) return 0;

  const parsed = parseIsoDate(dateString);
  if (!parsed) {
    return (
      hashParts(SEED_CONFIG.seed, "season-fallback", fallbackSeed) %
      SEED_CONFIG.flightSeasonBuckets
    );
  }

  const offset = dayDiff(anchorDate, parsed);
  const cycle =
    ((offset % SEED_CONFIG.availabilityWindowDays) +
      SEED_CONFIG.availabilityWindowDays) %
    SEED_CONFIG.availabilityWindowDays;
  const bucketSize = Math.floor(
    SEED_CONFIG.availabilityWindowDays / SEED_CONFIG.flightSeasonBuckets,
  );

  return clamp(
    Math.floor(cycle / Math.max(1, bucketSize)),
    0,
    SEED_CONFIG.flightSeasonBuckets - 1,
  );
};

const pickDepartureMinutes = (rand, window) => {
  const entry = FLIGHT_WINDOWS[window];
  if (!entry) return randomInt(rand, 300, 1320);

  if (window === "overnight") {
    const chooseLate = rand() > 0.38;
    if (chooseLate) return randomInt(rand, 1320, 1435);
    return randomInt(rand, 0, 299);
  }

  return randomInt(rand, entry.min, entry.max);
};

const resolveRouteCities = (fromSlug, toSlug, itineraryType, departDate) => {
  const cities = getTopTravelCities();

  let fromCity = resolveCity(fromSlug);
  let toCity = resolveCity(toSlug);

  if (!fromCity && toCity) {
    const rand = createDeterministicRandom(
      hashParts(
        SEED_CONFIG.seed,
        "from-fallback",
        toCity.slug,
        itineraryType,
        departDate || "",
      ),
    );
    fromCity =
      pickOne(
        rand,
        cities.filter((city) => city.slug !== toCity.slug),
      ) || cities[0];
  }

  if (!toCity && fromCity) {
    const rand = createDeterministicRandom(
      hashParts(
        SEED_CONFIG.seed,
        "to-fallback",
        fromCity.slug,
        itineraryType,
        departDate || "",
      ),
    );
    toCity =
      pickOne(
        rand,
        cities.filter((city) => city.slug !== fromCity.slug),
      ) || cities[1];
  }

  if (!fromCity && !toCity) {
    const rand = createDeterministicRandom(
      hashParts(
        SEED_CONFIG.seed,
        "both-fallback",
        fromSlug,
        toSlug,
        itineraryType,
        departDate || "",
      ),
    );
    fromCity = pickOne(rand, cities) || cities[0];
    toCity =
      pickOne(
        rand,
        cities.filter((city) => city.slug !== fromCity.slug),
      ) || cities[1];
  }

  if (fromCity?.slug === toCity?.slug) {
    const rand = createDeterministicRandom(
      hashParts(
        SEED_CONFIG.seed,
        "same-city",
        fromCity.slug,
        itineraryType,
        departDate || "",
      ),
    );
    toCity =
      pickOne(
        rand,
        cities.filter((city) => city.slug !== fromCity.slug),
      ) || cities[1];
  }

  return {
    fromCity,
    toCity,
  };
};

export const getFlightPairingsForCity = (originSlug) => {
  const origin = resolveCity(originSlug);
  if (!origin) return [];

  const itineraries = ["round-trip", "one-way"];
  const destinations = getTopTravelCities().filter(
    (city) => city.slug !== origin.slug,
  );
  const pairings = [];

  for (const destination of destinations) {
    for (const itineraryType of itineraries) {
      for (
        let seasonBucket = 0;
        seasonBucket < SEED_CONFIG.flightSeasonBuckets;
        seasonBucket += 1
      ) {
        pairings.push({
          from: origin.slug,
          to: destination.slug,
          itineraryType,
          seasonBucket,
          key: `${origin.slug}__${destination.slug}__${itineraryType}__s${seasonBucket}`,
        });
      }
    }
  }

  return pairings;
};

export const getFlightPairingCountByCity = () => {
  return getTopTravelCities().map((city) => ({
    city: city.slug,
    pairings: getFlightPairingsForCity(city.slug).length,
  }));
};

const baseDurationMinutes = (distanceKm) => {
  const cruise = distanceKm / 790;
  return clamp(Math.round(cruise * 60 + 34), 55, 920);
};

const computePrice = ({
  rand,
  distanceKm,
  stops,
  cabinClass,
  seasonBucket,
}) => {
  const distanceBase = 52 + distanceKm * randomFloat(rand, 0.08, 0.13, 4);
  const stopAdjustment = stops === 0 ? 32 : stops === 1 ? 6 : -24;
  const seasonal = SEASON_PRICE_MULTIPLIER[seasonBucket] || 1;
  const cabinMultiplier = CABIN_PRICE_MULTIPLIER[cabinClass] || 1;
  const demandNoise = randomInt(rand, -32, 96);

  const raw =
    (distanceBase + stopAdjustment + demandNoise) * cabinMultiplier * seasonal;
  return clamp(Math.round(raw), 69, 5200);
};

export const generateFlightsForRoute = (input) => {
  const itineraryType =
    input?.itineraryType === "one-way" ? "one-way" : "round-trip";
  const requestedCount = Number(input?.count) || SEED_CONFIG.flightsPerPairing;
  const count = Math.max(SEED_CONFIG.flightsPerPairing, requestedCount);

  const { fromCity, toCity } = resolveRouteCities(
    input?.fromSlug,
    input?.toSlug,
    itineraryType,
    input?.departDate,
  );

  if (!fromCity || !toCity) return [];

  const seasonBucket = getFlightSeasonBucket(
    input?.departDate,
    `${fromCity.slug}:${toCity.slug}:${itineraryType}`,
  );
  const routeSeed = hashParts(
    SEED_CONFIG.seed,
    "flights",
    fromCity.slug,
    toCity.slug,
    itineraryType,
    seasonBucket,
  );
  const distanceKm = haversineKm(fromCity, toCity);
  const baseDuration = baseDurationMinutes(distanceKm);

  const results = [];

  for (let index = 0; index < count; index += 1) {
    const rand = createDeterministicRandom(hashParts(routeSeed, index));
    const window = ORDERED_WINDOWS[index % ORDERED_WINDOWS.length];
    const departureMinutes = pickDepartureMinutes(rand, window);

    const stops = weightedPick(rand, STOPS_BY_DISTANCE(distanceKm));
    const cabinClass = weightedPick(rand, CABIN_CLASS_WEIGHTS);

    const layoverPenalty =
      stops === 0
        ? 0
        : randomInt(rand, 55, 105) * stops + randomInt(rand, 12, 42);
    const durationMinutes = clamp(
      baseDuration + layoverPenalty + randomInt(rand, -18, 36),
      50,
      1400,
    );
    const arrivalMinutes = normalizeMinutes(departureMinutes + durationMinutes);

    const originCode = pickOne(rand, fromCity.airportCodes) || "AIR";
    const destinationCode = pickOne(rand, toCity.airportCodes) || "AIR";

    const flight = {
      id: deterministicId(
        "flt",
        fromCity.slug,
        toCity.slug,
        itineraryType,
        seasonBucket,
        index,
      ),
      airline: pickOne(rand, AIRLINES) || "Andacity Air",
      origin: `${fromCity.name} (${originCode})`,
      destination: `${toCity.name} (${destinationCode})`,
      departureTime: toClock(departureMinutes),
      arrivalTime: toClock(arrivalMinutes),
      departureMinutes,
      arrivalMinutes,
      departureWindow: windowFromMinutes(departureMinutes),
      arrivalWindow: windowFromMinutes(arrivalMinutes),
      stops,
      stopsLabel: STOPS_LABEL[stops] || "1 stop",
      duration: formatDuration(durationMinutes),
      cabinClass,
      price: computePrice({
        rand,
        distanceKm,
        stops,
        cabinClass,
        seasonBucket,
      }),
      currency: "USD",
      seedMeta: {
        fromSlug: fromCity.slug,
        toSlug: toCity.slug,
        itineraryType,
        seasonBucket,
      },
    };

    results.push(flight);
  }

  return results;
};

export const getFlightRouteScaleSummary = () => {
  const pairings = getFlightPairingCountByCity();
  const minPairings = Math.min(...pairings.map((entry) => entry.pairings));
  const perPairing = SEED_CONFIG.flightsPerPairing;

  return {
    cities: pairings.length,
    minPairingsPerCity: minPairings,
    flightsPerPairing: perPairing,
    estimatedRows: pairings.reduce(
      (acc, entry) => acc + entry.pairings * perPairing,
      0,
    ),
  };
};
