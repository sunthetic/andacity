// @ts-nocheck
import {
  carInventoryCountForCity,
  getRollingHorizonDates,
  hotelCountForCity,
  isDenseInventoryCity,
  resolveSeedConfig,
} from "../config/seed-config.js";
import { getTopTravelCities } from "../cities/top-100.js";
import { generateCarRentalsForCity } from "../generators/generate-cars.js";
import {
  generateFlightsForRoute,
  getFlightPairingsForCity,
  getFlightRoutes,
  getFlightRouteScaleSummary,
} from "../generators/generate-flights.js";
import { generateHotelsForCity } from "../generators/generate-hotels.js";
import { addDays, parseIsoDate, toIsoDate } from "../fns/format.js";

const STORAGE_BYTES_PER_ROW = {
  countries: 420,
  regions: 420,
  cities: 720,
  airports: 520,
  hotel_brands: 320,
  hotels: 1640,
  hotel_images: 380,
  hotel_amenities: 260,
  hotel_amenity_links: 160,
  hotel_offers: 430,
  hotel_availability_snapshots: 240,
  car_providers: 320,
  car_vehicle_classes: 280,
  car_locations: 760,
  car_inventory: 1760,
  car_inventory_images: 340,
  car_offers: 420,
  airlines: 300,
  flight_routes: 360,
  flight_itineraries: 760,
  flight_segments: 260,
  flight_fares: 290,
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
};

const gbFromBytes = (bytes) => {
  return bytes / 1024 / 1024 / 1024;
};

const isWithinDateWindow = (date, start, end) => {
  return date >= start && date <= end;
};

const isBlockedWeekday = (isoDate, blockedWeekdays) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return false;
  return (blockedWeekdays || []).includes(parsed.getUTCDay());
};

const supportsStay = (window, checkInDate, nights) => {
  if (!window) return false;
  if (!isWithinDateWindow(checkInDate, window.start, window.end)) return false;
  if (isBlockedWeekday(checkInDate, window.blockedWeekdays)) return false;
  return nights >= window.min && nights <= window.max;
};

const buildWindow = (availability, startKey, endKey, minKey, maxKey) => {
  const start = parseIsoDate(availability?.[startKey]);
  const end = parseIsoDate(availability?.[endKey]);
  if (!start || !end) return null;

  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    min: Number(availability?.[minKey] || 1),
    max: Number(availability?.[maxKey] || 1),
    blockedWeekdays: availability?.blockedWeekdays || [],
  };
};

const countAvailableForStay = (items, date, nights, mapper) => {
  let count = 0;
  for (const item of items) {
    if (supportsStay(mapper(item), date, nights)) {
      count += 1;
    }
  }
  return count;
};

const countStorageRows = (cities, config) => {
  const countrySet = new Set();
  const regionSet = new Set();
  const airportSet = new Set();
  const hotelBrandSet = new Set();
  const hotelAmenitySet = new Set();
  const carProviderSet = new Set();
  const carLocationSet = new Set();
  const carClassSet = new Set();
  const airlineSet = new Set();

  let hotelCount = 0;
  let hotelImageCount = 0;
  let hotelAmenityLinkCount = 0;
  let hotelOfferCount = 0;
  let hotelAvailabilityCount = 0;

  let carInventoryCount = 0;
  let carImageCount = 0;
  let carOfferCount = 0;

  for (const city of cities) {
    countrySet.add(city.country);
    regionSet.add(`${city.country}:${city.region}`);
    for (const code of city.airportCodes || []) {
      airportSet.add(code);
    }

    const hotels = generateHotelsForCity(city, { seedConfig: config });
    hotelCount += hotels.length;
    hotelAvailabilityCount += hotels.length;

    for (const hotel of hotels) {
      hotelImageCount += (hotel.images || []).length;
      hotelOfferCount += (hotel.rooms || []).length;
      hotelBrandSet.add(hotel.name.split(" ").slice(0, -1).join(" "));
      for (const amenity of hotel.amenities || []) {
        hotelAmenitySet.add(amenity);
        hotelAmenityLinkCount += 1;
      }
    }

    const rentals = generateCarRentalsForCity(city, { seedConfig: config });
    carInventoryCount += rentals.length;
    for (const rental of rentals) {
      carProviderSet.add(rental.name);
      carLocationSet.add(`${city.slug}:${rental.pickupArea}`);
      carImageCount += (rental.images || []).length;
      carOfferCount += (rental.offers || []).length;
      for (const offer of rental.offers || []) {
        carClassSet.add(offer.category);
      }
    }
  }

  const flightRoutes = getFlightRoutes({ seedConfig: config });
  const routeScale = getFlightRouteScaleSummary({ seedConfig: config });
  const averageAirlinesPerRoute = 5;
  for (const route of flightRoutes.slice(0, 300)) {
    const flights = generateFlightsForRoute({
      fromSlug: route.from,
      toSlug: route.to,
      itineraryType: "round-trip",
      departDate: config.horizonStartDate,
      seedConfig: config,
    });
    for (const flight of flights) {
      airlineSet.add(flight.airline);
    }
  }

  const rowCounts = {
    countries: countrySet.size,
    regions: regionSet.size,
    cities: cities.length,
    airports: airportSet.size,
    hotel_brands: hotelBrandSet.size,
    hotels: hotelCount,
    hotel_images: hotelImageCount,
    hotel_amenities: hotelAmenitySet.size,
    hotel_amenity_links: hotelAmenityLinkCount,
    hotel_offers: hotelOfferCount,
    hotel_availability_snapshots: hotelAvailabilityCount,
    car_providers: carProviderSet.size,
    car_vehicle_classes: Math.max(carClassSet.size, 8),
    car_locations: carLocationSet.size,
    car_inventory: carInventoryCount,
    car_inventory_images: carImageCount,
    car_offers: carOfferCount,
    airlines: Math.max(airlineSet.size, averageAirlinesPerRoute),
    flight_routes: flightRoutes.length,
    flight_itineraries: routeScale.estimatedRows,
    flight_segments: routeScale.estimatedRows,
    flight_fares: routeScale.estimatedFareRows,
  };

  let estimatedBytes = 0;
  for (const [table, count] of Object.entries(rowCounts)) {
    estimatedBytes += (STORAGE_BYTES_PER_ROW[table] || 256) * count;
  }

  return {
    rowCounts,
    estimatedBytes,
    estimatedGb: round(gbFromBytes(estimatedBytes), 2),
  };
};

const validateHotels = (cities, dates, config, failures) => {
  let globalMinimumNightly = Number.POSITIVE_INFINITY;
  let globalMinimumContinuityRatio = 1;
  let totalHotels = 0;

  for (const city of cities) {
    const hotels = generateHotelsForCity(city, { seedConfig: config });
    totalHotels += hotels.length;
    const nightlyMinimum = city.rank <= config.denseCityCutoff ? 6 : 3;
    const weeklongThresholdNights = Math.max(1, Math.floor((dates.length - 6) * 0.85));
    let weeklongEligibleNights = 0;

    for (let index = 0; index < dates.length; index += 1) {
      const date = dates[index];
      const nightly = countAvailableForStay(
        hotels,
        date,
        1,
        (hotel) =>
          buildWindow(hotel.availability, "checkInStart", "checkInEnd", "minNights", "maxNights"),
      );
      globalMinimumNightly = Math.min(globalMinimumNightly, nightly);
      if (nightly < nightlyMinimum) {
        failures.push(
          `Hotel nightly minimum failed for ${city.slug} on ${date}: expected >=${nightlyMinimum}, got ${nightly}`,
        );
      }

      if (index < dates.length - 1 && nightly > 0) {
        const continuity = countAvailableForStay(
          hotels,
          date,
          2,
          (hotel) =>
            buildWindow(
              hotel.availability,
              "checkInStart",
              "checkInEnd",
              "minNights",
              "maxNights",
            ),
        );
        const continuityRatio = continuity / nightly;
        globalMinimumContinuityRatio = Math.min(
          globalMinimumContinuityRatio,
          continuityRatio,
        );
        if (continuityRatio < 0.7) {
          failures.push(
            `Hotel 2-night continuity failed for ${city.slug} on ${date}: expected >=70%, got ${round(
              continuityRatio * 100,
              1,
            )}%`,
          );
        }
      }

      if (index <= dates.length - 7) {
        const weeklong = countAvailableForStay(
          hotels,
          date,
          7,
          (hotel) =>
            buildWindow(
              hotel.availability,
              "checkInStart",
              "checkInEnd",
              "minNights",
              "maxNights",
            ),
        );
        if (weeklong >= 1) weeklongEligibleNights += 1;
      }
    }

    if (weeklongEligibleNights < weeklongThresholdNights) {
      failures.push(
        `Hotel weeklong continuity failed for ${city.slug}: expected weeklong support on most nights, got ${weeklongEligibleNights}/${Math.max(
          1,
          dates.length - 6,
        )}`,
      );
    }
  }

  return {
    totalHotels,
    globalMinimumNightly,
    globalMinimumContinuityRatio: round(globalMinimumContinuityRatio, 3),
  };
};

const validateCars = (cities, dates, config, failures) => {
  let globalMinimumNightly = Number.POSITIVE_INFINITY;
  let weeklongPassRateMinimum = 1;
  let totalInventory = 0;

  for (const city of cities) {
    const rentals = generateCarRentalsForCity(city, { seedConfig: config });
    totalInventory += rentals.length;
    const nightlyMinimum = city.rank <= config.denseCityCutoff ? 3 : 1;
    let weeklongEligibleNights = 0;

    for (let index = 0; index < dates.length; index += 1) {
      const date = dates[index];
      const nightly = countAvailableForStay(
        rentals,
        date,
        1,
        (rental) =>
          buildWindow(rental.availability, "pickupStart", "pickupEnd", "minDays", "maxDays"),
      );
      globalMinimumNightly = Math.min(globalMinimumNightly, nightly);
      if (nightly < nightlyMinimum) {
        failures.push(
          `Car nightly minimum failed for ${city.slug} on ${date}: expected >=${nightlyMinimum}, got ${nightly}`,
        );
      }

      if (index <= dates.length - 7) {
        const weeklong = countAvailableForStay(
          rentals,
          date,
          7,
          (rental) =>
            buildWindow(rental.availability, "pickupStart", "pickupEnd", "minDays", "maxDays"),
        );
        if (weeklong >= 1) weeklongEligibleNights += 1;
      }
    }

    const eligibleNights = Math.max(1, dates.length - 6);
    const passRate = weeklongEligibleNights / eligibleNights;
    weeklongPassRateMinimum = Math.min(weeklongPassRateMinimum, passRate);
    if (passRate < 0.9) {
      failures.push(
        `Car weeklong continuity failed for ${city.slug}: expected nearly-always availability, got ${weeklongEligibleNights}/${eligibleNights}`,
      );
    }
  }

  return {
    totalInventory,
    globalMinimumNightly,
    weeklongPassRateMinimum: round(weeklongPassRateMinimum, 3),
  };
};

const validateFlights = (cities, config, failures) => {
  const routes = getFlightRoutes({ seedConfig: config });
  const routesByOrigin = new Map();
  const routeKeySet = new Set(routes.map((route) => route.key));
  for (const route of routes) {
    const current = routesByOrigin.get(route.from) || [];
    current.push(route);
    routesByOrigin.set(route.from, current);
  }

  for (const city of cities) {
    const cityRoutes = routesByOrigin.get(city.slug) || [];
    if (cityRoutes.length < config.flightDensity.minRoutesPerCity) {
      failures.push(
        `Flight route minimum failed for ${city.slug}: expected >=${config.flightDensity.minRoutesPerCity}, got ${cityRoutes.length}`,
      );
    }
  }

  const sampleRoutes = routes.filter((route, index) => {
    return route.isPopular || index % Math.max(1, Math.floor(routes.length / 150)) === 0;
  });

  for (const route of sampleRoutes) {
    for (const itineraryType of ["round-trip", "one-way"]) {
      const flights = generateFlightsForRoute({
        fromSlug: route.from,
        toSlug: route.to,
        itineraryType,
        departDate: config.horizonStartDate,
        seedConfig: config,
      });
      const uniqueAirlines = new Set(flights.map((flight) => flight.airline)).size;
      const uniqueWindows = new Set(
        flights.map((flight) => flight.departureWindow),
      ).size;
      const uniqueStops = new Set(flights.map((flight) => flight.stops)).size;

      if (flights.length < config.flightDensity.baseDailyItineraries) {
        failures.push(
          `Flight daily density failed for ${route.key} (${itineraryType}): expected >=${config.flightDensity.baseDailyItineraries}, got ${flights.length}`,
        );
      }
      if (route.dailyItineraries * 7 < 30) {
        failures.push(
          `Flight weekly density failed for ${route.key}: expected >=30/week, got ${route.dailyItineraries * 7}`,
        );
      }
      if (uniqueAirlines < Math.min(3, flights.length)) {
        failures.push(
          `Flight airline diversity failed for ${route.key} (${itineraryType}): expected >=3, got ${uniqueAirlines}`,
        );
      }
      if (uniqueWindows < 3) {
        failures.push(
          `Flight departure diversity failed for ${route.key} (${itineraryType}): expected >=3 windows, got ${uniqueWindows}`,
        );
      }
      if (route.distanceKm > 2000 && uniqueStops < 2) {
        failures.push(
          `Flight stop-count diversity failed for ${route.key} (${itineraryType}): expected multiple stop profiles, got ${uniqueStops}`,
        );
      }
    }
  }

  const majorCities = cities.filter((city) => city.rank <= 20);
  for (const origin of majorCities) {
    for (const destination of majorCities) {
      if (origin.slug === destination.slug) continue;
      const forwardKey = `${origin.slug}:${destination.slug}`;
      const reverseKey = `${destination.slug}:${origin.slug}`;
      if (!routeKeySet.has(forwardKey) || !routeKeySet.has(reverseKey)) {
        failures.push(
          `Round-trip feasibility failed for major pair ${origin.slug}<->${destination.slug}`,
        );
      }
    }
  }

  const routeScale = getFlightRouteScaleSummary({ seedConfig: config });
  return {
    totalDirectedRoutes: routes.length,
    minRoutesPerCity: routeScale.minRoutesPerCity,
    minPairingsPerCity: routeScale.minPairingsPerCity,
    estimatedItineraryRows: routeScale.estimatedRows,
    estimatedFareRows: routeScale.estimatedFareRows,
    sampledRoutes: sampleRoutes.length,
  };
};

const validateTripComposition = (cities, dates, config, failures) => {
  const topCities = cities.filter((city) => city.rank <= 12);
  let checks = 0;

  for (const origin of topCities) {
    const pairings = new Set(
      getFlightPairingsForCity(origin.slug, { seedConfig: config }).map(
        (pairing) => `${pairing.from}:${pairing.to}`,
      ),
    );

    for (const destination of topCities) {
      if (origin.slug === destination.slug) continue;
      checks += 1;

      if (!pairings.has(`${origin.slug}:${destination.slug}`)) {
        failures.push(
          `Cross-vertical trip composition failed: missing outbound ${origin.slug}->${destination.slug}`,
        );
        continue;
      }

      const hotels = generateHotelsForCity(destination, { seedConfig: config });
      const cars = generateCarRentalsForCity(destination, { seedConfig: config });
      const dateIndexes = [0, 14, 35, 63, 91]
        .filter((index) => index >= 0 && index < dates.length - 6)
        .map((index) => dates[index]);

      for (const date of dateIndexes) {
        const hotelCount = countAvailableForStay(
          hotels,
          date,
          3,
          (hotel) =>
            buildWindow(
              hotel.availability,
              "checkInStart",
              "checkInEnd",
              "minNights",
              "maxNights",
            ),
        );
        const carCount = countAvailableForStay(
          cars,
          date,
          3,
          (rental) =>
            buildWindow(
              rental.availability,
              "pickupStart",
              "pickupEnd",
              "minDays",
              "maxDays",
            ),
        );

        const hotelMinimum = destination.rank <= config.denseCityCutoff ? 6 : 3;
        const carMinimum = destination.rank <= config.denseCityCutoff ? 3 : 1;

        if (hotelCount < hotelMinimum) {
          failures.push(
            `Cross-vertical hotel composition failed for ${destination.slug} on ${date}: expected >=${hotelMinimum}, got ${hotelCount}`,
          );
        }
        if (carCount < carMinimum) {
          failures.push(
            `Cross-vertical car composition failed for ${destination.slug} on ${date}: expected >=${carMinimum}, got ${carCount}`,
          );
        }
      }
    }
  }

  return {
    checkedPairs: checks,
  };
};

export const validateSeedInventory = (options = {}) => {
  const config = resolveSeedConfig(options.seedConfig || options);
  const cities = getTopTravelCities();
  const dates = getRollingHorizonDates(config);
  const failures = [];

  const hotelSummary = validateHotels(cities, dates, config, failures);
  const carSummary = validateCars(cities, dates, config, failures);
  const flightSummary = validateFlights(cities, config, failures);
  const compositionSummary = validateTripComposition(
    cities,
    dates,
    config,
    failures,
  );
  const storageSummary = countStorageRows(cities, config);

  if (storageSummary.estimatedGb > config.storageTargetGb) {
    failures.push(
      `Estimated database size exceeded target: expected <=${config.storageTargetGb} GB, got ${storageSummary.estimatedGb} GB`,
    );
  }

  return {
    ok: failures.length === 0,
    failures,
    config: {
      seed: config.seed,
      cityCount: cities.length,
      denseCityCutoff: config.denseCityCutoff,
      horizonDays: config.horizonDays,
      horizonStartDate: config.horizonStartDate,
      horizonEndDate: config.horizonEndDate,
      supportedHorizonDays: config.supportedHorizonDays,
      storageTargetGb: config.storageTargetGb,
    },
    hotels: hotelSummary,
    cars: carSummary,
    flights: flightSummary,
    tripComposition: compositionSummary,
    storage: storageSummary,
  };
};

export const assertSeedInventory = (options = {}) => {
  const report = validateSeedInventory(options);
  if (!report.ok) {
    const message = [
      "Seed inventory validation failed.",
      ...report.failures.map((failure) => `- ${failure}`),
    ].join("\n");
    const error = new Error(message);
    error.report = report;
    throw error;
  }

  return report;
};
