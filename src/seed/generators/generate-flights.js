// @ts-nocheck
import {
  SEED_CONFIG,
  getRollingHorizonDates,
  resolveSeedConfig,
} from "../config/seed-config.js";
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
import { pickOne, randomFloat, randomInt, sampleUnique } from "../fns/random.js";
import { findTopTravelCity, getTopTravelCities } from "../cities/top-100.js";

const AIRLINE_GROUPS = {
  northAmerica: [
    "Delta",
    "United",
    "American",
    "Southwest",
    "JetBlue",
    "Alaska",
    "Air Canada",
    "WestJet",
  ],
  europe: [
    "British Airways",
    "Lufthansa",
    "Air France",
    "KLM",
    "Iberia",
    "Turkish Airlines",
    "Swiss",
    "ITA Airways",
  ],
  asiaPacific: [
    "Singapore Airlines",
    "ANA",
    "Japan Airlines",
    "Korean Air",
    "Cathay Pacific",
    "Qantas",
    "Air India",
    "Malaysia Airlines",
  ],
  gulfAfrica: [
    "Emirates",
    "Qatar Airways",
    "Etihad",
    "Turkish Airlines",
    "Saudia",
    "Ethiopian Airlines",
    "Kenya Airways",
  ],
  global: [
    "Delta",
    "United",
    "American",
    "Lufthansa",
    "British Airways",
    "Air France",
    "KLM",
    "Emirates",
    "Qatar Airways",
    "Singapore Airlines",
    "Turkish Airlines",
  ],
};

const SEASON_PRICE_MULTIPLIER = [0.94, 1.0, 1.06, 1.12, 1.18, 1.03];

const CABIN_PRICE_MULTIPLIER = {
  economy: 1,
  "premium-economy": 1.34,
  business: 2.18,
  first: 3.22,
};

const WINDOW_SEQUENCE_BY_COUNT = {
  5: ["morning", "morning", "afternoon", "evening", "overnight"],
  6: ["morning", "morning", "afternoon", "afternoon", "evening", "overnight"],
  7: [
    "morning",
    "morning",
    "afternoon",
    "afternoon",
    "evening",
    "evening",
    "overnight",
  ],
};

const WINDOW_RANGE = {
  morning: { min: 315, max: 705 },
  afternoon: { min: 720, max: 1005 },
  evening: { min: 1020, max: 1290 },
  overnight: { min: 1320, max: 1430, alternateMax: 250 },
};

const MACRO_REGION_BY_COUNTRY = {
  "united states": "north-america",
  canada: "north-america",
  mexico: "north-america",
  "puerto rico": "north-america",
  brazil: "latin-america",
  argentina: "latin-america",
  peru: "latin-america",
  chile: "latin-america",
  colombia: "latin-america",
  "united kingdom": "europe",
  ireland: "europe",
  france: "europe",
  italy: "europe",
  spain: "europe",
  portugal: "europe",
  netherlands: "europe",
  germany: "europe",
  czechia: "europe",
  austria: "europe",
  hungary: "europe",
  greece: "europe",
  turkey: "europe",
  switzerland: "europe",
  belgium: "europe",
  denmark: "europe",
  sweden: "europe",
  norway: "europe",
  finland: "europe",
  iceland: "europe",
  poland: "europe",
  romania: "europe",
  bulgaria: "europe",
  estonia: "europe",
  latvia: "europe",
  lithuania: "europe",
  croatia: "europe",
  slovenia: "europe",
  "united arab emirates": "middle-east-africa",
  qatar: "middle-east-africa",
  "saudi arabia": "middle-east-africa",
  israel: "middle-east-africa",
  egypt: "middle-east-africa",
  morocco: "middle-east-africa",
  "south africa": "middle-east-africa",
  kenya: "middle-east-africa",
  jordan: "middle-east-africa",
  oman: "middle-east-africa",
  ethiopia: "middle-east-africa",
  ghana: "middle-east-africa",
  mauritius: "middle-east-africa",
  tanzania: "middle-east-africa",
  japan: "asia-pacific",
  "south korea": "asia-pacific",
  singapore: "asia-pacific",
  thailand: "asia-pacific",
  vietnam: "asia-pacific",
  indonesia: "asia-pacific",
  malaysia: "asia-pacific",
  "hong kong": "asia-pacific",
  taiwan: "asia-pacific",
  china: "asia-pacific",
  india: "asia-pacific",
  philippines: "asia-pacific",
  cambodia: "asia-pacific",
  "sri lanka": "asia-pacific",
  maldives: "asia-pacific",
  nepal: "asia-pacific",
  australia: "asia-pacific",
  "new zealand": "asia-pacific",
};

const resolveConfig = (options = {}) => {
  return resolveSeedConfig(options.seedConfig || {});
};

const routeNetworkCache = new Map();

const normalizeCountry = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const macroRegionForCity = (city) => {
  return MACRO_REGION_BY_COUNTRY[normalizeCountry(city?.country)] || "global";
};

const primaryAirport = (city) => {
  return city?.airportCodes?.[0] || "AIR";
};

const majorCitySet = (cities) => {
  return new Set(
    cities
      .filter((city) => city.rank <= 20)
      .map((city) => city.slug),
  );
};

const baseDurationMinutes = (distanceKm) => {
  const cruise = distanceKm / 785;
  return clamp(Math.round(cruise * 60 + 38), 55, 920);
};

const getFlightSeasonBucket = (dateString, fallbackSeed = "default", options = {}) => {
  const config = resolveConfig(options);
  const anchorDate = parseIsoDate(config.horizonStartDate);
  if (!anchorDate) return 0;

  const parsed = parseIsoDate(dateString);
  if (!parsed) {
    return hashParts(config.seed, "season-fallback", fallbackSeed) %
      config.flightSeasonBuckets;
  }

  const offset = dayDiff(anchorDate, parsed);
  const cycle =
    ((offset % config.horizonDays) + config.horizonDays) % config.horizonDays;
  const bucketSize = Math.max(
    1,
    Math.floor(config.horizonDays / config.flightSeasonBuckets),
  );

  return clamp(
    Math.floor(cycle / bucketSize),
    0,
    config.flightSeasonBuckets - 1,
  );
};

const routePriorityScore = (origin, destination, config) => {
  const distanceKm = haversineKm(origin, destination);
  const sameCountry = origin.country === destination.country;
  const sameMacro = macroRegionForCity(origin) === macroRegionForCity(destination);
  const topDemand = Math.max(0, config.topCityCount - destination.rank) * 3.6;
  const longHaulWindow =
    distanceKm >= 2200 && distanceKm <= 11800 ? 15 : distanceKm < 500 ? -8 : 4;
  const sameCountryBonus = sameCountry ? 22 : 0;
  const sameMacroBonus = !sameCountry && sameMacro ? 10 : 0;
  const regionalBridgeBonus = !sameMacro ? 11 : 0;
  const hashBonus =
    (hashParts(config.seed, "route-priority", origin.slug, destination.slug) %
      1000) /
    1000;

  return (
    topDemand +
    longHaulWindow +
    sameCountryBonus +
    sameMacroBonus +
    regionalBridgeBonus +
    hashBonus
  );
};

const airlinePoolForRoute = (origin, destination, distanceKm) => {
  if (origin.country === destination.country) {
    if (origin.country === "United States" || origin.country === "Canada") {
      return AIRLINE_GROUPS.northAmerica;
    }
    if (macroRegionForCity(origin) === "europe") return AIRLINE_GROUPS.europe;
    if (macroRegionForCity(origin) === "asia-pacific")
      return AIRLINE_GROUPS.asiaPacific;
  }

  const macroRegions = new Set([
    macroRegionForCity(origin),
    macroRegionForCity(destination),
  ]);
  if (macroRegions.has("north-america") && macroRegions.has("europe")) {
    return [
      "Delta",
      "United",
      "American",
      "British Airways",
      "Lufthansa",
      "Air France",
      "KLM",
      "Iberia",
    ];
  }
  if (macroRegions.has("asia-pacific")) {
    return distanceKm > 7000
      ? [...AIRLINE_GROUPS.asiaPacific, ...AIRLINE_GROUPS.global]
      : [...AIRLINE_GROUPS.asiaPacific, ...AIRLINE_GROUPS.gulfAfrica];
  }
  if (macroRegions.has("middle-east-africa")) {
    return [...AIRLINE_GROUPS.gulfAfrica, ...AIRLINE_GROUPS.global];
  }

  return AIRLINE_GROUPS.global;
};

const buildRouteNetwork = (config) => {
  const cacheKey = [
    config.seed,
    config.topCityCount,
    config.flightDensity.targetRoutesPerCity,
  ].join(":");
  if (routeNetworkCache.has(cacheKey)) {
    return routeNetworkCache.get(cacheKey);
  }

  const cities = getTopTravelCities();
  const majors = majorCitySet(cities);
  const allRoutes = [];
  const routesByOrigin = new Map();
  const routesByKey = new Map();

  for (const origin of cities) {
    const forcedDestinations = new Set();
    if (majors.has(origin.slug)) {
      for (const city of cities) {
        if (city.slug !== origin.slug && majors.has(city.slug)) {
          forcedDestinations.add(city.slug);
        }
      }
    }

    const sameCountryTop = cities
      .filter(
        (candidate) =>
          candidate.slug !== origin.slug && candidate.country === origin.country,
      )
      .sort((left, right) => left.rank - right.rank)
      .slice(0, 10);
    for (const city of sameCountryTop) forcedDestinations.add(city.slug);

    const prioritized = cities
      .filter((candidate) => candidate.slug !== origin.slug)
      .map((candidate) => ({
        city: candidate,
        score: routePriorityScore(origin, candidate, config),
      }))
      .sort((left, right) => right.score - left.score);

    const selected = [];
    const seen = new Set();

    for (const entry of prioritized) {
      if (!forcedDestinations.has(entry.city.slug)) continue;
      selected.push(entry.city);
      seen.add(entry.city.slug);
    }

    for (const entry of prioritized) {
      if (selected.length >= config.flightDensity.targetRoutesPerCity) break;
      if (seen.has(entry.city.slug)) continue;
      selected.push(entry.city);
      seen.add(entry.city.slug);
    }

    const routeEntries = selected.map((destination) => {
      const distanceKm = haversineKm(origin, destination);
      const routeKey = `${origin.slug}:${destination.slug}`;
      const airlinePool = airlinePoolForRoute(origin, destination, distanceKm);
      const popularityScore =
        (origin.rank <= 20 ? 2 : 0) +
        (destination.rank <= 20 ? 2 : 0) +
        (origin.country === destination.country ? 1 : 0) +
        (macroRegionForCity(origin) === macroRegionForCity(destination) ? 1 : 0);
      const dailyItineraries =
        popularityScore >= 5
          ? config.flightDensity.extraPopularDailyItineraries
          : popularityScore >= 3
            ? config.flightDensity.popularDailyItineraries
            : config.flightDensity.baseDailyItineraries;

      const route = {
        from: origin.slug,
        to: destination.slug,
        key: routeKey,
        originAirport: primaryAirport(origin),
        destinationAirport: primaryAirport(destination),
        distanceKm,
        isPopular: popularityScore >= 3,
        dailyItineraries,
        airlinePool,
      };

      allRoutes.push(route);
      routesByKey.set(routeKey, route);
      return route;
    });

    routesByOrigin.set(origin.slug, routeEntries);
  }

  const summary = {
    cities: cities.length,
    minRoutesPerCity: Math.min(
      ...Array.from(routesByOrigin.values()).map((routes) => routes.length),
    ),
    totalDirectedRoutes: allRoutes.length,
    majorCityCount: majors.size,
  };

  const payload = {
    cities,
    allRoutes,
    routesByOrigin,
    routesByKey,
    majors,
    summary,
  };
  routeNetworkCache.set(cacheKey, payload);
  return payload;
};

const resolveRouteCities = (fromSlug, toSlug) => {
  const cities = getTopTravelCities();
  let fromCity = findTopTravelCity(fromSlug);
  let toCity = findTopTravelCity(toSlug);

  if (!fromCity && toCity) {
    fromCity =
      cities.find((city) => city.slug !== toCity.slug) ||
      cities[0] ||
      null;
  }
  if (!toCity && fromCity) {
    toCity =
      cities.find((city) => city.slug !== fromCity.slug) ||
      cities[1] ||
      null;
  }
  if (!fromCity && !toCity) {
    fromCity = cities[0] || null;
    toCity = cities[1] || null;
  }

  if (fromCity?.slug === toCity?.slug) {
    toCity =
      cities.find((city) => city.slug !== fromCity.slug) ||
      cities[1] ||
      null;
  }

  return {
    fromCity,
    toCity,
  };
};

const routeForInput = (input, config) => {
  const network = buildRouteNetwork(config);
  if (input?.fromSlug && input?.toSlug) {
    return (
      network.routesByKey.get(`${input.fromSlug}:${input.toSlug}`) || null
    );
  }
  return null;
};

const buildAdhocRoute = (fromCity, toCity, config) => {
  const distanceKm = haversineKm(fromCity, toCity);
  const popularityScore =
    (fromCity.rank <= 20 ? 2 : 0) +
    (toCity.rank <= 20 ? 2 : 0) +
    (fromCity.country === toCity.country ? 1 : 0);
  return {
    from: fromCity.slug,
    to: toCity.slug,
    key: `${fromCity.slug}:${toCity.slug}`,
    originAirport: primaryAirport(fromCity),
    destinationAirport: primaryAirport(toCity),
    distanceKm,
    isPopular: popularityScore >= 3,
    dailyItineraries:
      popularityScore >= 4
        ? config.flightDensity.popularDailyItineraries
        : config.flightDensity.baseDailyItineraries,
    airlinePool: airlinePoolForRoute(fromCity, toCity, distanceKm),
  };
};

const serviceDayMultiplier = (serviceDate) => {
  const parsed = parseIsoDate(serviceDate);
  if (!parsed) return 1;
  const weekday = parsed.getUTCDay();
  if (weekday === 5 || weekday === 6) return 1.06;
  if (weekday === 0) return 1.04;
  return 1;
};

const stopsForRoute = (rand, distanceKm, slotIndex, routeKey, serviceDate) => {
  const offset = hashParts(routeKey, serviceDate) % 7;
  const shortHaul = [0, 0, 0, 0, 1, 0, 1];
  const mediumHaul = [0, 0, 1, 1, 0, 1, 2];
  const longHaul = [0, 1, 1, 2, 0, 1, 2];
  const ultraLongHaul = [1, 1, 0, 2, 1, 2, 1];
  const sequence =
    distanceKm < 700
      ? shortHaul
      : distanceKm < 2500
        ? mediumHaul
        : distanceKm < 7000
          ? longHaul
          : ultraLongHaul;
  const baseStops = sequence[(slotIndex + offset) % sequence.length];
  if (baseStops === 0 && distanceKm > 2500 && rand() > 0.94) return 1;
  return baseStops;
};

const cabinClassForSlot = (distanceKm, slotIndex, totalCount, route, dateSeed) => {
  const longHaul = distanceKm >= 4500;
  const offset = hashParts(route.key, dateSeed) % Math.max(1, totalCount);

  const shortHaulSequence = [
    "economy",
    "economy",
    "economy",
    "premium-economy",
    "economy",
    "business",
    "economy",
  ];
  const mediumHaulSequence = [
    "economy",
    "economy",
    "premium-economy",
    "business",
    "economy",
    "premium-economy",
    "business",
  ];
  const longHaulSequence = [
    "economy",
    "premium-economy",
    "business",
    "economy",
    "business",
    "premium-economy",
    route.isPopular ? "first" : "business",
  ];

  const sequence = longHaul
    ? longHaulSequence
    : distanceKm >= 1200
      ? mediumHaulSequence
      : shortHaulSequence;

  return sequence[(slotIndex + offset) % sequence.length];
};

const pickDepartureMinutes = (rand, window, slotIndex) => {
  const entry = WINDOW_RANGE[window] || WINDOW_RANGE.morning;
  if (window === "overnight") {
    if (slotIndex % 2 === 0) {
      return randomInt(rand, entry.min, entry.max);
    }
    return randomInt(rand, 0, entry.alternateMax);
  }

  return randomInt(rand, entry.min, entry.max);
};

const computePrice = ({
  rand,
  route,
  stops,
  cabinClass,
  itineraryType,
  seasonBucket,
  serviceDate,
}) => {
  const distanceBase =
    56 + route.distanceKm * randomFloat(rand, 0.08, 0.122, 4);
  const stopAdjustment = stops === 0 ? 38 : stops === 1 ? 8 : -22;
  const seasonal = SEASON_PRICE_MULTIPLIER[seasonBucket] || 1;
  const cabinMultiplier = CABIN_PRICE_MULTIPLIER[cabinClass] || 1;
  const routeDemand = route.isPopular ? 1.08 : 1;
  const itineraryTypeMultiplier = itineraryType === "round-trip" ? 1.72 : 1;
  const dayMultiplier = serviceDayMultiplier(serviceDate);
  const demandNoise = randomInt(rand, -24, 84);

  const raw =
    (distanceBase + stopAdjustment + demandNoise) *
    cabinMultiplier *
    routeDemand *
    itineraryTypeMultiplier *
    seasonal *
    dayMultiplier;

  return clamp(Math.round(raw), 79, 6800);
};

const buildFareVariants = (flight, rand, config) => {
  const standard = {
    fareCode: "standard",
    cabinClass: flight.cabinClass,
    price: flight.price,
    refundable: flight.cabinClass === "business" || flight.cabinClass === "first",
    changeable: true,
    checkedBagsIncluded:
      flight.cabinClass === "economy"
        ? 0
        : flight.cabinClass === "premium-economy"
          ? 1
          : 2,
    seatsRemaining: flight.seatsRemaining,
  };

  const variants = [standard];
  if (config.flightDensity.fareVariantsPerItinerary <= 1) return variants;

  variants.push({
    fareCode: "flex",
    cabinClass: flight.cabinClass,
    price: Math.round(flight.price * randomFloat(rand, 1.12, 1.19, 3)),
    refundable: true,
    changeable: true,
    checkedBagsIncluded: standard.checkedBagsIncluded + 1,
    seatsRemaining: Math.max(2, flight.seatsRemaining - 1),
  });

  if (config.flightDensity.fareVariantsPerItinerary > 2) {
    variants.push({
      fareCode: "plus",
      cabinClass: flight.cabinClass,
      price: Math.round(flight.price * randomFloat(rand, 1.22, 1.34, 3)),
      refundable: true,
      changeable: true,
      checkedBagsIncluded: standard.checkedBagsIncluded + 2,
      seatsRemaining: Math.max(1, flight.seatsRemaining - 2),
    });
  }

  return variants;
};

export const generateFlightsForRoute = (input = {}) => {
  const config = resolveConfig(input);
  const itineraryType =
    input?.itineraryType === "one-way" ? "one-way" : "round-trip";
  const requestedCount = Number(input?.count) || 0;
  const { fromCity, toCity } = resolveRouteCities(input?.fromSlug, input?.toSlug);
  if (!fromCity || !toCity) return [];

  const route =
    routeForInput(input, config) || buildAdhocRoute(fromCity, toCity, config);
  const serviceDate = input?.departDate || config.horizonStartDate;
  const seasonBucket = getFlightSeasonBucket(serviceDate, route.key, {
    seedConfig: config,
  });
  const dateSeed = hashParts(config.seed, route.key, itineraryType, serviceDate);
  const count = Math.max(route.dailyItineraries, requestedCount);
  const sequence =
    WINDOW_SEQUENCE_BY_COUNT[count] ||
    WINDOW_SEQUENCE_BY_COUNT[config.flightDensity.extraPopularDailyItineraries];
  const baseDuration = baseDurationMinutes(route.distanceKm);
  const flights = [];

  for (let index = 0; index < count; index += 1) {
    const rand = createDeterministicRandom(hashParts(dateSeed, index));
    const window = sequence[index % sequence.length];
    const departureMinutes = pickDepartureMinutes(rand, window, index);
    const cabinClass = cabinClassForSlot(
      route.distanceKm,
      index,
      count,
      route,
      serviceDate,
    );
    const stops = stopsForRoute(
      rand,
      route.distanceKm,
      index,
      route.key,
      serviceDate,
    );
    const layoverPenalty =
      stops === 0
        ? 0
        : randomInt(rand, 55, 105) * stops + randomInt(rand, 18, 36);
    const durationMinutes = clamp(
      baseDuration + layoverPenalty + randomInt(rand, -20, 34),
      50,
      1450,
    );
    const arrivalMinutes = normalizeMinutes(departureMinutes + durationMinutes);
    const price = computePrice({
      rand,
      route,
      stops,
      cabinClass,
      itineraryType,
      seasonBucket,
      serviceDate,
    });
    const seatsRemaining = randomInt(rand, 3, 9);
    const airlinePool = route.airlinePool.length
      ? route.airlinePool
      : AIRLINE_GROUPS.global;
    const airline =
      airlinePool[(index + (hashParts(route.key, serviceDate) % airlinePool.length)) % airlinePool.length] ||
      pickOne(rand, airlinePool) ||
      "Andacity Air";

    const flight = {
      id: deterministicId(
        "flt",
        config.seed,
        route.from,
        route.to,
        itineraryType,
        index,
      ),
      airline,
      origin: `${fromCity.name} (${route.originAirport})`,
      destination: `${toCity.name} (${route.destinationAirport})`,
      departureTime: toClock(departureMinutes),
      arrivalTime: toClock(arrivalMinutes),
      departureMinutes,
      arrivalMinutes,
      departureWindow: windowFromMinutes(departureMinutes),
      arrivalWindow: windowFromMinutes(arrivalMinutes),
      stops,
      stopsLabel: stops === 0 ? "Nonstop" : stops === 1 ? "1 stop" : "2+ stops",
      duration: formatDuration(durationMinutes),
      cabinClass,
      price,
      currency: "USD",
      seatsRemaining,
      fareVariants: buildFareVariants(
        {
          cabinClass,
          price,
          seatsRemaining,
        },
        rand,
        config,
      ),
      seedMeta: {
        fromSlug: route.from,
        toSlug: route.to,
        itineraryType,
        seasonBucket,
        serviceDate,
        routeKey: route.key,
        slotIndex: index,
      },
    };

    flights.push(flight);
  }

  return flights;
};

export const getFlightPairingsForCity = (originSlug, options = {}) => {
  const config = resolveConfig(options);
  const network = buildRouteNetwork(config);
  const routes = network.routesByOrigin.get(originSlug) || [];
  const pairings = [];

  for (const route of routes) {
    for (const itineraryType of ["round-trip", "one-way"]) {
      pairings.push({
        from: route.from,
        to: route.to,
        itineraryType,
        seasonBucket: 0,
        key: `${route.from}__${route.to}__${itineraryType}__dense`,
        dailyItineraries: route.dailyItineraries,
        routeKey: route.key,
        distanceKm: route.distanceKm,
      });
    }
  }

  return pairings;
};

export const getFlightPairingCountByCity = (options = {}) => {
  const config = resolveConfig(options);
  const network = buildRouteNetwork(config);
  return getTopTravelCities().map((city) => {
    const routes = network.routesByOrigin.get(city.slug) || [];
    return {
      city: city.slug,
      routes: routes.length,
      pairings: routes.length * 2,
    };
  });
};

export const getFlightRoutes = (options = {}) => {
  const config = resolveConfig(options);
  return buildRouteNetwork(config).allRoutes.slice();
};

export const getFlightHorizonDates = (options = {}) => {
  const config = resolveConfig(options);
  return getRollingHorizonDates(config);
};

export const getFlightRouteScaleSummary = (options = {}) => {
  const config = resolveConfig(options);
  const network = buildRouteNetwork(config);
  const pairings = getFlightPairingCountByCity({ seedConfig: config });
  const minPairings = Math.min(...pairings.map((entry) => entry.pairings));
  const minRoutes = Math.min(...pairings.map((entry) => entry.routes));
  const estimatedItineraries = network.allRoutes.reduce((sum, route) => {
    return sum + route.dailyItineraries * config.horizonDays * 2;
  }, 0);
  const estimatedFareRows =
    estimatedItineraries * config.flightDensity.fareVariantsPerItinerary;

  return {
    cities: pairings.length,
    minRoutesPerCity: minRoutes,
    minPairingsPerCity: minPairings,
    flightsPerPairing: config.flightDensity.baseDailyItineraries,
    horizonDays: config.horizonDays,
    totalDirectedRoutes: network.summary.totalDirectedRoutes,
    estimatedRows: estimatedItineraries,
    estimatedFareRows,
  };
};

export { getFlightSeasonBucket };
