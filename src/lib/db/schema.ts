import { relations, sql } from 'drizzle-orm'
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

const DEFAULT_DB_SCHEMA = 'andacity_app'

const resolveDbSchema = () => {
  const value = String(process.env.DB_SCHEMA || DEFAULT_DB_SCHEMA)
    .trim()
    .toLowerCase()

  return /^[a-z_][a-z0-9_]*$/.test(value) ? value : DEFAULT_DB_SCHEMA
}

const schemaName = resolveDbSchema()
const explicitSchema = schemaName === 'public' ? null : pgSchema(schemaName)

const dbTable = ((...args: unknown[]) => {
  if (explicitSchema) return (explicitSchema.table as (...args: unknown[]) => unknown)(...args)
  return (pgTable as (...args: unknown[]) => unknown)(...args)
}) as typeof pgTable

const dbEnum = ((...args: unknown[]) => {
  if (explicitSchema) return (explicitSchema.enum as (...args: unknown[]) => unknown)(...args)
  return (pgEnum as (...args: unknown[]) => unknown)(...args)
}) as typeof pgEnum

const createdAtColumn = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
const updatedAtColumn = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()

export const carLocationTypeEnum = dbEnum('car_location_type', ['airport', 'city'])
export const carTransmissionEnum = dbEnum('car_transmission', ['automatic', 'manual'])
export const flightItineraryTypeEnum = dbEnum('flight_itinerary_type', ['one-way', 'round-trip'])
export const flightCabinClassEnum = dbEnum('flight_cabin_class', ['economy', 'premium-economy', 'business', 'first'])
export const flightTimeWindowEnum = dbEnum('flight_time_window', ['morning', 'afternoon', 'evening', 'overnight'])

export const countries = dbTable(
  'countries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    iso2: varchar('iso2', { length: 2 }),
    iso3: varchar('iso3', { length: 3 }),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    slugUq: uniqueIndex('countries_slug_uq').on(table.slug),
    nameUq: uniqueIndex('countries_name_uq').on(table.name),
    iso2Uq: uniqueIndex('countries_iso2_uq').on(table.iso2),
  }),
)

export const regions = dbTable(
  'regions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    countryId: bigint('country_id', { mode: 'number' })
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    slug: varchar('slug', { length: 140 }).notNull(),
    code: varchar('code', { length: 40 }),
    name: varchar('name', { length: 140 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    countryIdx: index('regions_country_idx').on(table.countryId),
    countrySlugUq: uniqueIndex('regions_country_slug_uq').on(table.countryId, table.slug),
    countryNameUq: uniqueIndex('regions_country_name_uq').on(table.countryId, table.name),
  }),
)

export const cities = dbTable(
  'cities',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 96 }),
    slug: varchar('slug', { length: 140 }).notNull(),
    name: varchar('name', { length: 140 }).notNull(),
    countryId: bigint('country_id', { mode: 'number' })
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    regionId: bigint('region_id', { mode: 'number' }).references(() => regions.id, {
      onDelete: 'set null',
    }),
    latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
    longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
    popularityRank: integer('popularity_rank'),
    featuredRank: integer('featured_rank'),
    aliases: text('aliases').array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('cities_seed_key_uq').on(table.seedKey),
    slugUq: uniqueIndex('cities_slug_uq').on(table.slug),
    countryIdx: index('cities_country_idx').on(table.countryId),
    regionIdx: index('cities_region_idx').on(table.regionId),
    popularityIdx: index('cities_popularity_idx').on(table.popularityRank),
  }),
)

export const airports = dbTable(
  'airports',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 120 }),
    cityId: bigint('city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    iataCode: varchar('iata_code', { length: 3 }).notNull(),
    name: varchar('name', { length: 180 }).notNull(),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    timezone: varchar('timezone', { length: 80 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('airports_seed_key_uq').on(table.seedKey),
    iataUq: uniqueIndex('airports_iata_uq').on(table.iataCode),
    cityIdx: index('airports_city_idx').on(table.cityId),
  }),
)

export const hotelBrands = dbTable(
  'hotel_brands',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    slugUq: uniqueIndex('hotel_brands_slug_uq').on(table.slug),
    nameUq: uniqueIndex('hotel_brands_name_uq').on(table.name),
  }),
)

export const hotels = dbTable(
  'hotels',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 96 }),
    slug: varchar('slug', { length: 160 }).notNull(),
    cityId: bigint('city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict' }),
    brandId: bigint('brand_id', { mode: 'number' }).references(() => hotelBrands.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 180 }).notNull(),
    neighborhood: varchar('neighborhood', { length: 120 }).notNull(),
    propertyType: varchar('property_type', { length: 32 }).notNull(),
    addressLine: text('address_line').notNull(),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    stars: smallint('stars').notNull(),
    rating: numeric('rating', { precision: 3, scale: 1 }).notNull(),
    reviewCount: integer('review_count').notNull().default(0),
    summary: text('summary').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    fromNightlyCents: integer('from_nightly_cents').notNull(),
    freeCancellation: boolean('free_cancellation').notNull().default(false),
    payLater: boolean('pay_later').notNull().default(false),
    noResortFees: boolean('no_resort_fees').notNull().default(false),
    checkInTime: varchar('check_in_time', { length: 16 }),
    checkOutTime: varchar('check_out_time', { length: 16 }),
    cancellationBlurb: text('cancellation_blurb'),
    paymentBlurb: text('payment_blurb'),
    feesBlurb: text('fees_blurb'),
    featuredRank: integer('featured_rank'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('hotels_seed_key_uq').on(table.seedKey),
    slugUq: uniqueIndex('hotels_slug_uq').on(table.slug),
    cityIdx: index('hotels_city_idx').on(table.cityId),
    cityPriceIdx: index('hotels_city_price_idx').on(table.cityId, table.fromNightlyCents),
    cityRatingIdx: index('hotels_city_rating_idx').on(table.cityId, table.rating),
    starsIdx: index('hotels_stars_idx').on(table.stars),
    propertyTypeIdx: index('hotels_property_type_idx').on(table.propertyType),
    starsCheck: check('hotels_stars_ck', sql`${table.stars} >= 1 and ${table.stars} <= 5`),
  }),
)

export const hotelImages = dbTable(
  'hotel_images',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    hotelId: bigint('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    altText: text('alt_text'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAtColumn(),  },
  (table) => ({
    hotelIdx: index('hotel_images_hotel_idx').on(table.hotelId),
    hotelSortUq: uniqueIndex('hotel_images_hotel_sort_uq').on(table.hotelId, table.sortOrder),
  }),
)

export const hotelAmenities = dbTable(
  'hotel_amenities',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    label: varchar('label', { length: 140 }).notNull(),
    createdAt: createdAtColumn(),  },
  (table) => ({
    slugUq: uniqueIndex('hotel_amenities_slug_uq').on(table.slug),
    labelUq: uniqueIndex('hotel_amenities_label_uq').on(table.label),
  }),
)

export const hotelAmenityLinks = dbTable(
  'hotel_amenity_links',
  {
    hotelId: bigint('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    amenityId: bigint('amenity_id', { mode: 'number' })
      .notNull()
      .references(() => hotelAmenities.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),  },
  (table) => ({
    pk: primaryKey({ columns: [table.hotelId, table.amenityId], name: 'hotel_amenity_links_pk' }),
    amenityIdx: index('hotel_amenity_links_amenity_idx').on(table.amenityId),
  }),
)

export const hotelOffers = dbTable(
  'hotel_offers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    hotelId: bigint('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    externalOfferId: varchar('external_offer_id', { length: 80 }).notNull(),
    name: varchar('name', { length: 140 }).notNull(),
    sleeps: smallint('sleeps').notNull(),
    beds: varchar('beds', { length: 80 }).notNull(),
    sizeSqft: integer('size_sqft').notNull(),
    priceNightlyCents: integer('price_nightly_cents').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    refundable: boolean('refundable').notNull().default(false),
    payLater: boolean('pay_later').notNull().default(false),
    badges: text('badges').array().notNull().default(sql`'{}'::text[]`),
    features: text('features').array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    hotelIdx: index('hotel_offers_hotel_idx').on(table.hotelId),
    hotelPriceIdx: index('hotel_offers_hotel_price_idx').on(table.hotelId, table.priceNightlyCents),
    hotelExternalUq: uniqueIndex('hotel_offers_hotel_external_uq').on(table.hotelId, table.externalOfferId),
  }),
)

export const hotelAvailabilitySnapshots = dbTable(
  'hotel_availability_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    hotelId: bigint('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    snapshotSource: varchar('snapshot_source', { length: 32 }).notNull().default('seed'),
    checkInStart: date('check_in_start').notNull(),
    checkInEnd: date('check_in_end').notNull(),
    minNights: smallint('min_nights').notNull(),
    maxNights: smallint('max_nights').notNull(),
    blockedWeekdays: smallint('blocked_weekdays').array().notNull().default(sql`'{}'::smallint[]`),
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hotelIdx: index('hotel_availability_hotel_idx').on(table.hotelId),
    dateWindowIdx: index('hotel_availability_window_idx').on(table.checkInStart, table.checkInEnd),
    hotelSourceUq: uniqueIndex('hotel_availability_hotel_source_uq').on(table.hotelId, table.snapshotSource),
    nightSpanCheck: check('hotel_availability_nights_ck', sql`${table.minNights} <= ${table.maxNights}`),
  }),
)

export const carProviders = dbTable(
  'car_providers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 140 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    slugUq: uniqueIndex('car_providers_slug_uq').on(table.slug),
    nameUq: uniqueIndex('car_providers_name_uq').on(table.name),
  }),
)

export const carVehicleClasses = dbTable(
  'car_vehicle_classes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    key: varchar('key', { length: 60 }).notNull(),
    category: varchar('category', { length: 80 }).notNull(),
    seats: smallint('seats').notNull(),
    doors: smallint('doors').notNull(),
    bagsLabel: varchar('bags_label', { length: 80 }).notNull(),
    baseDailyCents: integer('base_daily_cents'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    keyUq: uniqueIndex('car_vehicle_classes_key_uq').on(table.key),
    categoryUq: uniqueIndex('car_vehicle_classes_category_uq').on(table.category),
  }),
)

export const carLocations = dbTable(
  'car_locations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 120 }),
    cityId: bigint('city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    airportId: bigint('airport_id', { mode: 'number' }).references(() => airports.id, {
      onDelete: 'set null',
    }),
    locationType: carLocationTypeEnum('location_type').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    addressLine: text('address_line').notNull(),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('car_locations_seed_key_uq').on(table.seedKey),
    cityIdx: index('car_locations_city_idx').on(table.cityId),
    airportIdx: index('car_locations_airport_idx').on(table.airportId),
    typeIdx: index('car_locations_type_idx').on(table.locationType),
    cityNameTypeUq: uniqueIndex('car_locations_city_name_type_uq').on(table.cityId, table.name, table.locationType),
  }),
)

export const carInventory = dbTable(
  'car_inventory',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 96 }),
    slug: varchar('slug', { length: 180 }).notNull(),
    providerId: bigint('provider_id', { mode: 'number' })
      .notNull()
      .references(() => carProviders.id, { onDelete: 'restrict' }),
    cityId: bigint('city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    locationId: bigint('location_id', { mode: 'number' })
      .notNull()
      .references(() => carLocations.id, { onDelete: 'cascade' }),
    rating: numeric('rating', { precision: 3, scale: 1 }).notNull(),
    reviewCount: integer('review_count').notNull().default(0),
    summary: text('summary').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    fromDailyCents: integer('from_daily_cents').notNull(),
    freeCancellation: boolean('free_cancellation').notNull().default(false),
    payAtCounter: boolean('pay_at_counter').notNull().default(false),
    securityDepositRequired: boolean('security_deposit_required').notNull().default(false),
    minDriverAge: smallint('min_driver_age').notNull(),
    fuelPolicy: varchar('fuel_policy', { length: 64 }).notNull(),
    cancellationBlurb: text('cancellation_blurb'),
    paymentBlurb: text('payment_blurb'),
    feesBlurb: text('fees_blurb'),
    depositBlurb: text('deposit_blurb'),
    inclusions: text('inclusions').array().notNull().default(sql`'{}'::text[]`),
    availabilityStart: date('availability_start').notNull(),
    availabilityEnd: date('availability_end').notNull(),
    minDays: smallint('min_days').notNull(),
    maxDays: smallint('max_days').notNull(),
    blockedWeekdays: smallint('blocked_weekdays').array().notNull().default(sql`'{}'::smallint[]`),
    score: numeric('score', { precision: 8, scale: 4 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('car_inventory_seed_key_uq').on(table.seedKey),
    slugUq: uniqueIndex('car_inventory_slug_uq').on(table.slug),
    cityIdx: index('car_inventory_city_idx').on(table.cityId),
    providerIdx: index('car_inventory_provider_idx').on(table.providerId),
    locationIdx: index('car_inventory_location_idx').on(table.locationId),
    cityPriceIdx: index('car_inventory_city_price_idx').on(table.cityId, table.fromDailyCents),
    cityRatingIdx: index('car_inventory_city_rating_idx').on(table.cityId, table.rating),
    daysCheck: check('car_inventory_days_ck', sql`${table.minDays} <= ${table.maxDays}`),
  }),
)

export const carInventoryImages = dbTable(
  'car_inventory_images',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    inventoryId: bigint('inventory_id', { mode: 'number' })
      .notNull()
      .references(() => carInventory.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAtColumn(),  },
  (table) => ({
    inventoryIdx: index('car_inventory_images_inventory_idx').on(table.inventoryId),
    inventorySortUq: uniqueIndex('car_inventory_images_inventory_sort_uq').on(table.inventoryId, table.sortOrder),
  }),
)

export const carOffers = dbTable(
  'car_offers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    inventoryId: bigint('inventory_id', { mode: 'number' })
      .notNull()
      .references(() => carInventory.id, { onDelete: 'cascade' }),
    offerCode: varchar('offer_code', { length: 80 }).notNull(),
    name: varchar('name', { length: 140 }).notNull(),
    vehicleClassId: bigint('vehicle_class_id', { mode: 'number' })
      .notNull()
      .references(() => carVehicleClasses.id, { onDelete: 'restrict' }),
    transmission: carTransmissionEnum('transmission').notNull(),
    seats: smallint('seats').notNull(),
    doors: smallint('doors').notNull(),
    bagsLabel: varchar('bags_label', { length: 80 }).notNull(),
    airConditioning: boolean('air_conditioning').notNull().default(true),
    priceDailyCents: integer('price_daily_cents').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    freeCancellation: boolean('free_cancellation').notNull().default(false),
    payAtCounter: boolean('pay_at_counter').notNull().default(false),
    badges: text('badges').array().notNull().default(sql`'{}'::text[]`),
    features: text('features').array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    inventoryIdx: index('car_offers_inventory_idx').on(table.inventoryId),
    vehicleClassIdx: index('car_offers_vehicle_class_idx').on(table.vehicleClassId),
    inventoryPriceIdx: index('car_offers_inventory_price_idx').on(table.inventoryId, table.priceDailyCents),
    inventoryOfferUq: uniqueIndex('car_offers_inventory_offer_uq').on(table.inventoryId, table.offerCode),
  }),
)

export const airlines = dbTable(
  'airlines',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    iataCode: varchar('iata_code', { length: 2 }),
    name: varchar('name', { length: 140 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    slugUq: uniqueIndex('airlines_slug_uq').on(table.slug),
    iataUq: uniqueIndex('airlines_iata_uq').on(table.iataCode),
    nameUq: uniqueIndex('airlines_name_uq').on(table.name),
  }),
)

export const flightRoutes = dbTable(
  'flight_routes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 140 }),
    originCityId: bigint('origin_city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    destinationCityId: bigint('destination_city_id', { mode: 'number' })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    originAirportId: bigint('origin_airport_id', { mode: 'number' })
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    destinationAirportId: bigint('destination_airport_id', { mode: 'number' })
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    distanceKm: numeric('distance_km', { precision: 8, scale: 2 }).notNull(),
    isPopular: boolean('is_popular').notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedKeyUq: uniqueIndex('flight_routes_seed_key_uq').on(table.seedKey),
    routeUq: uniqueIndex('flight_routes_route_uq').on(table.originAirportId, table.destinationAirportId),
    cityPairIdx: index('flight_routes_city_pair_idx').on(table.originCityId, table.destinationCityId),
    originCityIdx: index('flight_routes_origin_city_idx').on(table.originCityId),
    destinationCityIdx: index('flight_routes_destination_city_idx').on(table.destinationCityId),
  }),
)

export const flightItineraries = dbTable(
  'flight_itineraries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    seedKey: varchar('seed_key', { length: 120 }).notNull(),
    routeId: bigint('route_id', { mode: 'number' })
      .notNull()
      .references(() => flightRoutes.id, { onDelete: 'cascade' }),
    airlineId: bigint('airline_id', { mode: 'number' })
      .notNull()
      .references(() => airlines.id, { onDelete: 'restrict' }),
    itineraryType: flightItineraryTypeEnum('itinerary_type').notNull(),
    serviceDate: date('service_date').notNull(),
    seasonBucket: smallint('season_bucket').notNull().default(0),
    departureAtUtc: timestamp('departure_at_utc', { withTimezone: true }).notNull(),
    arrivalAtUtc: timestamp('arrival_at_utc', { withTimezone: true }).notNull(),
    departureMinutes: smallint('departure_minutes').notNull(),
    arrivalMinutes: smallint('arrival_minutes').notNull(),
    departureWindow: flightTimeWindowEnum('departure_window').notNull(),
    arrivalWindow: flightTimeWindowEnum('arrival_window').notNull(),
    stops: smallint('stops').notNull(),
    durationMinutes: smallint('duration_minutes').notNull(),
    stopsLabel: varchar('stops_label', { length: 24 }).notNull(),
    cabinClass: flightCabinClassEnum('cabin_class').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    basePriceCents: integer('base_price_cents').notNull(),
    seatsRemaining: smallint('seats_remaining').notNull().default(9),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    seedServiceDateUq: uniqueIndex('flight_itineraries_seed_service_date_uq').on(table.seedKey, table.serviceDate),
    routeDateIdx: index('flight_itineraries_route_date_idx').on(table.routeId, table.serviceDate),
    routePriceIdx: index('flight_itineraries_route_price_idx').on(table.routeId, table.basePriceCents),
    routeStopsIdx: index('flight_itineraries_route_stops_idx').on(table.routeId, table.stops),
    routeWindowIdx: index('flight_itineraries_route_window_idx').on(table.routeId, table.departureWindow),
    cabinIdx: index('flight_itineraries_cabin_idx').on(table.cabinClass),
    stopsCheck: check('flight_itineraries_stops_ck', sql`${table.stops} >= 0 and ${table.stops} <= 2`),
    durationCheck: check('flight_itineraries_duration_ck', sql`${table.durationMinutes} > 0`),
  }),
)

export const flightSegments = dbTable(
  'flight_segments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    itineraryId: bigint('itinerary_id', { mode: 'number' })
      .notNull()
      .references(() => flightItineraries.id, { onDelete: 'cascade' }),
    segmentOrder: smallint('segment_order').notNull(),
    originAirportId: bigint('origin_airport_id', { mode: 'number' })
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    destinationAirportId: bigint('destination_airport_id', { mode: 'number' })
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    airlineId: bigint('airline_id', { mode: 'number' })
      .notNull()
      .references(() => airlines.id, { onDelete: 'restrict' }),
    operatingFlightNumber: varchar('operating_flight_number', { length: 16 }),
    departureAtUtc: timestamp('departure_at_utc', { withTimezone: true }).notNull(),
    arrivalAtUtc: timestamp('arrival_at_utc', { withTimezone: true }).notNull(),
    durationMinutes: smallint('duration_minutes').notNull(),
    createdAt: createdAtColumn(),  },
  (table) => ({
    itineraryIdx: index('flight_segments_itinerary_idx').on(table.itineraryId),
    itinerarySegmentUq: uniqueIndex('flight_segments_itinerary_segment_uq').on(table.itineraryId, table.segmentOrder),
    segmentDurationCheck: check('flight_segments_duration_ck', sql`${table.durationMinutes} > 0`),
  }),
)

export const flightFares = dbTable(
  'flight_fares',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    itineraryId: bigint('itinerary_id', { mode: 'number' })
      .notNull()
      .references(() => flightItineraries.id, { onDelete: 'cascade' }),
    fareCode: varchar('fare_code', { length: 64 }).notNull().default('standard'),
    cabinClass: flightCabinClassEnum('cabin_class').notNull(),
    priceCents: integer('price_cents').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    refundable: boolean('refundable').notNull().default(false),
    changeable: boolean('changeable').notNull().default(true),
    checkedBagsIncluded: smallint('checked_bags_included').notNull().default(0),
    seatsRemaining: smallint('seats_remaining').notNull().default(9),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    itineraryIdx: index('flight_fares_itinerary_idx').on(table.itineraryId),
    itineraryCabinIdx: index('flight_fares_itinerary_cabin_idx').on(table.itineraryId, table.cabinClass),
    itineraryFareUq: uniqueIndex('flight_fares_itinerary_fare_uq').on(table.itineraryId, table.fareCode),
  }),
)

export const countriesRelations = relations(countries, ({ many }) => ({
  regions: many(regions),
  cities: many(cities),
}))

export const regionsRelations = relations(regions, ({ one, many }) => ({
  country: one(countries, {
    fields: [regions.countryId],
    references: [countries.id],
  }),
  cities: many(cities),
}))

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  region: one(regions, {
    fields: [cities.regionId],
    references: [regions.id],
  }),
  airports: many(airports),
  hotels: many(hotels),
  carLocations: many(carLocations),
  carInventory: many(carInventory),
  originFlightRoutes: many(flightRoutes, { relationName: 'origin_city_routes' }),
  destinationFlightRoutes: many(flightRoutes, { relationName: 'destination_city_routes' }),
}))

export const airportsRelations = relations(airports, ({ one, many }) => ({
  city: one(cities, {
    fields: [airports.cityId],
    references: [cities.id],
  }),
  carLocations: many(carLocations),
  originFlightRoutes: many(flightRoutes, { relationName: 'origin_airport_routes' }),
  destinationFlightRoutes: many(flightRoutes, { relationName: 'destination_airport_routes' }),
}))

export const hotelBrandsRelations = relations(hotelBrands, ({ many }) => ({
  hotels: many(hotels),
}))

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  city: one(cities, {
    fields: [hotels.cityId],
    references: [cities.id],
  }),
  brand: one(hotelBrands, {
    fields: [hotels.brandId],
    references: [hotelBrands.id],
  }),
  images: many(hotelImages),
  amenityLinks: many(hotelAmenityLinks),
  offers: many(hotelOffers),
  availabilitySnapshots: many(hotelAvailabilitySnapshots),
}))

export const hotelImagesRelations = relations(hotelImages, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelImages.hotelId],
    references: [hotels.id],
  }),
}))

export const hotelAmenitiesRelations = relations(hotelAmenities, ({ many }) => ({
  hotelLinks: many(hotelAmenityLinks),
}))

export const hotelAmenityLinksRelations = relations(hotelAmenityLinks, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelAmenityLinks.hotelId],
    references: [hotels.id],
  }),
  amenity: one(hotelAmenities, {
    fields: [hotelAmenityLinks.amenityId],
    references: [hotelAmenities.id],
  }),
}))

export const hotelOffersRelations = relations(hotelOffers, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelOffers.hotelId],
    references: [hotels.id],
  }),
}))

export const hotelAvailabilitySnapshotsRelations = relations(hotelAvailabilitySnapshots, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelAvailabilitySnapshots.hotelId],
    references: [hotels.id],
  }),
}))

export const carProvidersRelations = relations(carProviders, ({ many }) => ({
  inventory: many(carInventory),
}))

export const carVehicleClassesRelations = relations(carVehicleClasses, ({ many }) => ({
  offers: many(carOffers),
}))

export const carLocationsRelations = relations(carLocations, ({ one, many }) => ({
  city: one(cities, {
    fields: [carLocations.cityId],
    references: [cities.id],
  }),
  airport: one(airports, {
    fields: [carLocations.airportId],
    references: [airports.id],
  }),
  inventory: many(carInventory),
}))

export const carInventoryRelations = relations(carInventory, ({ one, many }) => ({
  provider: one(carProviders, {
    fields: [carInventory.providerId],
    references: [carProviders.id],
  }),
  city: one(cities, {
    fields: [carInventory.cityId],
    references: [cities.id],
  }),
  location: one(carLocations, {
    fields: [carInventory.locationId],
    references: [carLocations.id],
  }),
  images: many(carInventoryImages),
  offers: many(carOffers),
}))

export const carInventoryImagesRelations = relations(carInventoryImages, ({ one }) => ({
  inventory: one(carInventory, {
    fields: [carInventoryImages.inventoryId],
    references: [carInventory.id],
  }),
}))

export const carOffersRelations = relations(carOffers, ({ one }) => ({
  inventory: one(carInventory, {
    fields: [carOffers.inventoryId],
    references: [carInventory.id],
  }),
  vehicleClass: one(carVehicleClasses, {
    fields: [carOffers.vehicleClassId],
    references: [carVehicleClasses.id],
  }),
}))

export const airlinesRelations = relations(airlines, ({ many }) => ({
  itineraries: many(flightItineraries),
  segments: many(flightSegments),
}))

export const flightRoutesRelations = relations(flightRoutes, ({ one, many }) => ({
  originCity: one(cities, {
    fields: [flightRoutes.originCityId],
    references: [cities.id],
    relationName: 'origin_city_routes',
  }),
  destinationCity: one(cities, {
    fields: [flightRoutes.destinationCityId],
    references: [cities.id],
    relationName: 'destination_city_routes',
  }),
  originAirport: one(airports, {
    fields: [flightRoutes.originAirportId],
    references: [airports.id],
    relationName: 'origin_airport_routes',
  }),
  destinationAirport: one(airports, {
    fields: [flightRoutes.destinationAirportId],
    references: [airports.id],
    relationName: 'destination_airport_routes',
  }),
  itineraries: many(flightItineraries),
}))

export const flightItinerariesRelations = relations(flightItineraries, ({ one, many }) => ({
  route: one(flightRoutes, {
    fields: [flightItineraries.routeId],
    references: [flightRoutes.id],
  }),
  airline: one(airlines, {
    fields: [flightItineraries.airlineId],
    references: [airlines.id],
  }),
  segments: many(flightSegments),
  fares: many(flightFares),
}))

export const flightSegmentsRelations = relations(flightSegments, ({ one }) => ({
  itinerary: one(flightItineraries, {
    fields: [flightSegments.itineraryId],
    references: [flightItineraries.id],
  }),
  originAirport: one(airports, {
    fields: [flightSegments.originAirportId],
    references: [airports.id],
  }),
  destinationAirport: one(airports, {
    fields: [flightSegments.destinationAirportId],
    references: [airports.id],
  }),
  airline: one(airlines, {
    fields: [flightSegments.airlineId],
    references: [airlines.id],
  }),
}))

export const flightFaresRelations = relations(flightFares, ({ one }) => ({
  itinerary: one(flightItineraries, {
    fields: [flightFares.itineraryId],
    references: [flightItineraries.id],
  }),
}))
