// @ts-nocheck
import { addDays, parseIsoDate, toIsoDate } from "../fns/format.js";

const DEFAULT_DENSE_HORIZON_DAYS = 120;
const SUPPORTED_HORIZON_DAYS = [90, 120, 180];
const DEFAULT_TOP_CITY_COUNT = 150;
const DEFAULT_DENSE_CITY_CUTOFF = 100;
const DEFAULT_STORAGE_TARGET_GB = 50;

const DEFAULTS = {
  seed: "andacity-seed-v2-rolling-horizon",
  topCityCount: DEFAULT_TOP_CITY_COUNT,
  denseCityCutoff: DEFAULT_DENSE_CITY_CUTOFF,
  storageTargetGb: DEFAULT_STORAGE_TARGET_GB,
  defaultHorizonDays: DEFAULT_DENSE_HORIZON_DAYS,
  supportedHorizonDays: SUPPORTED_HORIZON_DAYS,
  flightSeasonBuckets: 6,
  hotelDensity: {
    denseCityHotels: 8,
    secondaryCityHotels: 5,
  },
  carDensity: {
    denseCityInventory: 6,
    secondaryCityInventory: 3,
  },
  flightDensity: {
    minRoutesPerCity: 70,
    targetRoutesPerCity: 72,
    baseDailyItineraries: 5,
    popularDailyItineraries: 6,
    extraPopularDailyItineraries: 7,
    fareVariantsPerItinerary: 2,
  },
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const todayUtcIso = () => toIsoDate(new Date());

const normalizeIsoDate = (value, fallback = todayUtcIso()) => {
  const parsed = parseIsoDate(value);
  return parsed ? toIsoDate(parsed) : fallback;
};

export const resolveSeedConfig = (overrides = {}) => {
  const horizonDays = toPositiveInt(
    overrides.horizonDays ?? process.env.HORIZON_DAYS,
    DEFAULTS.defaultHorizonDays,
  );
  const horizonStartDate = normalizeIsoDate(
    overrides.horizonStartDate ??
      overrides.availabilityAnchorDate ??
      process.env.HORIZON_START_DATE ??
      process.env.AVAILABILITY_ANCHOR_DATE,
  );
  const topCityCount = toPositiveInt(
    overrides.topCityCount ?? process.env.TOP_CITY_COUNT,
    DEFAULTS.topCityCount,
  );
  const denseCityCutoff = Math.min(
    topCityCount,
    toPositiveInt(
      overrides.denseCityCutoff ?? process.env.DENSE_CITY_CUTOFF,
      DEFAULTS.denseCityCutoff,
    ),
  );

  const denseCityHotels = toPositiveInt(
    overrides.hotelDenseCityCount ?? process.env.HOTELS_DENSE_CITY_COUNT,
    DEFAULTS.hotelDensity.denseCityHotels,
  );
  const secondaryCityHotels = toPositiveInt(
    overrides.hotelSecondaryCityCount ??
      process.env.HOTELS_SECONDARY_CITY_COUNT,
    DEFAULTS.hotelDensity.secondaryCityHotels,
  );
  const denseCityCars = toPositiveInt(
    overrides.carDenseCityCount ?? process.env.CARS_DENSE_CITY_COUNT,
    DEFAULTS.carDensity.denseCityInventory,
  );
  const secondaryCityCars = toPositiveInt(
    overrides.carSecondaryCityCount ?? process.env.CARS_SECONDARY_CITY_COUNT,
    DEFAULTS.carDensity.secondaryCityInventory,
  );
  const targetRoutesPerCity = Math.max(
    DEFAULTS.flightDensity.minRoutesPerCity,
    toPositiveInt(
      overrides.targetRoutesPerCity ?? process.env.FLIGHT_TARGET_ROUTES_PER_CITY,
      DEFAULTS.flightDensity.targetRoutesPerCity,
    ),
  );
  const baseDailyItineraries = Math.max(
    5,
    toPositiveInt(
      overrides.baseDailyItineraries ??
        process.env.FLIGHT_BASE_DAILY_ITINERARIES,
      DEFAULTS.flightDensity.baseDailyItineraries,
    ),
  );
  const popularDailyItineraries = Math.max(
    baseDailyItineraries,
    toPositiveInt(
      overrides.popularDailyItineraries ??
        process.env.FLIGHT_POPULAR_DAILY_ITINERARIES,
      DEFAULTS.flightDensity.popularDailyItineraries,
    ),
  );
  const extraPopularDailyItineraries = Math.max(
    popularDailyItineraries,
    toPositiveInt(
      overrides.extraPopularDailyItineraries ??
        process.env.FLIGHT_EXTRA_POPULAR_DAILY_ITINERARIES,
      DEFAULTS.flightDensity.extraPopularDailyItineraries,
    ),
  );
  const fareVariantsPerItinerary = Math.max(
    1,
    Math.min(
      3,
      toPositiveInt(
        overrides.fareVariantsPerItinerary ??
          process.env.FLIGHT_FARE_VARIANTS_PER_ITINERARY,
        DEFAULTS.flightDensity.fareVariantsPerItinerary,
      ),
    ),
  );
  const storageTargetGb = toPositiveInt(
    overrides.storageTargetGb ?? process.env.SEED_STORAGE_TARGET_GB,
    DEFAULTS.storageTargetGb,
  );

  const startDate = parseIsoDate(horizonStartDate);
  const endDate = startDate
    ? addDays(startDate, Math.max(0, horizonDays - 1))
    : parseIsoDate(todayUtcIso());
  const horizonEndDate = endDate ? toIsoDate(endDate) : horizonStartDate;

  return {
    seed: String(overrides.seed ?? process.env.SEED_KEY ?? DEFAULTS.seed),
    topCityCount,
    denseCityCutoff,
    storageTargetGb,
    defaultHorizonDays: DEFAULTS.defaultHorizonDays,
    supportedHorizonDays: DEFAULTS.supportedHorizonDays.slice(),
    horizonDays,
    horizonStartDate,
    horizonEndDate,
    availabilityAnchorDate: horizonStartDate,
    availabilityWindowDays: horizonDays,
    flightSeasonBuckets: DEFAULTS.flightSeasonBuckets,
    hotelDensity: {
      denseCityHotels,
      secondaryCityHotels,
    },
    carDensity: {
      denseCityInventory: denseCityCars,
      secondaryCityInventory: secondaryCityCars,
    },
    flightDensity: {
      minRoutesPerCity: DEFAULTS.flightDensity.minRoutesPerCity,
      targetRoutesPerCity,
      baseDailyItineraries,
      popularDailyItineraries,
      extraPopularDailyItineraries,
      fareVariantsPerItinerary,
    },
    hotelsPerCity: denseCityHotels,
    carsPerCity: denseCityCars,
    flightsPerPairing: baseDailyItineraries,
    minFlightPairingsPerCity: DEFAULTS.flightDensity.minRoutesPerCity,
  };
};

export const SEED_CONFIG = resolveSeedConfig();

export const getRollingHorizonDates = (config = SEED_CONFIG) => {
  const start = parseIsoDate(config.horizonStartDate);
  if (!start) return [];

  const dates = [];
  for (let index = 0; index < config.horizonDays; index += 1) {
    dates.push(toIsoDate(addDays(start, index)));
  }

  return dates;
};

export const isDenseInventoryCity = (city, config = SEED_CONFIG) => {
  return Number(city?.rank || Number.MAX_SAFE_INTEGER) <= config.denseCityCutoff;
};

export const hotelCountForCity = (city, config = SEED_CONFIG) => {
  return isDenseInventoryCity(city, config)
    ? config.hotelDensity.denseCityHotels
    : config.hotelDensity.secondaryCityHotels;
};

export const carInventoryCountForCity = (city, config = SEED_CONFIG) => {
  return isDenseInventoryCity(city, config)
    ? config.carDensity.denseCityInventory
    : config.carDensity.secondaryCityInventory;
};

export const DEMO_IMAGE_SETS = {
  hotels: [
    "/img/demo/hotel-1.jpg",
    "/img/demo/hotel-2.jpg",
    "/img/demo/hotel-3.jpg",
    "/img/demo/hotel-4.jpg",
  ],
  cars: [
    "/img/demo/car-1.jpg",
    "/img/demo/car-2.jpg",
    "/img/demo/car-3.jpg",
    "/img/demo/car-4.jpg",
  ],
};
