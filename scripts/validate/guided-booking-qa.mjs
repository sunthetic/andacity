import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const DEFAULT_ENV_FILE = ".env.local";
const DEFAULT_SCHEMA = "andacity_app";
const LOCAL_PORT_CANDIDATES = [5173, 5174, 5175, 4173];
const QA_TRIP_PREFIX = "[QA]";

const parseArgs = (argv) => {
  const args = {
    envFile: DEFAULT_ENV_FILE,
    baseUrl: "",
    schema: "",
    writeReport: "",
    writeJson: "",
    json: false,
    skipHttp: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === "--env-file" && value) {
      args.envFile = value;
      index += 1;
      continue;
    }

    if (token === "--base-url" && value) {
      args.baseUrl = value;
      index += 1;
      continue;
    }

    if (token === "--schema" && value) {
      args.schema = value;
      index += 1;
      continue;
    }

    if (token === "--write-report" && value) {
      args.writeReport = value;
      index += 1;
      continue;
    }

    if (token === "--write-json" && value) {
      args.writeJson = value;
      index += 1;
      continue;
    }

    if (token === "--json") {
      args.json = true;
      continue;
    }

    if (token === "--skip-http") {
      args.skipHttp = true;
    }
  }

  return args;
};

const parseEnvFile = async (filePath) => {
  const text = await fs.readFile(filePath, "utf8");
  const entries = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    entries[key] = value;
  }

  return entries;
};

const quoteIdent = (value) => `"${String(value).replaceAll('"', '""')}"`;

const normalizeSchema = (value) => {
  const token = String(value || DEFAULT_SCHEMA)
    .trim()
    .toLowerCase();
  return /^[a-z_][a-z0-9_]*$/.test(token) ? token : DEFAULT_SCHEMA;
};

const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10);
};

const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const differenceInDays = (start, end) => {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

const nextWeekday = (fromDate, weekday) => {
  const date = new Date(`${fromDate}T00:00:00Z`);
  const current = date.getUTCDay();
  const delta = (weekday - current + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};

const minutesToClock = (value) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "unknown";
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const normalizeToken = (value, fallback) => {
  const text = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return text ? text.toLowerCase() : fallback;
};

const normalizeCarrierToken = (value, fallback) => {
  const text = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "")
    .toUpperCase();

  return text || fallback;
};

const toCanonicalCarDateTime = (value) => `${String(value || "").trim()}T10-00`;

const titleCase = (value) =>
  String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(
      (part) =>
        `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`,
    )
    .join(" ");

const formatMoney = (cents, currency = "USD") => {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const toIsoDateLiteral = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value || "").trim();
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
};

const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const toFlightResultsPath = (
  originSlug,
  destinationSlug,
  itineraryType,
  query,
) => {
  const sp = new URLSearchParams();
  if (query.depart) sp.set("depart", query.depart);
  if (itineraryType === "round-trip" && query.return)
    sp.set("return", query.return);
  if (query.travelers) sp.set("travelers", query.travelers);
  if (query.cabin) sp.set("cabin", query.cabin);
  const qs = sp.toString();
  const pathValue = `/search/flights/from/${encodeURIComponent(originSlug)}/to/${encodeURIComponent(
    destinationSlug,
  )}/${itineraryType}/1`;
  return qs ? `${pathValue}?${qs}` : pathValue;
};

const toHotelSearchPath = (citySlug, checkIn, checkOut, extra = {}) => {
  const sp = new URLSearchParams();
  if (checkIn) sp.set("checkIn", checkIn);
  if (checkOut) sp.set("checkOut", checkOut);
  for (const [key, value] of Object.entries(extra)) {
    if (value == null || value === "") continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  const pathValue = `/search/hotels/${encodeURIComponent(citySlug)}/1`;
  return qs ? `${pathValue}?${qs}` : pathValue;
};

const toCarSearchPath = (citySlug, pickupDate, dropoffDate, extra = {}) => {
  const sp = new URLSearchParams();
  if (pickupDate) sp.set("pickupDate", pickupDate);
  if (dropoffDate) sp.set("dropoffDate", dropoffDate);
  for (const [key, value] of Object.entries(extra)) {
    if (value == null || value === "") continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  const pathValue = `/search/car-rentals/${encodeURIComponent(citySlug)}/1`;
  return qs ? `${pathValue}?${qs}` : pathValue;
};

const withBaseUrl = (baseUrl, pathname) =>
  `${stripTrailingSlash(baseUrl)}${pathname}`;

const readJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return {
      parseError: error instanceof Error ? error.message : "invalid-json",
      raw: text,
    };
  }
};

const timedFetch = async (url, options = {}) => {
  const startedAt = process.hrtime.bigint();
  const response = await fetch(url, options);
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  return {
    response,
    elapsedMs,
  };
};

const resolveReachableBaseUrl = async (requestedBaseUrl, skipHttp) => {
  if (skipHttp) {
    return {
      baseUrl: stripTrailingSlash(requestedBaseUrl),
      resolutionNote: "HTTP checks skipped by flag.",
    };
  }

  const requested = stripTrailingSlash(requestedBaseUrl);
  const candidates = [];
  if (requested) candidates.push(requested);

  if (requested.includes("localhost") || requested.includes("127.0.0.1")) {
    for (const port of LOCAL_PORT_CANDIDATES) {
      candidates.push(`http://127.0.0.1:${port}`);
      candidates.push(`http://localhost:${port}`);
    }
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);

    try {
      const { response } = await timedFetch(`${candidate}/api/trips`);
      if (response.ok) {
        return {
          baseUrl: candidate,
          resolutionNote:
            candidate === requested
              ? "Resolved from env/config."
              : `Resolved by probing local dev ports because ${requested || "the configured base URL"} was not reachable.`,
        };
      }
    } catch {
      // Keep probing nearby local ports when the configured dev port drifts.
    }
  }

  throw new Error(
    `Unable to reach the booking app. Start the dev server and rerun with --base-url if needed (tried ${candidates.join(
      ", ",
    )}).`,
  );
};

const buildDbHelpers = (schema) => {
  const table = (name) => `${quoteIdent(schema)}.${quoteIdent(name)}`;
  return { table };
};

const queryOne = async (client, text, params = []) => {
  const result = await client.query(text, params);
  return result.rows[0] || null;
};

const queryRows = async (client, text, params = []) => {
  const result = await client.query(text, params);
  return result.rows;
};

const getCurrentDate = async (client) => {
  const row = await queryOne(client, "select current_date::text as today");
  return row?.today || formatDate(new Date().toISOString().slice(0, 10));
};

const findCityFixture = async (
  client,
  table,
  citySlugs,
  checkIn,
  checkOut,
  requireCars,
) => {
  const stayLength = differenceInDays(checkIn, checkOut);
  const params = [citySlugs, checkIn, stayLength, checkOut];
  const extra = requireCars
    ? `
      and exists (
        select 1
        from ${table("car_inventory")} ci
        where ci.city_id = c.id
          and ci.availability_start <= $2::date
          and ci.availability_end >= $4::date
          and $3::int between ci.min_days and ci.max_days
      )
    `
    : "";

  return queryOne(
    client,
    `
      select c.id, c.slug, c.name
      from ${table("cities")} c
      where c.slug = any($1::text[])
        and exists (
          select 1
          from ${table("hotels")} h
          inner join ${table("hotel_availability_snapshots")} has on has.hotel_id = h.id
          where h.city_id = c.id
            and has.check_in_start <= $2::date
            and has.check_in_end >= $2::date
            and $3::int between has.min_nights and has.max_nights
        )
        ${extra}
      order by array_position($1::text[], c.slug)
      limit 1
    `,
    params,
  );
};

const findHotelOptions = async (
  client,
  table,
  citySlug,
  checkIn,
  checkOut,
  limit = 5,
) => {
  const nights = differenceInDays(checkIn, checkOut);
  return queryRows(
    client,
    `
      select
        h.id,
        h.slug,
        h.name,
        h.neighborhood,
        c.name as "cityName",
        c.slug as "citySlug",
        h.from_nightly_cents as "priceCents",
        h.currency_code as "currencyCode",
        h.rating,
        h.review_count as "reviewCount",
        h.free_cancellation as "freeCancellation",
        h.pay_later as "payLater",
        offer.name as "roomType",
        offer.sleeps as "roomSleeps"
      from ${table("hotels")} h
      inner join ${table("cities")} c on c.id = h.city_id
      inner join ${table("hotel_availability_snapshots")} has on has.hotel_id = h.id
      left join lateral (
        select
          ho.name,
          ho.sleeps
        from ${table("hotel_offers")} ho
        where ho.hotel_id = h.id
        order by ho.price_nightly_cents asc, ho.id asc
        limit 1
      ) offer on true
      where c.slug = $1
        and has.check_in_start <= $2::date
        and has.check_in_end >= $2::date
        and $3::int between has.min_nights and has.max_nights
      order by h.from_nightly_cents asc, h.rating desc, h.id asc
      limit $4
    `,
    [citySlug, checkIn, nights, limit],
  );
};

const findCarOptions = async (
  client,
  table,
  citySlug,
  pickupDate,
  dropoffDate,
  limit = 6,
) => {
  const rentalDays = differenceInDays(pickupDate, dropoffDate);
  return queryRows(
    client,
    `
      select
        ci.id,
        ci.slug,
        cp.name as "providerName",
        c.name as "cityName",
        c.slug as "citySlug",
        cl.location_type as "locationType",
        cl.name as "locationName",
        ci.location_id as "locationId",
        ci.from_daily_cents as "priceCents",
        ci.currency_code as "currencyCode",
        ci.score,
        ci.free_cancellation as "freeCancellation",
        ci.pay_at_counter as "payAtCounter",
        offer."vehicleClassKey" as "vehicleClassKey"
      from ${table("car_inventory")} ci
      inner join ${table("car_providers")} cp on cp.id = ci.provider_id
      inner join ${table("cities")} c on c.id = ci.city_id
      inner join ${table("car_locations")} cl on cl.id = ci.location_id
      left join lateral (
        select cvc.key as "vehicleClassKey"
        from ${table("car_offers")} co
        inner join ${table("car_vehicle_classes")} cvc on cvc.id = co.vehicle_class_id
        where co.inventory_id = ci.id
        order by co.price_daily_cents asc, co.id asc
        limit 1
      ) offer on true
      where c.slug = $1
        and ci.availability_start <= $2::date
        and ci.availability_end >= $3::date
        and $4::int between ci.min_days and ci.max_days
      order by ci.from_daily_cents asc, ci.score desc nulls last, ci.id asc
      limit $5
    `,
    [citySlug, pickupDate, dropoffDate, rentalDays, limit],
  );
};

const findFlightCandidate = async (
  client,
  table,
  {
    originSlugs,
    destinationSlugs,
    startDate,
    endDate,
    itineraryType = "round-trip",
    strategy = "price",
  },
) => {
  const strategyOrder =
    strategy === "business"
      ? `
          case
            when fi.departure_minutes between 360 and 720 then 0
            else 1
          end asc,
          fi.stops asc,
          fi.departure_minutes asc,
          coalesce(ff.price_cents, fi.base_price_cents) asc
        `
      : `
          coalesce(ff.price_cents, fi.base_price_cents) asc,
          fi.stops asc,
          fi.departure_minutes asc
        `;

  return queryOne(
    client,
    `
      select
        fi.id,
        fi.service_date as "serviceDate",
        fi.itinerary_type as "itineraryType",
        fi.departure_minutes as "departureMinutes",
        fi.arrival_minutes as "arrivalMinutes",
        fi.stops,
        fi.stops_label as "stopsLabel",
        fi.cabin_class as "cabinClass",
        coalesce(ff.price_cents, fi.base_price_cents) as "priceCents",
        coalesce(ff.currency_code, fi.currency_code) as "currencyCode",
        a.name as "airlineName",
        a.iata_code as "airlineCode",
        primary_segment.operating_flight_number as "flightNumber",
        origin.slug as "originSlug",
        origin.name as "originName",
        origin_airport.iata_code as "originCode",
        destination.slug as "destinationSlug",
        destination.name as "destinationName",
        destination_airport.iata_code as "destinationCode"
      from ${table("flight_itineraries")} fi
      inner join ${table("flight_routes")} fr on fr.id = fi.route_id
      inner join ${table("cities")} origin on origin.id = fr.origin_city_id
      inner join ${table("cities")} destination on destination.id = fr.destination_city_id
      inner join ${table("airports")} origin_airport on origin_airport.id = fr.origin_airport_id
      inner join ${table("airports")} destination_airport on destination_airport.id = fr.destination_airport_id
      inner join ${table("airlines")} a on a.id = fi.airline_id
      left join ${table("flight_segments")} primary_segment
        on primary_segment.itinerary_id = fi.id
       and primary_segment.segment_order = 0
      left join ${table("flight_fares")} ff
        on ff.itinerary_id = fi.id
       and ff.fare_code = 'standard'
       and ff.cabin_class = fi.cabin_class
      where origin.slug = any($1::text[])
        and destination.slug = any($2::text[])
        and fi.itinerary_type = $3
        and fi.service_date between $4::date and $5::date
      order by
        array_position($1::text[], origin.slug),
        array_position($2::text[], destination.slug),
        fi.service_date asc,
        ${strategyOrder}
      limit 1
    `,
    [originSlugs, destinationSlugs, itineraryType, startDate, endDate],
  );
};

const findFlightAlternatives = async (
  client,
  table,
  originSlug,
  destinationSlug,
  serviceDate,
  itineraryType,
  limit = 5,
) =>
  queryRows(
    client,
    `
      select
        fi.id,
        fi.service_date as "serviceDate",
        fi.itinerary_type as "itineraryType",
        fi.departure_minutes as "departureMinutes",
        fi.arrival_minutes as "arrivalMinutes",
        fi.stops,
        fi.stops_label as "stopsLabel",
        fi.cabin_class as "cabinClass",
        coalesce(ff.price_cents, fi.base_price_cents) as "priceCents",
        coalesce(ff.currency_code, fi.currency_code) as "currencyCode",
        a.name as "airlineName",
        origin.slug as "originSlug",
        origin.name as "originName",
        destination.slug as "destinationSlug",
        destination.name as "destinationName"
      from ${table("flight_itineraries")} fi
      inner join ${table("flight_routes")} fr on fr.id = fi.route_id
      inner join ${table("cities")} origin on origin.id = fr.origin_city_id
      inner join ${table("cities")} destination on destination.id = fr.destination_city_id
      inner join ${table("airlines")} a on a.id = fi.airline_id
      left join ${table("flight_fares")} ff
        on ff.itinerary_id = fi.id
       and ff.fare_code = 'standard'
       and ff.cabin_class = fi.cabin_class
      where origin.slug = $1
        and destination.slug = $2
        and fi.itinerary_type = $3
        and fi.service_date = $4::date
      order by coalesce(ff.price_cents, fi.base_price_cents) asc, fi.stops asc, fi.departure_minutes asc
      limit $5
    `,
    [originSlug, destinationSlug, itineraryType, serviceDate, limit],
  );

const findTripIdByName = async (client, table, name) =>
  queryOne(
    client,
    `
      select id
      from ${table("trips")}
      where name = $1
      order by id desc
      limit 1
    `,
    [name],
  );

const summarizeHttp = (entry) =>
  `${entry.label}: ${entry.status} in ${entry.elapsedMs.toFixed(0)}ms`;

const normalizeFlightHtml = (html, replacements) => {
  let text = String(html || "");
  for (const replacement of replacements) {
    if (!replacement) continue;
    text = text.replaceAll(replacement, "__DATE__");
  }

  return text
    .replaceAll(/http:\/\/(127\.0\.0\.1|localhost):\d+/g, "http://local")
    .replaceAll(/<script[^>]*>[\s\S]*?<\/script>/g, "")
    .replaceAll(/data-qwik-cls="[^"]*"/g, "")
    .replaceAll(/q:slot="[^"]*"/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
};

const buildFlightFingerprint = (html, replacements) =>
  createHash("sha1")
    .update(normalizeFlightHtml(html, replacements))
    .digest("hex");

const getDistinctAlternative = (options, currentId) =>
  options.find(
    (entry) => Number(entry.inventoryId || entry.id) !== Number(currentId),
  ) || null;

const buildHotelCandidatePayload = (hotel, checkIn, checkOut, metadata) => ({
  itemType: "hotel",
  inventoryId: [
    "hotel",
    normalizeToken(hotel.id, "hotel"),
    checkIn,
    checkOut,
    normalizeToken(hotel.roomType, "standard"),
    String(Math.max(1, Math.min(2, Number(hotel.roomSleeps || 2)))),
  ].join(":"),
  providerInventoryId: Number(hotel.id),
  startDate: checkIn,
  endDate: checkOut,
  priceCents: Number(hotel.priceCents),
  currencyCode: hotel.currencyCode,
  title: hotel.name,
  subtitle: `${hotel.neighborhood} · ${hotel.cityName}`,
  meta: [
    `${Number(hotel.rating || 0).toFixed(1)} rating`,
    hotel.freeCancellation ? "Free cancellation" : "Cancellation varies",
    hotel.payLater ? "Pay later" : "Prepay",
  ],
  metadata,
});

const buildCarCandidatePayload = (car, pickupDate, dropoffDate, metadata) => ({
  itemType: "car",
  inventoryId: [
    "car",
    normalizeToken(car.locationId, "car-location"),
    toCanonicalCarDateTime(pickupDate),
    toCanonicalCarDateTime(dropoffDate),
    normalizeToken(car.vehicleClassKey, "standard"),
  ].join(":"),
  providerInventoryId: Number(car.id),
  startDate: pickupDate,
  endDate: dropoffDate,
  priceCents: Number(car.priceCents),
  currencyCode: car.currencyCode,
  title: car.providerName,
  subtitle: `${car.locationName} · ${car.cityName}`,
  meta: [
    titleCase(car.locationType),
    car.freeCancellation ? "Free cancellation" : "Cancellation varies",
    car.payAtCounter ? "Pay at counter" : "Prepay",
  ],
  metadata,
});

const buildFlightCandidatePayload = (flight, metadata) => ({
  itemType: "flight",
  inventoryId: [
    "flight",
    normalizeCarrierToken(
      flight.airlineCode,
      normalizeCarrierToken(flight.airlineName, "FLIGHT"),
    ),
    normalizeCarrierToken(flight.flightNumber, String(flight.id)),
    toIsoDateLiteral(flight.serviceDate),
    normalizeCarrierToken(flight.originCode, "ORIGIN"),
    normalizeCarrierToken(flight.destinationCode, "DESTINATION"),
  ].join(":"),
  providerInventoryId: Number(flight.id),
  startDate: toIsoDateLiteral(flight.serviceDate),
  endDate: toIsoDateLiteral(flight.serviceDate),
  priceCents: Number(flight.priceCents),
  currencyCode: flight.currencyCode,
  title: flight.airlineName,
  subtitle: `${flight.originName} -> ${flight.destinationName}`,
  meta: [flight.stopsLabel, titleCase(flight.cabinClass)],
  metadata,
});

const createHttpClient = (baseUrl, enabled) => {
  const fetchJson = async (pathname, init = {}) => {
    if (!enabled) {
      return {
        status: 0,
        elapsedMs: 0,
        json: null,
        pathname,
        skipped: true,
      };
    }

    const url = withBaseUrl(baseUrl, pathname);
    const headers = new Headers(init.headers || {});
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const { response, elapsedMs } = await timedFetch(url, {
      ...init,
      headers,
    });

    return {
      url,
      pathname,
      status: response.status,
      elapsedMs,
      json: await readJson(response),
      skipped: false,
    };
  };

  const fetchText = async (pathname) => {
    if (!enabled) {
      return {
        status: 0,
        elapsedMs: 0,
        text: "",
        pathname,
        skipped: true,
      };
    }

    const url = withBaseUrl(baseUrl, pathname);
    const { response, elapsedMs } = await timedFetch(url);
    return {
      url,
      pathname,
      status: response.status,
      elapsedMs,
      text: await response.text(),
      skipped: false,
    };
  };

  return { fetchJson, fetchText };
};

const ensureTrip = async (client, table, http, name, metadata) => {
  const existing = await findTripIdByName(client, table, name);

  if (existing?.id) {
    const current = await http.fetchJson(`/api/trips/${existing.id}`);
    const items = current.json?.trip?.items || [];
    for (const item of [...items].sort((a, b) => b.position - a.position)) {
      await http.fetchJson(`/api/trips/${existing.id}/items/${item.id}`, {
        method: "DELETE",
      });
    }

    const reset = await http.fetchJson(`/api/trips/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        status: "draft",
        metadata,
        startDate: null,
        endDate: null,
        dateSource: "auto",
      }),
    });

    return {
      trip: reset.json?.trip || current.json?.trip || null,
      reused: true,
      tripId: existing.id,
    };
  }

  const created = await http.fetchJson("/api/trips", {
    method: "POST",
    body: JSON.stringify({
      name,
      status: "draft",
      metadata,
    }),
  });

  return {
    trip: created.json?.trip || null,
    reused: false,
    tripId: created.json?.trip?.id || null,
  };
};

const addItemToTrip = async (http, tripId, candidate) =>
  http.fetchJson(`/api/trips/${tripId}/items`, {
    method: "POST",
    body: JSON.stringify(candidate),
  });

const patchTrip = async (http, tripId, payload) =>
  http.fetchJson(`/api/trips/${tripId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

const getTrip = async (http, tripId) => http.fetchJson(`/api/trips/${tripId}`);

const getReplacementOptions = async (http, tripId, itemId) =>
  http.fetchJson(`/api/trips/${tripId}/items/${itemId}/replace-options`);

const previewReplace = async (http, tripId, itemId, candidate) =>
  http.fetchJson(`/api/trips/${tripId}/items/${itemId}/preview`, {
    method: "POST",
    body: JSON.stringify({
      actionType: "replace",
      candidate,
    }),
  });

const applyReplace = async (http, tripId, itemId, candidate) =>
  http.fetchJson(`/api/trips/${tripId}/items/${itemId}/apply`, {
    method: "POST",
    body: JSON.stringify({
      actionType: "replace",
      candidate,
    }),
  });

const buildWeekendScenario = async (client, table, http, currentDate) => {
  const checkIn = nextWeekday(currentDate, 5);
  const checkOut = addDays(checkIn, 2);
  const city = await findCityFixture(
    client,
    table,
    ["las-vegas", "orlando", "miami", "san-diego", "new-orleans"],
    checkIn,
    checkOut,
    true,
  );
  if (!city)
    throw new Error(
      "Unable to resolve a weekend leisure city with hotel and car inventory.",
    );

  const hotels = await findHotelOptions(
    client,
    table,
    city.slug,
    checkIn,
    checkOut,
  );
  const cars = await findCarOptions(
    client,
    table,
    city.slug,
    checkIn,
    checkOut,
  );
  const hotel = hotels[0];
  const car = cars[0];
  const tripName = `${QA_TRIP_PREFIX} Weekend Leisure`;
  const prepared = await ensureTrip(client, table, http, tripName, {
    qaSuite: "guided-booking",
    scenario: "weekend-leisure",
  });

  const operations = [];
  if (prepared.tripId) {
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildHotelCandidatePayload(hotel, checkIn, checkOut, {
          qaSuite: "guided-booking",
          scenario: "weekend-leisure",
        }),
      ),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildCarCandidatePayload(car, checkIn, checkOut, {
          qaSuite: "guided-booking",
          scenario: "weekend-leisure",
        }),
      ),
    );
  }

  const trip = prepared.tripId ? await getTrip(http, prepared.tripId) : null;
  const urls = {
    hotelSearch: toHotelSearchPath(city.slug, checkIn, checkOut),
    hotelDetail: `/hotels/${encodeURIComponent(hotel.slug)}`,
    carSearch: toCarSearchPath(city.slug, checkIn, checkOut),
    carDetail: `/car-rentals/${encodeURIComponent(car.slug)}?pickupDate=${checkIn}&dropoffDate=${checkOut}`,
    trip: prepared.tripId ? `/trips?trip=${prepared.tripId}` : "",
  };

  const pageChecks = [
    await http.fetchText(urls.hotelSearch),
    await http.fetchText(urls.hotelDetail),
    await http.fetchText(urls.carSearch),
    await http.fetchText(urls.carDetail),
    ...(prepared.tripId ? [await http.fetchText(urls.trip)] : []),
  ];

  return {
    key: "weekend-leisure-trip",
    title: "Weekend leisure trip",
    coverage: ["Hotels", "Cars", "Trips"],
    fixture: {
      city: city.name,
      citySlug: city.slug,
      checkIn,
      checkOut,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        price: formatMoney(hotel.priceCents, hotel.currencyCode),
      },
      car: {
        id: car.id,
        name: `${car.providerName} at ${car.locationName}`,
        price: formatMoney(car.priceCents, car.currencyCode),
      },
      tripId: prepared.tripId,
    },
    urls,
    flowSteps: [
      `Open ${urls.hotelSearch} and confirm the weekend dates survive search and pagination.`,
      `Inspect ${urls.hotelDetail} for cancellation, pay-later, and fee clarity before committing.`,
      `Open ${urls.carSearch} and compare airport versus city pickup options for the same stay window.`,
      `Open ${urls.trip} and confirm the prepared trip keeps hotel and car dates aligned without gaps.`,
    ],
    expectedOutcomes: [
      "Hotel and car search pages return live results for the same weekend window.",
      "The prepared trip shows two items, coherent dates, and a stable total snapshot.",
      "Airport-versus-city pickup tradeoffs are visible without losing date context.",
    ],
    prompts: {
      trustFailures:
        "Note any unclear fees, cancellation timing, or missing airport-vs-city context before a decision feels safe.",
      rankingWeirdness:
        "Check whether obviously stronger value options are buried below weaker weekend picks.",
      brokenStates:
        "Look for empty trays, stale totals, or trip-date drift after opening the prepared trip.",
      frictionPoints:
        "Capture any extra clicks needed to compare hotel and car options for the same dates.",
      performance:
        "Record whether the weekend search pages feel materially slower than home or trip pages.",
    },
    automated: {
      pageChecks,
      apiChecks: operations.concat(trip ? [trip] : []),
    },
  };
};

const buildBusinessScenario = async (client, table, http, currentDate) => {
  const depart = nextWeekday(currentDate, 1);
  const ret = addDays(depart, 2);
  const flight = await findFlightCandidate(client, table, {
    originSlugs: ["new-york", "denver", "los-angeles"],
    destinationSlugs: ["washington-dc", "boston", "chicago", "toronto"],
    startDate: depart,
    endDate: addDays(depart, 3),
    itineraryType: "round-trip",
    strategy: "business",
  });
  if (!flight) throw new Error("Unable to resolve a business flight fixture.");

  const hotels = await findHotelOptions(
    client,
    table,
    flight.destinationSlug,
    depart,
    ret,
  );
  const hotel = hotels[0];
  const tripName = `${QA_TRIP_PREFIX} Business Flight + Hotel`;
  const prepared = await ensureTrip(client, table, http, tripName, {
    qaSuite: "guided-booking",
    scenario: "business-flight-hotel",
  });

  const operations = [];
  if (prepared.tripId) {
    operations.push(
      await patchTrip(http, prepared.tripId, {
        startDate: depart,
        endDate: ret,
        dateSource: "manual",
      }),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildFlightCandidatePayload(flight, {
          qaSuite: "guided-booking",
          scenario: "business-flight-hotel",
        }),
      ),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildHotelCandidatePayload(hotel, depart, ret, {
          qaSuite: "guided-booking",
          scenario: "business-flight-hotel",
        }),
      ),
    );
  }

  const comparisonReturn = addDays(ret, 1);
  const flightResultsPath = toFlightResultsPath(
    flight.originSlug,
    flight.destinationSlug,
    "round-trip",
    {
      depart,
      return: ret,
      travelers: "1",
    },
  );
  const flightResultsAltPath = toFlightResultsPath(
    flight.originSlug,
    flight.destinationSlug,
    "round-trip",
    {
      depart,
      return: comparisonReturn,
      travelers: "1",
    },
  );
  const hotelSearchPath = toHotelSearchPath(
    flight.destinationSlug,
    depart,
    ret,
  );
  const pageChecks = [
    await http.fetchText(flightResultsPath),
    await http.fetchText(flightResultsAltPath),
    await http.fetchText(hotelSearchPath),
    ...(prepared.tripId
      ? [await http.fetchText(`/trips?trip=${prepared.tripId}`)]
      : []),
  ];

  const flightFingerprint = buildFlightFingerprint(pageChecks[0].text, [
    depart,
    ret,
    comparisonReturn,
  ]);
  const flightFingerprintAlt = buildFlightFingerprint(pageChecks[1].text, [
    depart,
    ret,
    comparisonReturn,
  ]);

  return {
    key: "business-flight-hotel",
    title: "Business flight + hotel",
    coverage: ["Flights", "Hotels", "Trips"],
    fixture: {
      origin: flight.originName,
      destination: flight.destinationName,
      depart,
      returnDate: ret,
      flight: {
        id: flight.id,
        airline: flight.airlineName,
        departure: minutesToClock(flight.departureMinutes),
        stops: flight.stopsLabel,
        cabin: titleCase(flight.cabinClass),
        price: formatMoney(flight.priceCents, flight.currencyCode),
      },
      hotel: {
        id: hotel.id,
        name: hotel.name,
        price: formatMoney(hotel.priceCents, hotel.currencyCode),
      },
      tripId: prepared.tripId,
    },
    urls: {
      flightResults: flightResultsPath,
      hotelSearch: hotelSearchPath,
      trip: prepared.tripId ? `/trips?trip=${prepared.tripId}` : "",
    },
    flowSteps: [
      `Open ${flightResultsPath} and verify the round-trip search preserves the chosen return date in the UI.`,
      `Open ${hotelSearchPath} and shortlist a hotel that feels credible for a short work stay.`,
      `Open ${prepared.tripId ? `/trips?trip=${prepared.tripId}` : "/trips"} and confirm the flight-plus-hotel itinerary stays coherent after the manual date pin.`,
      "Change the return date once and re-check whether result ordering or price context changes in a believable way.",
    ],
    expectedOutcomes: [
      "The route, departure date, and return date remain visible through the flight workflow.",
      "The prepared trip reflects a two-night work trip without date gaps.",
      "Changing the return date should affect result context when the itinerary is truly round-trip sensitive.",
    ],
    prompts: {
      trustFailures:
        "Call out any place where the round-trip promise feels weaker than the visible UI state.",
      rankingWeirdness:
        "Check whether early, nonstop work-friendly options are ranked sensibly against longer or pricier itineraries.",
      brokenStates:
        "Watch for trip dates collapsing back to one day or flight timing becoming inconsistent after edits.",
      frictionPoints:
        "Note every manual correction needed to keep dates aligned across flights, hotels, and the trip builder.",
      performance:
        "Compare flight-results latency against hotels and note whether business edits feel sluggish.",
    },
    automated: {
      pageChecks,
      apiChecks: operations,
      probes: {
        returnDateFingerprint: flightFingerprint,
        alternateReturnDateFingerprint: flightFingerprintAlt,
        identicalAfterReturnShift: flightFingerprint === flightFingerprintAlt,
      },
    },
  };
};

const buildBudgetScenario = async (client, table, http, currentDate) => {
  const depart = addDays(currentDate, 8);
  const ret = addDays(depart, 2);
  const flight = await findFlightCandidate(client, table, {
    originSlugs: ["new-york", "denver"],
    destinationSlugs: ["washington-dc", "chicago", "las-vegas", "boston"],
    startDate: depart,
    endDate: addDays(depart, 4),
    itineraryType: "round-trip",
    strategy: "price",
  });
  if (!flight)
    throw new Error("Unable to resolve a budget-trip flight fixture.");

  const hotels = await findHotelOptions(
    client,
    table,
    flight.destinationSlug,
    depart,
    ret,
    4,
  );
  const hotel = hotels[0];
  const betterRatedHotel = hotels
    .slice()
    .sort(
      (left, right) =>
        Number(right.rating) - Number(left.rating) ||
        Number(left.priceCents) - Number(right.priceCents),
    )[0];
  const pageChecks = [
    await http.fetchText(
      toFlightResultsPath(
        flight.originSlug,
        flight.destinationSlug,
        "round-trip",
        {
          depart,
          return: ret,
          travelers: "1",
        },
      ),
    ),
    await http.fetchText(
      toHotelSearchPath(flight.destinationSlug, depart, ret, {
        sort: "price-asc",
      }),
    ),
  ];

  return {
    key: "budget-constrained-trip",
    title: "Budget-constrained trip",
    coverage: ["Flights", "Hotels"],
    fixture: {
      origin: flight.originName,
      destination: flight.destinationName,
      depart,
      returnDate: ret,
      cheapestFlight: formatMoney(flight.priceCents, flight.currencyCode),
      cheapestHotel: formatMoney(hotel.priceCents, hotel.currencyCode),
      betterRatedHotel:
        betterRatedHotel && betterRatedHotel.id !== hotel.id
          ? `${betterRatedHotel.name} at ${formatMoney(
              betterRatedHotel.priceCents,
              betterRatedHotel.currencyCode,
            )}`
          : null,
    },
    urls: {
      flightResults: toFlightResultsPath(
        flight.originSlug,
        flight.destinationSlug,
        "round-trip",
        {
          depart,
          return: ret,
          travelers: "1",
        },
      ),
      hotelSearch: toHotelSearchPath(flight.destinationSlug, depart, ret, {
        sort: "price-asc",
      }),
    },
    flowSteps: [
      "Start with the cheapest flight result and verify whether a slightly pricier nonstop or earlier option is surfaced clearly enough to compare.",
      "Open the hotel results sorted by price and compare the cheapest property against the best-rated visible alternative.",
      "Decide whether the budget choice still feels trustworthy once fees, cancellation, and location context are considered.",
    ],
    expectedOutcomes: [
      "Price-sorted searches expose the cheapest credible options without hiding obvious tradeoffs.",
      "A budget traveler can compare the cheapest hotel against a better-rated alternative without losing context.",
      "Low-price options still disclose enough trust information to avoid false value signals.",
    ],
    prompts: {
      trustFailures:
        "Capture any cheap option that looks attractive until hidden fees, weak cancellation detail, or vague policies appear.",
      rankingWeirdness:
        "Note if clearly worse-value hotels or flights float above better low-cost choices.",
      brokenStates:
        "Watch for empty filter states or totals that stop matching visible price cards when sorting by price.",
      frictionPoints:
        "List any extra comparison work needed to understand whether the cheapest result is actually bookable.",
      performance:
        "Compare the price-sort load time against recommended-sort behavior.",
    },
    automated: {
      pageChecks,
      apiChecks: [],
    },
  };
};

const buildLastMinuteScenario = async (client, table, http, currentDate) => {
  const depart = addDays(currentDate, 1);
  const ret = addDays(depart, 1);
  const flight = await findFlightCandidate(client, table, {
    originSlugs: ["denver", "new-york"],
    destinationSlugs: ["chicago", "washington-dc", "las-vegas"],
    startDate: depart,
    endDate: addDays(currentDate, 3),
    itineraryType: "round-trip",
    strategy: "price",
  });
  if (!flight)
    throw new Error("Unable to resolve a last-minute flight fixture.");

  const hotels = await findHotelOptions(
    client,
    table,
    flight.destinationSlug,
    depart,
    ret,
    4,
  );
  const hotel = hotels[0];
  const pageChecks = [
    await http.fetchText(
      toFlightResultsPath(
        flight.originSlug,
        flight.destinationSlug,
        "round-trip",
        {
          depart,
          return: ret,
          travelers: "1",
        },
      ),
    ),
    await http.fetchText(
      toHotelSearchPath(flight.destinationSlug, depart, ret),
    ),
  ];

  return {
    key: "last-minute-booking",
    title: "Last-minute booking",
    coverage: ["Flights", "Hotels"],
    fixture: {
      origin: flight.originName,
      destination: flight.destinationName,
      depart,
      returnDate: ret,
      flightPrice: formatMoney(flight.priceCents, flight.currencyCode),
      hotelPrice: formatMoney(hotel.priceCents, hotel.currencyCode),
    },
    urls: {
      flightResults: toFlightResultsPath(
        flight.originSlug,
        flight.destinationSlug,
        "round-trip",
        {
          depart,
          return: ret,
          travelers: "1",
        },
      ),
      hotelSearch: toHotelSearchPath(flight.destinationSlug, depart, ret),
    },
    flowSteps: [
      "Open the last-minute flight results and verify whether urgency increases trust detail instead of removing it.",
      "Open the matching hotel search for the same dates and look for stale availability or price mismatch signals.",
      "Revisit both surfaces after one manual refresh and note whether prices, availability, and totals stay coherent.",
    ],
    expectedOutcomes: [
      "Last-minute routes still surface clear price, timing, and availability context.",
      "Hotel availability remains believable for the same near-term window.",
      "Refresh actions do not push the journey into broken or contradictory states.",
    ],
    prompts: {
      trustFailures:
        "Capture any place where urgency makes prices look fragile, incomplete, or misleading.",
      rankingWeirdness:
        "Note if stale-looking or multi-stop flights outrank stronger short-notice choices without explanation.",
      brokenStates:
        "Watch for refresh loops, empty-state flashes, or contradictory availability labels.",
      frictionPoints:
        "List manual retries or context switches needed to confirm the booking is still viable.",
      performance:
        "Record whether near-term searches are materially slower than medium-horizon searches.",
    },
    automated: {
      pageChecks,
      apiChecks: [],
    },
  };
};

const buildMultiItemScenario = async (client, table, http, currentDate) => {
  const depart = nextWeekday(currentDate, 5);
  const ret = addDays(depart, 2);
  const flight = await findFlightCandidate(client, table, {
    originSlugs: ["new-york", "denver"],
    destinationSlugs: ["las-vegas", "orlando", "miami"],
    startDate: depart,
    endDate: addDays(depart, 2),
    itineraryType: "round-trip",
    strategy: "price",
  });
  if (!flight)
    throw new Error("Unable to resolve a multi-item itinerary flight fixture.");

  const hotels = await findHotelOptions(
    client,
    table,
    flight.destinationSlug,
    depart,
    ret,
    5,
  );
  const cars = await findCarOptions(
    client,
    table,
    flight.destinationSlug,
    depart,
    ret,
    6,
  );
  const hotel = hotels[0];
  const car = cars[0];
  const tripName = `${QA_TRIP_PREFIX} Multi-item Replacements`;
  const prepared = await ensureTrip(client, table, http, tripName, {
    qaSuite: "guided-booking",
    scenario: "multi-item-replacements",
  });

  const operations = [];
  if (prepared.tripId) {
    operations.push(
      await patchTrip(http, prepared.tripId, {
        startDate: depart,
        endDate: ret,
        dateSource: "manual",
      }),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildFlightCandidatePayload(flight, {
          qaSuite: "guided-booking",
          scenario: "multi-item-replacements",
        }),
      ),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildHotelCandidatePayload(hotel, depart, ret, {
          qaSuite: "guided-booking",
          scenario: "multi-item-replacements",
        }),
      ),
    );
    operations.push(
      await addItemToTrip(
        http,
        prepared.tripId,
        buildCarCandidatePayload(car, depart, ret, {
          qaSuite: "guided-booking",
          scenario: "multi-item-replacements",
        }),
      ),
    );
  }

  const trip = prepared.tripId ? await getTrip(http, prepared.tripId) : null;
  const hotelItem =
    trip?.json?.trip?.items?.find((entry) => entry.itemType === "hotel") ||
    null;
  const carItem =
    trip?.json?.trip?.items?.find((entry) => entry.itemType === "car") || null;
  const hotelOptions =
    prepared.tripId && hotelItem
      ? await getReplacementOptions(http, prepared.tripId, hotelItem.id)
      : null;
  const carOptions =
    prepared.tripId && carItem
      ? await getReplacementOptions(http, prepared.tripId, carItem.id)
      : null;
  const hotelAlternative = getDistinctAlternative(
    hotelOptions?.json?.options || [],
    hotel.id,
  );
  const carAlternative = getDistinctAlternative(
    carOptions?.json?.options || [],
    car.id,
  );
  const hotelPreview =
    prepared.tripId && hotelItem && hotelAlternative
      ? await previewReplace(
          http,
          prepared.tripId,
          hotelItem.id,
          hotelAlternative.candidate,
        )
      : null;
  const carPreview =
    prepared.tripId && carItem && carAlternative
      ? await previewReplace(
          http,
          prepared.tripId,
          carItem.id,
          carAlternative.candidate,
        )
      : null;

  return {
    key: "multi-item-itinerary-with-replacements",
    title: "Multi-item itinerary with replacements",
    coverage: ["Flights", "Hotels", "Cars", "Trips"],
    fixture: {
      origin: flight.originName,
      destination: flight.destinationName,
      depart,
      returnDate: ret,
      flightId: flight.id,
      hotelId: hotel.id,
      carId: car.id,
      tripId: prepared.tripId,
      hotelReplacementCount: hotelOptions?.json?.options?.length || 0,
      carReplacementCount: carOptions?.json?.options?.length || 0,
    },
    urls: {
      trip: prepared.tripId ? `/trips?trip=${prepared.tripId}` : "",
    },
    flowSteps: [
      `Open ${prepared.tripId ? `/trips?trip=${prepared.tripId}` : "/trips"} and confirm the prepared trip contains flight, hotel, and car items in one itinerary.`,
      "Open hotel replacement options, preview a swap, and verify the price/coherence impact is understandable before apply.",
      "Repeat the replacement flow for the car item and compare whether airport-versus-city tradeoffs stay explicit.",
      "Check that the itinerary remains coherent after one replacement preview and one applied change.",
    ],
    expectedOutcomes: [
      "Replacement options are available for hotel and car items.",
      "Preview explains price, timing, and coherence impact before the change is applied.",
      "After a swap, the trip remains readable and the rollback context stays intact.",
    ],
    prompts: {
      trustFailures:
        "Capture any preview that hides cost or schedule consequences until after apply.",
      rankingWeirdness:
        "Check whether replacement options are ordered sensibly for price, quality, and location tradeoffs.",
      brokenStates:
        "Watch for preview drawers that fail to open, stale items after apply, or rollback gaps.",
      frictionPoints:
        "List any manual steps needed to understand why one replacement is recommended over another.",
      performance:
        "Record preview/apply latency and whether the itinerary UI blocks during swaps.",
    },
    automated: {
      pageChecks: prepared.tripId
        ? [await http.fetchText(`/trips?trip=${prepared.tripId}`)]
        : [],
      apiChecks: operations
        .concat(trip ? [trip] : [])
        .concat(hotelOptions ? [hotelOptions] : [])
        .concat(carOptions ? [carOptions] : [])
        .concat(hotelPreview ? [hotelPreview] : [])
        .concat(carPreview ? [carPreview] : []),
    },
  };
};

const buildBundleScenario = async (client, table, http, currentDate) => {
  const depart = nextWeekday(currentDate, 1);
  const manualEndDate = addDays(depart, 2);
  const flight = await findFlightCandidate(client, table, {
    originSlugs: ["new-york", "denver"],
    destinationSlugs: ["washington-dc", "boston", "chicago"],
    startDate: depart,
    endDate: addDays(depart, 3),
    itineraryType: "round-trip",
    strategy: "business",
  });
  if (!flight)
    throw new Error("Unable to resolve a bundle-suggestion flight fixture.");

  const tripName = `${QA_TRIP_PREFIX} Bundle Suggestion Override`;
  const prepared = await ensureTrip(client, table, http, tripName, {
    qaSuite: "guided-booking",
    scenario: "bundle-override",
  });
  if (!prepared.tripId) {
    throw new Error("Unable to prepare the bundle suggestion QA trip.");
  }

  const operations = [];
  operations.push(
    await addItemToTrip(
      http,
      prepared.tripId,
      buildFlightCandidatePayload(flight, {
        qaSuite: "guided-booking",
        scenario: "bundle-override",
      }),
    ),
  );

  const preManual = await getTrip(http, prepared.tripId);
  operations.push(preManual);
  operations.push(
    await patchTrip(http, prepared.tripId, {
      startDate: depart,
      endDate: manualEndDate,
      dateSource: "manual",
    }),
  );
  const postManual = await getTrip(http, prepared.tripId);
  operations.push(postManual);

  const suggestion =
    postManual.json?.trip?.bundling?.suggestions?.find(
      (entry) => entry.itemType === "hotel",
    ) || null;
  let addSuggestion = null;
  let addedTrip = null;
  let replacementOptions = null;
  let preview = null;
  let apply = null;

  if (suggestion) {
    addSuggestion = await addItemToTrip(
      http,
      prepared.tripId,
      suggestion.tripCandidate,
    );
    operations.push(addSuggestion);
    addedTrip = await getTrip(http, prepared.tripId);
    operations.push(addedTrip);
    const hotelItem = addedTrip.json?.trip?.items?.find(
      (entry) =>
        entry.itemType === "hotel" &&
        Number(entry.hotelId) === Number(suggestion.inventory.inventoryId),
    );
    if (hotelItem) {
      replacementOptions = await getReplacementOptions(
        http,
        prepared.tripId,
        hotelItem.id,
      );
      operations.push(replacementOptions);
      const manualAlternative = getDistinctAlternative(
        replacementOptions.json?.options || [],
        suggestion.inventory.inventoryId,
      );
      if (manualAlternative) {
        preview = await previewReplace(
          http,
          prepared.tripId,
          hotelItem.id,
          manualAlternative.candidate,
        );
        operations.push(preview);
        apply = await applyReplace(
          http,
          prepared.tripId,
          hotelItem.id,
          manualAlternative.candidate,
        );
        operations.push(apply);
      }
    }
  }

  return {
    key: "smart-bundle-suggestion-with-manual-override",
    title: "Smart bundle suggestion with manual override",
    coverage: ["Flights", "Trips", "Bundles", "Hotels"],
    fixture: {
      origin: flight.originName,
      destination: flight.destinationName,
      depart,
      manualEndDate,
      tripId: prepared.tripId,
      preManualSuggestionCount:
        preManual.json?.trip?.bundling?.suggestions?.length || 0,
      postManualSuggestionCount:
        postManual.json?.trip?.bundling?.suggestions?.length || 0,
      manualOverrideSelectionMode:
        preview?.json?.preview?.bundleImpact?.selectionMode ||
        apply?.json?.preview?.bundleImpact?.selectionMode ||
        null,
    },
    urls: {
      trip: `/trips?trip=${prepared.tripId}`,
    },
    flowSteps: [
      `Open /trips?trip=${prepared.tripId} and review the flight-only trip before manual dates are pinned.`,
      "Confirm whether the bundling rail is empty or weak before the trip has an explicit end date.",
      "After manual dates are applied, review the suggested hotel and read the explanation before accepting it.",
      "Use replacement options on the bundled hotel and preview a manual override before applying it.",
    ],
    expectedOutcomes: [
      "The trip surfaces a credible hotel suggestion once the stay window is explicit.",
      "Bundle explanations describe price position and tradeoffs before add.",
      "Manual override preview clearly states that the selection moved away from the recommended bundle.",
    ],
    prompts: {
      trustFailures:
        "Call out any place where the bundle suggestion or override hides why it was chosen.",
      rankingWeirdness:
        "Check whether the recommended bundle looks weaker than obvious alternatives without explanation.",
      brokenStates:
        "Watch for bundle cards disappearing after add, replacement previews not loading, or trip totals desyncing.",
      frictionPoints:
        "List the steps required to go from a recommendation to a confident override decision.",
      performance:
        "Note the time from opening the trip to seeing suggestions, replacement options, and preview impact.",
    },
    automated: {
      pageChecks: [await http.fetchText(`/trips?trip=${prepared.tripId}`)],
      apiChecks: operations,
    },
  };
};

const collectFindings = (scenarios) => {
  const findings = [];
  const business = scenarios.find(
    (entry) => entry.key === "business-flight-hotel",
  );
  const replacements = scenarios.find(
    (entry) => entry.key === "multi-item-itinerary-with-replacements",
  );
  const allApiChecks = scenarios.flatMap(
    (entry) => entry.automated.apiChecks || [],
  );
  const mutationChecks = allApiChecks.filter(
    (entry) =>
      typeof entry?.pathname === "string" &&
      (entry.pathname.includes("/items") ||
        entry.pathname.includes("/preview") ||
        entry.pathname.includes("/apply")),
  );
  const tripReadChecks = allApiChecks.filter(
    (entry) =>
      typeof entry?.pathname === "string" &&
      /^\/api\/trips\/\d+$/.test(entry.pathname),
  );

  if (business?.automated?.probes?.identicalAfterReturnShift) {
    findings.push({
      severity: "high",
      title:
        "Round-trip flight results appear insensitive to return-date changes",
      evidence:
        "The same round-trip results fingerprint was returned after shifting only the return date in the business scenario.",
      followOn:
        "Treat return date as a first-class query input all the way through result retrieval and bundle intelligence.",
      scenarios: ["Business flight + hotel"],
    });
  }

  const slowestMutation = mutationChecks
    .slice()
    .sort((left, right) => Number(right.elapsedMs) - Number(left.elapsedMs))[0];
  const averageMutationMs =
    mutationChecks.reduce(
      (sum, entry) => sum + Number(entry.elapsedMs || 0),
      0,
    ) / Math.max(1, mutationChecks.length);
  if (slowestMutation && Number(slowestMutation.elapsedMs) >= 4000) {
    findings.push({
      severity: "high",
      title:
        "Trip edit apply latency is too high for confidence-sensitive booking flows",
      evidence: `${slowestMutation.pathname} took ${slowestMutation.elapsedMs.toFixed(
        0,
      )}ms in the prepared QA run.`,
      followOn:
        "Reduce trip mutation round-trips or move expensive recomputation off the blocking path so apply/replace stays interactive.",
      scenarios: [
        "Multi-item itinerary with replacements",
        "Smart bundle suggestion with manual override",
      ],
    });
  }

  if (
    Number(replacements?.fixture?.hotelReplacementCount || 0) < 2 ||
    Number(replacements?.fixture?.carReplacementCount || 0) < 2
  ) {
    findings.push({
      severity: "medium",
      title:
        "Replacement depth is thin for at least one prepared multi-item scenario",
      evidence:
        "One of the replacement panels returned fewer than two credible alternatives during the prepared replacement flow.",
      followOn:
        "Broaden replacement candidate scoring or fall back more gracefully when the inventory pool is shallow.",
      scenarios: ["Multi-item itinerary with replacements"],
    });
  }

  const averageTripReadMs =
    tripReadChecks.reduce(
      (sum, entry) => sum + Number(entry.elapsedMs || 0),
      0,
    ) / Math.max(1, tripReadChecks.length);
  if (tripReadChecks.length >= 3 && averageTripReadMs >= 1000) {
    findings.push({
      severity: "medium",
      title: "Trip detail refresh remains slow after edits",
      evidence: `Prepared trip detail fetches averaged ${averageTripReadMs.toFixed(
        0,
      )}ms across the QA run.`,
      followOn:
        "Profile trip-detail recomputation and trim repeated bundling/revalidation work on read-after-write paths.",
      scenarios: [
        "Weekend leisure trip",
        "Business flight + hotel",
        "Multi-item itinerary with replacements",
      ],
    });
  }

  if (mutationChecks.length >= 4 && averageMutationMs >= 1800) {
    findings.push({
      severity: "medium",
      title:
        "Trip edits are consistently multi-second, not just the single slowest apply",
      evidence: `Trip mutation endpoints averaged ${averageMutationMs.toFixed(
        0,
      )}ms across add, preview, and apply requests.`,
      followOn:
        "Set an interaction budget for trip edits and instrument the slowest repository paths so future stabilization work has a measurable target.",
      scenarios: [
        "Weekend leisure trip",
        "Business flight + hotel",
        "Multi-item itinerary with replacements",
        "Smart bundle suggestion with manual override",
      ],
    });
  }

  return findings;
};

const renderMarkdown = (report) => {
  const lines = [
    "# Guided Booking QA Suite",
    "",
    `Generated: ${report.generatedAt}`,
    `Env file: \`${report.envFile}\``,
    `Database schema: \`${report.schema}\``,
    `Resolved base URL: \`${report.baseUrl}\``,
    `Base URL resolution: ${report.baseUrlResolution}`,
    `Seed horizon observed: ${report.horizon.start} -> ${report.horizon.end}`,
    "",
    "## How To Use",
    "",
    "1. Start the Andacity app locally.",
    "2. Run this harness to refresh live fixtures after a reseed.",
    "3. Execute the six scenarios below against the generated URLs and prepared trip ids.",
    "4. Append manual observations in the trust, ranking, broken-state, friction, and performance slots.",
    "",
  ];

  if (report.findings.length) {
    lines.push("## Critical Follow-on Issues", "");
    for (const finding of report.findings) {
      lines.push(`- ${finding.severity.toUpperCase()}: ${finding.title}`);
      lines.push(`  Evidence: ${finding.evidence}`);
      lines.push(`  Follow-on: ${finding.followOn}`);
      lines.push(`  Scenarios: ${finding.scenarios.join(", ")}`);
    }
    lines.push("");
  } else {
    lines.push(
      "## Critical Follow-on Issues",
      "",
      "- No automated critical failures were detected in this run.",
      "",
    );
  }

  lines.push("## Scenarios", "");

  for (const scenario of report.scenarios) {
    lines.push(`### ${scenario.title}`, "");
    lines.push(`Coverage: ${scenario.coverage.join(", ")}`);
    lines.push("");
    lines.push("Fixture:");
    for (const [key, value] of Object.entries(scenario.fixture)) {
      if (value == null || value === "") continue;
      if (typeof value === "object" && !Array.isArray(value)) {
        lines.push(`- ${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`- ${key}: ${value}`);
      }
    }
    lines.push("");
    lines.push("URLs:");
    for (const [key, value] of Object.entries(scenario.urls)) {
      if (!value) continue;
      lines.push(`- ${key}: ${withBaseUrl(report.baseUrl, value)}`);
    }
    lines.push("");
    lines.push("Flow steps:");
    scenario.flowSteps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push("");
    lines.push("Expected outcomes:");
    scenario.expectedOutcomes.forEach((entry) => {
      lines.push(`- ${entry}`);
    });
    lines.push("");
    lines.push("Observation prompts:");
    lines.push(`- Trust failures: ${scenario.prompts.trustFailures}`);
    lines.push(`- Ranking weirdness: ${scenario.prompts.rankingWeirdness}`);
    lines.push(`- Broken states: ${scenario.prompts.brokenStates}`);
    lines.push(`- Friction points: ${scenario.prompts.frictionPoints}`);
    lines.push(`- Performance observations: ${scenario.prompts.performance}`);
    lines.push("");
    lines.push("Automated observations:");
    for (const entry of scenario.automated.pageChecks || []) {
      lines.push(
        `- ${summarizeHttp({ label: entry.pathname, status: entry.status, elapsedMs: entry.elapsedMs })}`,
      );
    }
    for (const entry of scenario.automated.apiChecks || []) {
      if (!entry || entry.skipped) continue;
      lines.push(
        `- ${summarizeHttp({
          label: entry.pathname || "api",
          status: entry.status,
          elapsedMs: entry.elapsedMs,
        })}`,
      );
    }
    if (scenario.automated.probes) {
      for (const [key, value] of Object.entries(scenario.automated.probes)) {
        lines.push(`- ${key}: ${value}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const envEntries = await parseEnvFile(path.resolve(args.envFile));
  const databaseUrl =
    process.env.DATABASE_URL ||
    envEntries.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    envEntries.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is missing from ${args.envFile}.`);
  }

  const requestedBaseUrl =
    args.baseUrl ||
    process.env.PUBLIC_BASE_URL ||
    envEntries.PUBLIC_BASE_URL ||
    "http://127.0.0.1:5173";
  const schema = normalizeSchema(
    args.schema ||
      process.env.DB_SCHEMA ||
      envEntries.DB_SCHEMA ||
      DEFAULT_SCHEMA,
  );
  const resolvedBase = await resolveReachableBaseUrl(
    requestedBaseUrl,
    args.skipHttp,
  );
  const http = createHttpClient(resolvedBase.baseUrl, !args.skipHttp);
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const { table } = buildDbHelpers(schema);
    const currentDate = await getCurrentDate(client);
    const horizon = await queryOne(
      client,
      `
        select
          min(service_date)::text as start,
          max(service_date)::text as end
        from ${table("flight_itineraries")}
      `,
    );

    const scenarios = [];
    scenarios.push(
      await buildWeekendScenario(client, table, http, currentDate),
    );
    scenarios.push(
      await buildBusinessScenario(client, table, http, currentDate),
    );
    scenarios.push(await buildBudgetScenario(client, table, http, currentDate));
    scenarios.push(
      await buildLastMinuteScenario(client, table, http, currentDate),
    );
    scenarios.push(
      await buildMultiItemScenario(client, table, http, currentDate),
    );
    scenarios.push(await buildBundleScenario(client, table, http, currentDate));

    const report = {
      generatedAt: new Date().toISOString(),
      envFile: args.envFile,
      schema,
      baseUrl: resolvedBase.baseUrl,
      baseUrlResolution: resolvedBase.resolutionNote,
      horizon: {
        start: horizon?.start || currentDate,
        end: horizon?.end || currentDate,
      },
      scenarios,
      findings: collectFindings(scenarios),
    };

    const markdown = renderMarkdown(report);

    if (args.writeReport) {
      await fs.writeFile(path.resolve(args.writeReport), markdown, "utf8");
    }

    if (args.writeJson) {
      await fs.writeFile(
        path.resolve(args.writeJson),
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8",
      );
    }

    if (args.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    process.stdout.write(markdown);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  const message =
    error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
