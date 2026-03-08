// @ts-nocheck
import { SEED_CONFIG } from "../config/seed-config.js";
import { getTopTravelCities, findTopTravelCity } from "../cities/top-100.js";
import { generateHotelsForCity } from "../generators/generate-hotels.js";
import { generateCarRentalsForCity } from "../generators/generate-cars.js";
import {
  generateFlightsForRoute,
  getFlightPairingsForCity,
} from "../generators/generate-flights.js";
import { parseIsoDate, slugify } from "../fns/format.js";

const TABLE_KEYS = [
  "countries",
  "regions",
  "cities",
  "airports",
  "hotel_brands",
  "hotels",
  "hotel_images",
  "hotel_amenities",
  "hotel_amenity_links",
  "hotel_offers",
  "hotel_availability_snapshots",
  "car_providers",
  "car_vehicle_classes",
  "car_locations",
  "car_inventory",
  "car_inventory_images",
  "car_offers",
  "airlines",
  "flight_routes",
  "flight_itineraries",
  "flight_segments",
  "flight_fares",
];

export const TABLE_INSERT_ORDER = TABLE_KEYS.slice();
const DEFAULT_MAX_FLIGHT_ROUTES = 1200;

const toCentAmount = (amount) => Math.round(Number(amount || 0) * 100);

const normalizeToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toAirportCode = (value) => {
  const m = String(value || "").match(/\(([A-Z0-9]{3})\)/);
  if (m?.[1]) return m[1];

  const token =
    String(value || "")
      .trim()
      .split(/\s+/)[0] || "";
  if (/^[A-Za-z0-9]{3}$/.test(token)) return token.toUpperCase();

  return "";
};

const airportNameFromCode = (cityName, code) => {
  return `${cityName} ${code} Airport`;
};

const deriveHotelBrand = (hotelName) => {
  const parts = String(hotelName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) return String(hotelName || "").trim();
  return parts.slice(0, parts.length - 1).join(" ");
};

const deriveCarPickupType = (pickupArea) => {
  return String(pickupArea || "")
    .toLowerCase()
    .includes("airport")
    ? "airport"
    : "city";
};

const toFlightDurationMinutes = (flight) => {
  const delta = Number(flight.arrivalMinutes) - Number(flight.departureMinutes);
  return delta >= 0 ? delta : delta + 1440;
};

const toIsoTimestampAtMinutes = (isoDate, totalMinutes) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  const date = new Date(parsed.getTime());
  date.setUTCMinutes(Number(totalMinutes || 0), 0, 0);
  return date.toISOString();
};

const addMinutesToIso = (isoTimestamp, minutes) => {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;

  const next = new Date(parsed.getTime() + Number(minutes || 0) * 60_000);
  return next.toISOString();
};

const haversineKm = (fromCity, toCity) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const lat1 = Number(fromCity.lat);
  const lon1 = Number(fromCity.lng);
  const lat2 = Number(toCity.lat);
  const lon2 = Number(toCity.lng);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((6371 * c).toFixed(2));
};

const createCollector = () => {
  const tables = Object.fromEntries(TABLE_KEYS.map((key) => [key, []]));
  const seen = Object.fromEntries(TABLE_KEYS.map((key) => [key, new Set()]));

  const add = (table, dedupeKey, row) => {
    const key = String(dedupeKey || "");
    if (!key) return;
    if (seen[table].has(key)) return;

    seen[table].add(key);
    tables[table].push(row);
  };

  return {
    tables,
    add,
  };
};

const collectGeography = (collector, cityList) => {
  for (const city of cityList) {
    const countrySlug = slugify(city.country);
    const regionSlug = slugify(city.region);

    collector.add("countries", countrySlug, {
      slug: countrySlug,
      name: city.country,
      iso2: null,
      iso3: null,
    });

    collector.add("regions", `${countrySlug}:${regionSlug}`, {
      countrySlug,
      slug: regionSlug,
      code: city.region,
      name: city.region,
    });

    collector.add("cities", city.slug, {
      seedKey: `city:${city.slug}`,
      slug: city.slug,
      name: city.name,
      countrySlug,
      regionSlug,
      latitude: city.lat,
      longitude: city.lng,
      popularityRank: city.rank,
      featuredRank: city.rank,
      aliases: city.aliases || [],
    });

    for (const [index, code] of (city.airportCodes || []).entries()) {
      const airportCode = String(code || "")
        .trim()
        .toUpperCase();
      if (!airportCode) continue;

      collector.add("airports", airportCode, {
        seedKey: `airport:${airportCode}`,
        citySlug: city.slug,
        iataCode: airportCode,
        name: airportNameFromCode(city.name, airportCode),
        latitude: city.lat,
        longitude: city.lng,
        timezone: null,
        isPrimary: index === 0,
      });
    }
  }
};

const collectHotelsForCity = (collector, city, hotels) => {
  for (const hotel of hotels) {
    const brandName = deriveHotelBrand(hotel.name);
    const brandSlug = slugify(brandName);

    collector.add("hotel_brands", brandSlug, {
      slug: brandSlug,
      name: brandName,
    });

    collector.add("hotels", hotel.slug, {
      seedKey: hotel.seedMeta?.id || `hotel:${hotel.slug}`,
      slug: hotel.slug,
      citySlug: city.slug,
      brandSlug,
      name: hotel.name,
      neighborhood: hotel.neighborhood,
      propertyType: hotel.propertyType || "hotel",
      addressLine: hotel.addressLine,
      latitude: null,
      longitude: null,
      stars: hotel.stars,
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      summary: hotel.summary,
      currencyCode: hotel.currency,
      fromNightlyCents: toCentAmount(hotel.fromNightly),
      freeCancellation: !!hotel.policies?.freeCancellation,
      payLater: !!hotel.policies?.payLater,
      noResortFees: !!hotel.policies?.noResortFees,
      checkInTime: hotel.policies?.checkInTime || null,
      checkOutTime: hotel.policies?.checkOutTime || null,
      cancellationBlurb: hotel.policies?.cancellationBlurb || null,
      paymentBlurb: hotel.policies?.paymentBlurb || null,
      feesBlurb: hotel.policies?.feesBlurb || null,
      featuredRank: null,
    });

    for (const [index, imageUrl] of (hotel.images || []).entries()) {
      const url = String(imageUrl || "").trim();
      if (!url) continue;

      collector.add("hotel_images", `${hotel.slug}:${index}`, {
        hotelSlug: hotel.slug,
        url,
        altText: `${hotel.name} image ${index + 1}`,
        sortOrder: index,
      });
    }

    for (const amenityLabel of hotel.amenities || []) {
      const slug = slugify(amenityLabel);
      if (!slug) continue;

      collector.add("hotel_amenities", slug, {
        slug,
        label: amenityLabel,
      });

      collector.add("hotel_amenity_links", `${hotel.slug}:${slug}`, {
        hotelSlug: hotel.slug,
        amenitySlug: slug,
      });
    }

    for (const room of hotel.rooms || []) {
      const offerCode = String(room.id || "").trim() || slugify(room.name);
      if (!offerCode) continue;

      collector.add("hotel_offers", `${hotel.slug}:${offerCode}`, {
        hotelSlug: hotel.slug,
        externalOfferId: offerCode,
        name: room.name,
        sleeps: room.sleeps,
        beds: room.beds,
        sizeSqft: room.sizeSqft,
        priceNightlyCents: toCentAmount(room.priceFrom),
        currencyCode: hotel.currency,
        refundable: !!room.refundable,
        payLater: !!room.payLater,
        badges: room.badges || [],
        features: room.features || [],
      });
    }

    if (hotel.availability) {
      collector.add("hotel_availability_snapshots", hotel.slug, {
        hotelSlug: hotel.slug,
        snapshotSource: "seed",
        checkInStart: hotel.availability.checkInStart,
        checkInEnd: hotel.availability.checkInEnd,
        minNights: hotel.availability.minNights,
        maxNights: hotel.availability.maxNights,
        blockedWeekdays: hotel.availability.blockedWeekdays || [],
      });
    }
  }
};

const collectCarsForCity = (collector, city, rentals) => {
  for (const rental of rentals) {
    const providerSlug = slugify(rental.name);
    const pickupType = deriveCarPickupType(rental.pickupArea);
    const locationSeedKey = `${city.slug}:${pickupType}:${slugify(rental.pickupArea)}`;
    const airportIata =
      pickupType === "airport" ? toAirportCode(rental.pickupArea) : null;

    collector.add("car_providers", providerSlug, {
      slug: providerSlug,
      name: rental.name,
    });

    collector.add("car_locations", locationSeedKey, {
      seedKey: locationSeedKey,
      citySlug: city.slug,
      airportIata,
      locationType: pickupType,
      name: rental.pickupArea,
      addressLine: rental.pickupAddressLine,
      latitude: null,
      longitude: null,
    });

    collector.add("car_inventory", rental.slug, {
      seedKey: rental.seedMeta?.id || `car:${rental.slug}`,
      slug: rental.slug,
      providerSlug,
      citySlug: city.slug,
      locationSeedKey,
      rating: rental.rating,
      reviewCount: rental.reviewCount,
      summary: rental.summary,
      currencyCode: rental.currency,
      fromDailyCents: toCentAmount(rental.fromDaily),
      freeCancellation: !!rental.policies?.freeCancellation,
      payAtCounter: !!rental.policies?.payAtCounter,
      securityDepositRequired: !!rental.policies?.securityDepositRequired,
      minDriverAge: rental.policies?.minDriverAge || 21,
      fuelPolicy: rental.policies?.fuelPolicy || "Full-to-full",
      cancellationBlurb: rental.policies?.cancellationBlurb || null,
      paymentBlurb: rental.policies?.paymentBlurb || null,
      feesBlurb: rental.policies?.feesBlurb || null,
      depositBlurb: rental.policies?.depositBlurb || null,
      inclusions: rental.inclusions || [],
      availabilityStart:
        rental.availability?.pickupStart || SEED_CONFIG.availabilityAnchorDate,
      availabilityEnd:
        rental.availability?.pickupEnd || SEED_CONFIG.availabilityAnchorDate,
      minDays: rental.availability?.minDays || 1,
      maxDays: rental.availability?.maxDays || 30,
      blockedWeekdays: rental.availability?.blockedWeekdays || [],
      score: rental.seedMeta?.score ?? null,
    });

    for (const [index, imageUrl] of (rental.images || []).entries()) {
      const url = String(imageUrl || "").trim();
      if (!url) continue;

      collector.add("car_inventory_images", `${rental.slug}:${index}`, {
        inventorySlug: rental.slug,
        url,
        sortOrder: index,
      });
    }

    for (const offer of rental.offers || []) {
      const classKeyFromId = String(offer.id || "").replace(/-\d+$/, "");
      const classKey = slugify(classKeyFromId || offer.category || offer.name);
      const transmission =
        normalizeToken(offer.transmission) === "manual"
          ? "manual"
          : "automatic";

      collector.add("car_vehicle_classes", classKey, {
        key: classKey,
        category: offer.category,
        seats: offer.seats,
        doors: offer.doors,
        bagsLabel: offer.bags,
        baseDailyCents: toCentAmount(offer.priceFrom),
      });

      const offerCode = String(offer.id || "").trim() || slugify(offer.name);
      collector.add("car_offers", `${rental.slug}:${offerCode}`, {
        inventorySlug: rental.slug,
        offerCode,
        name: offer.name,
        vehicleClassKey: classKey,
        transmission,
        seats: offer.seats,
        doors: offer.doors,
        bagsLabel: offer.bags,
        airConditioning: offer.ac !== false,
        priceDailyCents: toCentAmount(offer.priceFrom),
        currencyCode: rental.currency,
        freeCancellation: !!offer.freeCancellation,
        payAtCounter: !!offer.payAtCounter,
        badges: offer.badges || [],
        features: offer.features || [],
      });
    }
  }
};

const collectFlightRoute = (collector, route, flights) => {
  const fromCity = findTopTravelCity(route.fromSlug);
  const toCity = findTopTravelCity(route.toSlug);
  if (!fromCity || !toCity) return;

  const serviceDate = route.departDate || SEED_CONFIG.availabilityAnchorDate;

  for (const flight of flights) {
    const originIata = toAirportCode(flight.origin);
    const destinationIata = toAirportCode(flight.destination);
    if (!originIata || !destinationIata) continue;

    const routeSeedKey = `${fromCity.slug}:${originIata}->${toCity.slug}:${destinationIata}`;
    const airlineSlug = slugify(flight.airline);
    const durationMinutes = toFlightDurationMinutes(flight);
    const departureAtUtc = toIsoTimestampAtMinutes(
      serviceDate,
      flight.departureMinutes,
    );
    const arrivalAtUtc = departureAtUtc
      ? addMinutesToIso(departureAtUtc, durationMinutes)
      : null;

    if (!departureAtUtc || !arrivalAtUtc) continue;

    collector.add("airlines", airlineSlug, {
      slug: airlineSlug,
      iataCode: null,
      name: flight.airline,
    });

    collector.add("flight_routes", routeSeedKey, {
      seedKey: routeSeedKey,
      originCitySlug: fromCity.slug,
      destinationCitySlug: toCity.slug,
      originAirportIata: originIata,
      destinationAirportIata: destinationIata,
      distanceKm: haversineKm(fromCity, toCity),
      isPopular: fromCity.rank <= 20 || toCity.rank <= 20,
    });

    const itinerarySeedKey =
      String(flight.id || "").trim() ||
      `${routeSeedKey}:${flight.airline}:${flight.departureMinutes}`;
    const itineraryNaturalKey = `${itinerarySeedKey}:${serviceDate}`;

    collector.add("flight_itineraries", itineraryNaturalKey, {
      seedKey: itinerarySeedKey,
      routeSeedKey,
      airlineSlug,
      itineraryType: route.itineraryType,
      serviceDate,
      seasonBucket: Number(flight.seedMeta?.seasonBucket || 0),
      departureAtUtc,
      arrivalAtUtc,
      departureMinutes: Number(flight.departureMinutes),
      arrivalMinutes: Number(flight.arrivalMinutes),
      departureWindow: flight.departureWindow,
      arrivalWindow: flight.arrivalWindow,
      stops: Number(flight.stops),
      durationMinutes,
      stopsLabel: flight.stopsLabel,
      cabinClass: flight.cabinClass || "economy",
      currencyCode: flight.currency || "USD",
      basePriceCents: toCentAmount(flight.price),
      seatsRemaining: 9,
    });

    collector.add("flight_segments", `${itineraryNaturalKey}:1`, {
      itineraryNaturalKey,
      segmentOrder: 1,
      originAirportIata: originIata,
      destinationAirportIata: destinationIata,
      airlineSlug,
      operatingFlightNumber: null,
      departureAtUtc,
      arrivalAtUtc,
      durationMinutes,
    });

    collector.add("flight_fares", `${itineraryNaturalKey}:standard`, {
      itineraryNaturalKey,
      fareCode: "standard",
      cabinClass: flight.cabinClass || "economy",
      priceCents: toCentAmount(flight.price),
      currencyCode: flight.currency || "USD",
      refundable: false,
      changeable: true,
      checkedBagsIncluded: 0,
      seatsRemaining: 9,
    });
  }
};

const buildFlightRequests = ({
  citySlug,
  from,
  to,
  itineraryType,
  departDate,
  maxFlightRoutes,
}) => {
  if (from && to) {
    return [
      {
        fromSlug: from,
        toSlug: to,
        itineraryType: itineraryType === "one-way" ? "one-way" : "round-trip",
        departDate: departDate || SEED_CONFIG.availabilityAnchorDate,
      },
    ];
  }

  const topCities = getTopTravelCities();
  const originCities = citySlug
    ? [findTopTravelCity(citySlug)].filter(Boolean)
    : topCities;

  const maxRoutes = Math.max(1, Number(maxFlightRoutes) || DEFAULT_MAX_FLIGHT_ROUTES);
  const requests = [];
  const seen = new Set();
  const buckets = originCities.map((origin) =>
    getFlightPairingsForCity(origin.slug)
      .filter((pairing) => pairing.seasonBucket === 0)
      .filter((pairing) =>
        itineraryType ? pairing.itineraryType === itineraryType : true,
      ),
  );
  const bucketIndexes = buckets.map(() => 0);

  while (requests.length < maxRoutes) {
    let progressed = false;

    for (let originIndex = 0; originIndex < buckets.length; originIndex += 1) {
      const pairings = buckets[originIndex] || [];
      let pairingIndex = bucketIndexes[originIndex] || 0;

      while (pairingIndex < pairings.length) {
        const pairing = pairings[pairingIndex];
        pairingIndex += 1;
        const key = `${pairing.from}:${pairing.to}:${pairing.itineraryType}`;
        if (seen.has(key)) continue;
        seen.add(key);

        requests.push({
          fromSlug: pairing.from,
          toSlug: pairing.to,
          itineraryType: pairing.itineraryType,
          departDate: departDate || SEED_CONFIG.availabilityAnchorDate,
        });
        progressed = true;
        break;
      }

      bucketIndexes[originIndex] = pairingIndex;
      if (requests.length >= maxRoutes) break;
    }

    if (!progressed) break;
  }

  return requests;
};

const citySelection = (citySlug) => {
  if (!citySlug) return getTopTravelCities();
  const city = findTopTravelCity(citySlug);
  return city ? [city] : [];
};

export const buildPostgresSeedPayload = (options = {}) => {
  const vertical = normalizeToken(options.vertical || "all") || "all";
  const collector = createCollector();

  const selectedCities = citySelection(options.city);
  const allCities = getTopTravelCities();

  const includeGeography =
    vertical === "all" ||
    vertical === "cities" ||
    vertical === "geography" ||
    vertical === "hotels" ||
    vertical === "cars" ||
    vertical === "flights";

  if (includeGeography) {
    collectGeography(collector, allCities);
  }

  if (vertical === "all" || vertical === "hotels") {
    for (const city of selectedCities) {
      collectHotelsForCity(collector, city, generateHotelsForCity(city));
    }
  }

  if (vertical === "all" || vertical === "cars") {
    for (const city of selectedCities) {
      collectCarsForCity(collector, city, generateCarRentalsForCity(city));
    }
  }

  let flightRequests = [];
  if (vertical === "all" || vertical === "flights") {
    flightRequests = buildFlightRequests({
      citySlug: options.city,
      from: options.from,
      to: options.to,
      itineraryType: options.itineraryType,
      departDate: options.departDate,
      maxFlightRoutes: options.maxFlightRoutes,
    });

    for (const request of flightRequests) {
      const flights = generateFlightsForRoute({
        fromSlug: request.fromSlug,
        toSlug: request.toSlug,
        itineraryType: request.itineraryType,
        departDate: request.departDate,
      });

      collectFlightRoute(collector, request, flights);
    }
  }

  const rowCounts = Object.fromEntries(
    TABLE_KEYS.map((table) => [table, collector.tables[table].length]),
  );

  return {
    meta: {
      seed: SEED_CONFIG.seed,
      vertical,
      sourceCities: selectedCities.map((city) => city.slug),
      generatedAt: new Date().toISOString(),
      flightRequests,
      assumptions: {
        maxFlightRoutes:
          vertical === "all" || vertical === "flights"
            ? Number(options.maxFlightRoutes) || DEFAULT_MAX_FLIGHT_ROUTES
            : 0,
      },
    },
    rowCounts,
    tables: collector.tables,
  };
};
