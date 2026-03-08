// @ts-nocheck
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";
import {
  buildPostgresSeedPayload,
  TABLE_INSERT_ORDER,
} from "../../src/seed/db/postgres-seed-payload.js";

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), "seed/output/postgres");
const DEFAULT_DB_SCHEMA = "andacity_app";
const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/;

const normalizeSchemaName = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return IDENTIFIER_RE.test(normalized) ? normalized : DEFAULT_DB_SCHEMA;
};

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;

const schemaQualified = (schema, tableName) =>
  `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}`;

const parseArgs = (argv) => {
  const args = {
    mode: "plan",
    vertical: "all",
    outDir: DEFAULT_OUT_DIR,
    schema: normalizeSchemaName(process.env.DB_SCHEMA),
    reset: false,
    city: "",
    from: "",
    to: "",
    itineraryType: "",
    departDate: "",
    maxFlightRoutes: 30,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const value = argv[i + 1];

    if (token === "--mode" && value) {
      args.mode = String(value).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === "--vertical" && value) {
      args.vertical = String(value).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === "--city" && value) {
      args.city = String(value).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === "--from" && value) {
      args.from = String(value).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === "--to" && value) {
      args.to = String(value).trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === "--itinerary" && value) {
      const itinerary = String(value).trim().toLowerCase();
      args.itineraryType =
        itinerary === "one-way"
          ? "one-way"
          : itinerary === "round-trip"
            ? "round-trip"
            : "";
      i += 1;
      continue;
    }

    if (token === "--depart" && value) {
      args.departDate = String(value).trim();
      i += 1;
      continue;
    }

    if (token === "--out" && value) {
      args.outDir = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }

    if (token === "--schema" && value) {
      args.schema = normalizeSchemaName(value);
      i += 1;
      continue;
    }

    if (token === "--reset") {
      args.reset = true;
      continue;
    }

    if (token === "--max-flight-routes" && value) {
      const n = Number.parseInt(String(value), 10);
      args.maxFlightRoutes = Number.isFinite(n) ? Math.max(1, n) : 30;
      i += 1;
      continue;
    }
  }

  if (!["plan", "files", "apply"].includes(args.mode)) {
    args.mode = "plan";
  }

  return args;
};

const writeJson = async (filePath, payload) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
};

const logPlan = (payload) => {
  const totalRows = TABLE_INSERT_ORDER.reduce(
    (sum, table) => sum + Number(payload.rowCounts[table] || 0),
    0,
  );

  const summary = {
    ...payload.meta,
    totalRows,
    tables: payload.rowCounts,
  };

  console.log(JSON.stringify(summary, null, 2));
};

const createReferenceState = () => ({
  countries: new Map(),
  regions: new Map(),
  cities: new Map(),
  airports: new Map(),
  hotelBrands: new Map(),
  hotels: new Map(),
  hotelAmenities: new Map(),
  carProviders: new Map(),
  carVehicleClasses: new Map(),
  carLocations: new Map(),
  carInventory: new Map(),
  airlines: new Map(),
  flightRoutes: new Map(),
  flightItineraries: new Map(),
});

const upsertCountries = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into countries (iso2, iso3, slug, name)
      values ($1, $2, $3, $4)
      on conflict (slug)
      do update set
        iso2 = excluded.iso2,
        iso3 = excluded.iso3,
        name = excluded.name,
        updated_at = now()
      returning id
    `,
      [row.iso2, row.iso3, row.slug, row.name],
    );

    refs.countries.set(row.slug, result.rows[0].id);
  }
};

const upsertRegions = async (client, rows, refs) => {
  for (const row of rows) {
    const countryId = refs.countries.get(row.countrySlug);
    if (!countryId) continue;

    const result = await client.query(
      `
      insert into regions (country_id, slug, code, name)
      values ($1, $2, $3, $4)
      on conflict (country_id, slug)
      do update set
        code = excluded.code,
        name = excluded.name,
        updated_at = now()
      returning id
    `,
      [countryId, row.slug, row.code, row.name],
    );

    refs.regions.set(`${row.countrySlug}:${row.slug}`, result.rows[0].id);
  }
};

const upsertCities = async (client, rows, refs) => {
  for (const row of rows) {
    const countryId = refs.countries.get(row.countrySlug);
    if (!countryId) continue;

    const regionId =
      refs.regions.get(`${row.countrySlug}:${row.regionSlug}`) || null;

    const result = await client.query(
      `
      insert into cities (
        seed_key,
        slug,
        name,
        country_id,
        region_id,
        latitude,
        longitude,
        popularity_rank,
        featured_rank,
        aliases
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (slug)
      do update set
        seed_key = excluded.seed_key,
        name = excluded.name,
        country_id = excluded.country_id,
        region_id = excluded.region_id,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        popularity_rank = excluded.popularity_rank,
        featured_rank = excluded.featured_rank,
        aliases = excluded.aliases,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        row.slug,
        row.name,
        countryId,
        regionId,
        row.latitude,
        row.longitude,
        row.popularityRank,
        row.featuredRank,
        row.aliases,
      ],
    );

    refs.cities.set(row.slug, result.rows[0].id);
  }
};

const upsertAirports = async (client, rows, refs) => {
  for (const row of rows) {
    const cityId = refs.cities.get(row.citySlug);
    if (!cityId) continue;

    const result = await client.query(
      `
      insert into airports (
        seed_key,
        city_id,
        iata_code,
        name,
        latitude,
        longitude,
        timezone,
        is_primary
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (iata_code)
      do update set
        seed_key = excluded.seed_key,
        city_id = excluded.city_id,
        name = excluded.name,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        timezone = excluded.timezone,
        is_primary = excluded.is_primary,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        cityId,
        row.iataCode,
        row.name,
        row.latitude,
        row.longitude,
        row.timezone,
        row.isPrimary,
      ],
    );

    refs.airports.set(row.iataCode, result.rows[0].id);
  }
};

const upsertHotelBrands = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into hotel_brands (slug, name)
      values ($1, $2)
      on conflict (slug)
      do update set
        name = excluded.name,
        updated_at = now()
      returning id
    `,
      [row.slug, row.name],
    );

    refs.hotelBrands.set(row.slug, result.rows[0].id);
  }
};

const upsertHotels = async (client, rows, refs) => {
  for (const row of rows) {
    const cityId = refs.cities.get(row.citySlug);
    if (!cityId) continue;

    const brandId = refs.hotelBrands.get(row.brandSlug) || null;

    const result = await client.query(
      `
      insert into hotels (
        seed_key,
        slug,
        city_id,
        brand_id,
        name,
        neighborhood,
        property_type,
        address_line,
        latitude,
        longitude,
        stars,
        rating,
        review_count,
        summary,
        currency_code,
        from_nightly_cents,
        free_cancellation,
        pay_later,
        no_resort_fees,
        check_in_time,
        check_out_time,
        cancellation_blurb,
        payment_blurb,
        fees_blurb,
        featured_rank
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25
      )
      on conflict (slug)
      do update set
        seed_key = excluded.seed_key,
        city_id = excluded.city_id,
        brand_id = excluded.brand_id,
        name = excluded.name,
        neighborhood = excluded.neighborhood,
        property_type = excluded.property_type,
        address_line = excluded.address_line,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        stars = excluded.stars,
        rating = excluded.rating,
        review_count = excluded.review_count,
        summary = excluded.summary,
        currency_code = excluded.currency_code,
        from_nightly_cents = excluded.from_nightly_cents,
        free_cancellation = excluded.free_cancellation,
        pay_later = excluded.pay_later,
        no_resort_fees = excluded.no_resort_fees,
        check_in_time = excluded.check_in_time,
        check_out_time = excluded.check_out_time,
        cancellation_blurb = excluded.cancellation_blurb,
        payment_blurb = excluded.payment_blurb,
        fees_blurb = excluded.fees_blurb,
        featured_rank = excluded.featured_rank,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        row.slug,
        cityId,
        brandId,
        row.name,
        row.neighborhood,
        row.propertyType,
        row.addressLine,
        row.latitude,
        row.longitude,
        row.stars,
        row.rating,
        row.reviewCount,
        row.summary,
        row.currencyCode,
        row.fromNightlyCents,
        row.freeCancellation,
        row.payLater,
        row.noResortFees,
        row.checkInTime,
        row.checkOutTime,
        row.cancellationBlurb,
        row.paymentBlurb,
        row.feesBlurb,
        row.featuredRank,
      ],
    );

    refs.hotels.set(row.slug, result.rows[0].id);
  }
};

const upsertHotelImages = async (client, rows, refs) => {
  for (const row of rows) {
    const hotelId = refs.hotels.get(row.hotelSlug);
    if (!hotelId) continue;

    await client.query(
      `
      insert into hotel_images (hotel_id, url, alt_text, sort_order)
      values ($1, $2, $3, $4)
      on conflict (hotel_id, sort_order)
      do update set
        url = excluded.url,
        alt_text = excluded.alt_text
    `,
      [hotelId, row.url, row.altText, row.sortOrder],
    );
  }
};

const upsertHotelAmenities = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into hotel_amenities (slug, label)
      values ($1, $2)
      on conflict (slug)
      do update set
        label = excluded.label
      returning id
    `,
      [row.slug, row.label],
    );

    refs.hotelAmenities.set(row.slug, result.rows[0].id);
  }
};

const upsertHotelAmenityLinks = async (client, rows, refs) => {
  for (const row of rows) {
    const hotelId = refs.hotels.get(row.hotelSlug);
    const amenityId = refs.hotelAmenities.get(row.amenitySlug);
    if (!hotelId || !amenityId) continue;

    await client.query(
      `
      insert into hotel_amenity_links (hotel_id, amenity_id)
      values ($1, $2)
      on conflict (hotel_id, amenity_id) do nothing
    `,
      [hotelId, amenityId],
    );
  }
};

const upsertHotelOffers = async (client, rows, refs) => {
  for (const row of rows) {
    const hotelId = refs.hotels.get(row.hotelSlug);
    if (!hotelId) continue;

    await client.query(
      `
      insert into hotel_offers (
        hotel_id,
        external_offer_id,
        name,
        sleeps,
        beds,
        size_sqft,
        price_nightly_cents,
        currency_code,
        refundable,
        pay_later,
        badges,
        features
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (hotel_id, external_offer_id)
      do update set
        name = excluded.name,
        sleeps = excluded.sleeps,
        beds = excluded.beds,
        size_sqft = excluded.size_sqft,
        price_nightly_cents = excluded.price_nightly_cents,
        currency_code = excluded.currency_code,
        refundable = excluded.refundable,
        pay_later = excluded.pay_later,
        badges = excluded.badges,
        features = excluded.features,
        updated_at = now()
    `,
      [
        hotelId,
        row.externalOfferId,
        row.name,
        row.sleeps,
        row.beds,
        row.sizeSqft,
        row.priceNightlyCents,
        row.currencyCode,
        row.refundable,
        row.payLater,
        row.badges,
        row.features,
      ],
    );
  }
};

const upsertHotelAvailability = async (client, rows, refs) => {
  for (const row of rows) {
    const hotelId = refs.hotels.get(row.hotelSlug);
    if (!hotelId) continue;

    await client.query(
      `
      insert into hotel_availability_snapshots (
        hotel_id,
        snapshot_source,
        check_in_start,
        check_in_end,
        min_nights,
        max_nights,
        blocked_weekdays
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (hotel_id, snapshot_source)
      do update set
        check_in_start = excluded.check_in_start,
        check_in_end = excluded.check_in_end,
        min_nights = excluded.min_nights,
        max_nights = excluded.max_nights,
        blocked_weekdays = excluded.blocked_weekdays,
        snapshot_at = now()
    `,
      [
        hotelId,
        row.snapshotSource,
        row.checkInStart,
        row.checkInEnd,
        row.minNights,
        row.maxNights,
        row.blockedWeekdays,
      ],
    );
  }
};

const upsertCarProviders = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into car_providers (slug, name)
      values ($1, $2)
      on conflict (slug)
      do update set
        name = excluded.name,
        updated_at = now()
      returning id
    `,
      [row.slug, row.name],
    );

    refs.carProviders.set(row.slug, result.rows[0].id);
  }
};

const upsertCarVehicleClasses = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into car_vehicle_classes (
        key,
        category,
        seats,
        doors,
        bags_label,
        base_daily_cents
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (key)
      do update set
        category = excluded.category,
        seats = excluded.seats,
        doors = excluded.doors,
        bags_label = excluded.bags_label,
        base_daily_cents = excluded.base_daily_cents,
        updated_at = now()
      returning id
    `,
      [
        row.key,
        row.category,
        row.seats,
        row.doors,
        row.bagsLabel,
        row.baseDailyCents,
      ],
    );

    refs.carVehicleClasses.set(row.key, result.rows[0].id);
  }
};

const upsertCarLocations = async (client, rows, refs) => {
  for (const row of rows) {
    const cityId = refs.cities.get(row.citySlug);
    if (!cityId) continue;

    const airportId = row.airportIata
      ? refs.airports.get(row.airportIata) || null
      : null;

    const result = await client.query(
      `
      insert into car_locations (
        seed_key,
        city_id,
        airport_id,
        location_type,
        name,
        address_line,
        latitude,
        longitude
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (seed_key)
      do update set
        city_id = excluded.city_id,
        airport_id = excluded.airport_id,
        location_type = excluded.location_type,
        name = excluded.name,
        address_line = excluded.address_line,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        cityId,
        airportId,
        row.locationType,
        row.name,
        row.addressLine,
        row.latitude,
        row.longitude,
      ],
    );

    refs.carLocations.set(row.seedKey, result.rows[0].id);
  }
};

const upsertCarInventory = async (client, rows, refs) => {
  for (const row of rows) {
    const providerId = refs.carProviders.get(row.providerSlug);
    const cityId = refs.cities.get(row.citySlug);
    const locationId = refs.carLocations.get(row.locationSeedKey);

    if (!providerId || !cityId || !locationId) continue;

    const result = await client.query(
      `
      insert into car_inventory (
        seed_key,
        slug,
        provider_id,
        city_id,
        location_id,
        rating,
        review_count,
        summary,
        currency_code,
        from_daily_cents,
        free_cancellation,
        pay_at_counter,
        security_deposit_required,
        min_driver_age,
        fuel_policy,
        cancellation_blurb,
        payment_blurb,
        fees_blurb,
        deposit_blurb,
        inclusions,
        availability_start,
        availability_end,
        min_days,
        max_days,
        blocked_weekdays,
        score
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26
      )
      on conflict (slug)
      do update set
        seed_key = excluded.seed_key,
        provider_id = excluded.provider_id,
        city_id = excluded.city_id,
        location_id = excluded.location_id,
        rating = excluded.rating,
        review_count = excluded.review_count,
        summary = excluded.summary,
        currency_code = excluded.currency_code,
        from_daily_cents = excluded.from_daily_cents,
        free_cancellation = excluded.free_cancellation,
        pay_at_counter = excluded.pay_at_counter,
        security_deposit_required = excluded.security_deposit_required,
        min_driver_age = excluded.min_driver_age,
        fuel_policy = excluded.fuel_policy,
        cancellation_blurb = excluded.cancellation_blurb,
        payment_blurb = excluded.payment_blurb,
        fees_blurb = excluded.fees_blurb,
        deposit_blurb = excluded.deposit_blurb,
        inclusions = excluded.inclusions,
        availability_start = excluded.availability_start,
        availability_end = excluded.availability_end,
        min_days = excluded.min_days,
        max_days = excluded.max_days,
        blocked_weekdays = excluded.blocked_weekdays,
        score = excluded.score,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        row.slug,
        providerId,
        cityId,
        locationId,
        row.rating,
        row.reviewCount,
        row.summary,
        row.currencyCode,
        row.fromDailyCents,
        row.freeCancellation,
        row.payAtCounter,
        row.securityDepositRequired,
        row.minDriverAge,
        row.fuelPolicy,
        row.cancellationBlurb,
        row.paymentBlurb,
        row.feesBlurb,
        row.depositBlurb,
        row.inclusions,
        row.availabilityStart,
        row.availabilityEnd,
        row.minDays,
        row.maxDays,
        row.blockedWeekdays,
        row.score,
      ],
    );

    refs.carInventory.set(row.slug, result.rows[0].id);
  }
};

const upsertCarInventoryImages = async (client, rows, refs) => {
  for (const row of rows) {
    const inventoryId = refs.carInventory.get(row.inventorySlug);
    if (!inventoryId) continue;

    await client.query(
      `
      insert into car_inventory_images (inventory_id, url, sort_order)
      values ($1, $2, $3)
      on conflict (inventory_id, sort_order)
      do update set
        url = excluded.url
    `,
      [inventoryId, row.url, row.sortOrder],
    );
  }
};

const upsertCarOffers = async (client, rows, refs) => {
  for (const row of rows) {
    const inventoryId = refs.carInventory.get(row.inventorySlug);
    const vehicleClassId = refs.carVehicleClasses.get(row.vehicleClassKey);
    if (!inventoryId || !vehicleClassId) continue;

    await client.query(
      `
      insert into car_offers (
        inventory_id,
        offer_code,
        name,
        vehicle_class_id,
        transmission,
        seats,
        doors,
        bags_label,
        air_conditioning,
        price_daily_cents,
        currency_code,
        free_cancellation,
        pay_at_counter,
        badges,
        features
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      on conflict (inventory_id, offer_code)
      do update set
        name = excluded.name,
        vehicle_class_id = excluded.vehicle_class_id,
        transmission = excluded.transmission,
        seats = excluded.seats,
        doors = excluded.doors,
        bags_label = excluded.bags_label,
        air_conditioning = excluded.air_conditioning,
        price_daily_cents = excluded.price_daily_cents,
        currency_code = excluded.currency_code,
        free_cancellation = excluded.free_cancellation,
        pay_at_counter = excluded.pay_at_counter,
        badges = excluded.badges,
        features = excluded.features,
        updated_at = now()
    `,
      [
        inventoryId,
        row.offerCode,
        row.name,
        vehicleClassId,
        row.transmission,
        row.seats,
        row.doors,
        row.bagsLabel,
        row.airConditioning,
        row.priceDailyCents,
        row.currencyCode,
        row.freeCancellation,
        row.payAtCounter,
        row.badges,
        row.features,
      ],
    );
  }
};

const upsertAirlines = async (client, rows, refs) => {
  for (const row of rows) {
    const result = await client.query(
      `
      insert into airlines (slug, iata_code, name)
      values ($1, $2, $3)
      on conflict (slug)
      do update set
        iata_code = excluded.iata_code,
        name = excluded.name,
        updated_at = now()
      returning id
    `,
      [row.slug, row.iataCode, row.name],
    );

    refs.airlines.set(row.slug, result.rows[0].id);
  }
};

const upsertFlightRoutes = async (client, rows, refs) => {
  for (const row of rows) {
    const originCityId = refs.cities.get(row.originCitySlug);
    const destinationCityId = refs.cities.get(row.destinationCitySlug);
    const originAirportId = refs.airports.get(row.originAirportIata);
    const destinationAirportId = refs.airports.get(row.destinationAirportIata);

    if (
      !originCityId ||
      !destinationCityId ||
      !originAirportId ||
      !destinationAirportId
    )
      continue;

    const result = await client.query(
      `
      insert into flight_routes (
        seed_key,
        origin_city_id,
        destination_city_id,
        origin_airport_id,
        destination_airport_id,
        distance_km,
        is_popular
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (seed_key)
      do update set
        origin_city_id = excluded.origin_city_id,
        destination_city_id = excluded.destination_city_id,
        origin_airport_id = excluded.origin_airport_id,
        destination_airport_id = excluded.destination_airport_id,
        distance_km = excluded.distance_km,
        is_popular = excluded.is_popular,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        originCityId,
        destinationCityId,
        originAirportId,
        destinationAirportId,
        row.distanceKm,
        row.isPopular,
      ],
    );

    refs.flightRoutes.set(row.seedKey, result.rows[0].id);
  }
};

const upsertFlightItineraries = async (client, rows, refs) => {
  for (const row of rows) {
    const routeId = refs.flightRoutes.get(row.routeSeedKey);
    const airlineId = refs.airlines.get(row.airlineSlug);
    if (!routeId || !airlineId) continue;

    const result = await client.query(
      `
      insert into flight_itineraries (
        seed_key,
        route_id,
        airline_id,
        itinerary_type,
        service_date,
        season_bucket,
        departure_at_utc,
        arrival_at_utc,
        departure_minutes,
        arrival_minutes,
        departure_window,
        arrival_window,
        stops,
        duration_minutes,
        stops_label,
        cabin_class,
        currency_code,
        base_price_cents,
        seats_remaining
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      on conflict (seed_key, service_date)
      do update set
        route_id = excluded.route_id,
        airline_id = excluded.airline_id,
        itinerary_type = excluded.itinerary_type,
        season_bucket = excluded.season_bucket,
        departure_at_utc = excluded.departure_at_utc,
        arrival_at_utc = excluded.arrival_at_utc,
        departure_minutes = excluded.departure_minutes,
        arrival_minutes = excluded.arrival_minutes,
        departure_window = excluded.departure_window,
        arrival_window = excluded.arrival_window,
        stops = excluded.stops,
        duration_minutes = excluded.duration_minutes,
        stops_label = excluded.stops_label,
        cabin_class = excluded.cabin_class,
        currency_code = excluded.currency_code,
        base_price_cents = excluded.base_price_cents,
        seats_remaining = excluded.seats_remaining,
        updated_at = now()
      returning id
    `,
      [
        row.seedKey,
        routeId,
        airlineId,
        row.itineraryType,
        row.serviceDate,
        row.seasonBucket,
        row.departureAtUtc,
        row.arrivalAtUtc,
        row.departureMinutes,
        row.arrivalMinutes,
        row.departureWindow,
        row.arrivalWindow,
        row.stops,
        row.durationMinutes,
        row.stopsLabel,
        row.cabinClass,
        row.currencyCode,
        row.basePriceCents,
        row.seatsRemaining,
      ],
    );

    refs.flightItineraries.set(
      `${row.seedKey}:${row.serviceDate}`,
      result.rows[0].id,
    );
  }
};

const upsertFlightSegments = async (client, rows, refs) => {
  for (const row of rows) {
    const itineraryId = refs.flightItineraries.get(row.itineraryNaturalKey);
    const originAirportId = refs.airports.get(row.originAirportIata);
    const destinationAirportId = refs.airports.get(row.destinationAirportIata);
    const airlineId = refs.airlines.get(row.airlineSlug);

    if (!itineraryId || !originAirportId || !destinationAirportId || !airlineId)
      continue;

    await client.query(
      `
      insert into flight_segments (
        itinerary_id,
        segment_order,
        origin_airport_id,
        destination_airport_id,
        airline_id,
        operating_flight_number,
        departure_at_utc,
        arrival_at_utc,
        duration_minutes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (itinerary_id, segment_order)
      do update set
        origin_airport_id = excluded.origin_airport_id,
        destination_airport_id = excluded.destination_airport_id,
        airline_id = excluded.airline_id,
        operating_flight_number = excluded.operating_flight_number,
        departure_at_utc = excluded.departure_at_utc,
        arrival_at_utc = excluded.arrival_at_utc,
        duration_minutes = excluded.duration_minutes
    `,
      [
        itineraryId,
        row.segmentOrder,
        originAirportId,
        destinationAirportId,
        airlineId,
        row.operatingFlightNumber,
        row.departureAtUtc,
        row.arrivalAtUtc,
        row.durationMinutes,
      ],
    );
  }
};

const upsertFlightFares = async (client, rows, refs) => {
  for (const row of rows) {
    const itineraryId = refs.flightItineraries.get(row.itineraryNaturalKey);
    if (!itineraryId) continue;

    await client.query(
      `
      insert into flight_fares (
        itinerary_id,
        fare_code,
        cabin_class,
        price_cents,
        currency_code,
        refundable,
        changeable,
        checked_bags_included,
        seats_remaining
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (itinerary_id, fare_code)
      do update set
        cabin_class = excluded.cabin_class,
        price_cents = excluded.price_cents,
        currency_code = excluded.currency_code,
        refundable = excluded.refundable,
        changeable = excluded.changeable,
        checked_bags_included = excluded.checked_bags_included,
        seats_remaining = excluded.seats_remaining,
        updated_at = now()
    `,
      [
        itineraryId,
        row.fareCode,
        row.cabinClass,
        row.priceCents,
        row.currencyCode,
        row.refundable,
        row.changeable,
        row.checkedBagsIncluded,
        row.seatsRemaining,
      ],
    );
  }
};

const resetSeedTables = async (client, schema) => {
  const tables = [...TABLE_INSERT_ORDER].reverse();
  if (!tables.length) return;

  const tableList = tables.map((table) => schemaQualified(schema, table)).join(", ");
  await client.query(`truncate table ${tableList} restart identity cascade`);
};

const readTableCounts = async (client, schema, payload) => {
  const counts = {};

  for (const table of TABLE_INSERT_ORDER) {
    const sourceRows = payload.tables[table] || [];
    if (!sourceRows.length) continue;

    const result = await client.query(
      `select count(*)::int as count from ${schemaQualified(schema, table)}`,
    );

    counts[table] = result.rows[0]?.count ?? 0;
  }

  return counts;
};

const applyPayload = async (payload, options = {}) => {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) is required for --mode apply",
    );
  }

  const schema = normalizeSchemaName(options.schema || process.env.DB_SCHEMA);
  const reset = Boolean(options.reset);
  const refs = createReferenceState();
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query(`create schema if not exists ${quoteIdentifier(schema)}`);
    await client.query(`set search_path to ${quoteIdentifier(schema)}, public`);
    await client.query("begin");
    if (reset) {
      await resetSeedTables(client, schema);
    }

    await upsertCountries(client, payload.tables.countries, refs);
    await upsertRegions(client, payload.tables.regions, refs);
    await upsertCities(client, payload.tables.cities, refs);
    await upsertAirports(client, payload.tables.airports, refs);

    await upsertHotelBrands(client, payload.tables.hotel_brands, refs);
    await upsertHotels(client, payload.tables.hotels, refs);
    await upsertHotelImages(client, payload.tables.hotel_images, refs);
    await upsertHotelAmenities(client, payload.tables.hotel_amenities, refs);
    await upsertHotelAmenityLinks(
      client,
      payload.tables.hotel_amenity_links,
      refs,
    );
    await upsertHotelOffers(client, payload.tables.hotel_offers, refs);
    await upsertHotelAvailability(
      client,
      payload.tables.hotel_availability_snapshots,
      refs,
    );

    await upsertCarProviders(client, payload.tables.car_providers, refs);
    await upsertCarVehicleClasses(
      client,
      payload.tables.car_vehicle_classes,
      refs,
    );
    await upsertCarLocations(client, payload.tables.car_locations, refs);
    await upsertCarInventory(client, payload.tables.car_inventory, refs);
    await upsertCarInventoryImages(
      client,
      payload.tables.car_inventory_images,
      refs,
    );
    await upsertCarOffers(client, payload.tables.car_offers, refs);

    await upsertAirlines(client, payload.tables.airlines, refs);
    await upsertFlightRoutes(client, payload.tables.flight_routes, refs);
    await upsertFlightItineraries(
      client,
      payload.tables.flight_itineraries,
      refs,
    );
    await upsertFlightSegments(client, payload.tables.flight_segments, refs);
    await upsertFlightFares(client, payload.tables.flight_fares, refs);

    await client.query("commit");
    const persistedCounts = await readTableCounts(client, schema, payload);
    return {
      schema,
      persistedCounts,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  const payload = buildPostgresSeedPayload({
    vertical: args.vertical,
    city: args.city,
    from: args.from,
    to: args.to,
    itineraryType: args.itineraryType,
    departDate: args.departDate,
    maxFlightRoutes: args.maxFlightRoutes,
  });

  if (args.mode === "plan") {
    logPlan(payload);
    return;
  }

  if (args.mode === "files") {
    const manifest = {
      meta: payload.meta,
      rowCounts: payload.rowCounts,
      files: {},
    };

    for (const table of TABLE_INSERT_ORDER) {
      const filePath = path.join(args.outDir, `${table}.json`);
      await writeJson(filePath, payload.tables[table]);
      manifest.files[table] = filePath;
    }

    await writeJson(path.join(args.outDir, "manifest.json"), manifest);
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  const result = await applyPayload(payload, {
    schema: args.schema,
    reset: args.reset,
  });

  console.log(
    JSON.stringify(
      {
        applied: true,
        meta: payload.meta,
        rowCounts: payload.rowCounts,
        targetSchema: result.schema,
        persistedCounts: result.persistedCounts,
        reset: args.reset,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
