import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  airports,
  cities,
  countries,
  regions,
} from "~/lib/db/schema";
import { normalizeLocation, parseLocationId } from "~/lib/location/normalizeLocation";
import type { CanonicalLocation } from "~/types/location";

type SearchLocationsOptions = {
  limit?: number;
};

type DiscoverLocationsOptions = {
  limit?: number;
  latitude?: number | null;
  longitude?: number | null;
};

const DEFAULT_LIMIT = 8;
const DEFAULT_DISCOVER_LIMIT = 3;

const toText = (value: unknown) => String(value ?? "").trim();

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const normalizeSlugText = (value: string) =>
  normalizeSearchText(value)
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const cityAliasContains = (query: string) =>
  sql<boolean>`exists (
    select 1
    from unnest(${cities.aliases}) as alias
    where lower(alias) like ${`%${query}%`}
  )`;

const airportCityAliasContains = (query: string) =>
  sql<boolean>`exists (
    select 1
    from unnest(${cities.aliases}) as alias
    where lower(alias) like ${`%${query}%`}
  )`;

const cityRankOrder = (query: string, slugQuery: string) => {
  return [
    asc(sql<number>`case when lower(${cities.name}) = ${query} then 0 else 1 end`),
    asc(
      sql<number>`case when lower(${cities.name}) like ${`${query}%`} then 0 else 1 end`,
    ),
    asc(sql<number>`case when lower(${cities.slug}) = ${slugQuery} then 0 else 1 end`),
    asc(sql<number>`case when ${cityAliasContains(query)} then 0 else 1 end`),
    asc(sql<number>`case when ${cities.popularityRank} is null then 1 else 0 end`),
    asc(cities.popularityRank),
    asc(cities.name),
  ] as const;
};

const airportRankOrder = (query: string, uppercaseQuery: string) => {
  return [
    asc(
      sql<number>`case when upper(${airports.iataCode}) = ${uppercaseQuery} then 0 else 1 end`,
    ),
    asc(
      sql<number>`case when upper(${airports.iataCode}) like ${`${uppercaseQuery}%`} then 0 else 1 end`,
    ),
    asc(
      sql<number>`case when lower(${airports.name}) = ${query} then 0 else 1 end`,
    ),
    asc(
      sql<number>`case when lower(${airports.name}) like ${`${query}%`} then 0 else 1 end`,
    ),
    desc(airports.isPrimary),
    asc(sql<number>`case when ${cities.popularityRank} is null then 1 else 0 end`),
    asc(cities.popularityRank),
    asc(airports.name),
  ] as const;
};

const mapCityRow = (row: {
  cityId: number;
  citySlug: string;
  cityName: string;
  regionId: number | null;
  regionName: string | null;
  regionCode: string | null;
  countryName: string;
  countryCode: string | null;
  latitude: string | number;
  longitude: string | number;
  primaryAirportCode: string | null;
}) =>
  normalizeLocation({
    kind: "city",
    cityId: row.cityId,
    regionId: row.regionId,
    citySlug: row.citySlug,
    cityName: row.cityName,
    primaryAirportCode: row.primaryAirportCode,
    stateOrProvinceName: row.regionName,
    stateOrProvinceCode: row.regionCode,
    countryName: row.countryName,
    countryCode: row.countryCode || "",
    latitude: row.latitude,
    longitude: row.longitude,
  });

const mapAirportRow = (row: {
  airportId: number;
  airportName: string;
  airportCode: string;
  cityId: number;
  citySlug: string;
  cityName: string;
  regionId: number | null;
  regionName: string | null;
  regionCode: string | null;
  countryName: string;
  countryCode: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}) =>
  normalizeLocation({
    kind: "airport",
    airportId: row.airportId,
    airportName: row.airportName,
    airportCode: row.airportCode,
    primaryAirportCode: row.airportCode,
    cityId: row.cityId,
    citySlug: row.citySlug,
    cityName: row.cityName,
    regionId: row.regionId,
    stateOrProvinceName: row.regionName,
    stateOrProvinceCode: row.regionCode,
    countryName: row.countryName,
    countryCode: row.countryCode || "",
    latitude: row.latitude,
    longitude: row.longitude,
  });

type DiscoverCityRow = {
  cityId: number;
  citySlug: string;
  cityName: string;
  regionId: number | null;
  regionName: string | null;
  regionCode: string | null;
  countryId: number;
  countryName: string;
  countryCode: string | null;
  latitude: string | number;
  longitude: string | number;
  primaryAirportCode: string | null;
  popularityRank: number | null;
  featuredRank: number | null;
  distanceScore?: number | null;
};

const citySelectFields = {
  cityId: cities.id,
  citySlug: cities.slug,
  cityName: cities.name,
  regionId: regions.id,
  regionName: regions.name,
  regionCode: regions.code,
  countryId: countries.id,
  countryName: countries.name,
  countryCode: countries.iso2,
  latitude: cities.latitude,
  longitude: cities.longitude,
  popularityRank: cities.popularityRank,
  featuredRank: cities.featuredRank,
  primaryAirportCode: sql<string | null>`(
    select ${airports.iataCode}
    from ${airports}
    where ${airports.cityId} = ${cities.id}
    order by ${airports.isPrimary} desc, ${airports.id} asc
    limit 1
  )`,
};

const cityPopularityOrder = () => {
  return [
    asc(sql<number>`case when ${cities.popularityRank} is null then 1 else 0 end`),
    asc(cities.popularityRank),
    asc(sql<number>`case when ${cities.featuredRank} is null then 1 else 0 end`),
    asc(cities.featuredRank),
    asc(cities.name),
  ] as const;
};

const cityDistanceScore = (latitude: number, longitude: number) =>
  sql<number>`(
    power((${cities.latitude})::double precision - ${latitude}, 2) +
    power((${cities.longitude})::double precision - ${longitude}, 2)
  )`;

const withSuggestionReason = (
  location: CanonicalLocation,
  suggestionReason: string,
) => ({
  ...location,
  providerMetadata: {
    ...location.providerMetadata,
    suggestionReason,
  },
});

const dedupeLocations = (locations: CanonicalLocation[]) => {
  const seen = new Set<string>();

  return locations.filter((location) => {
    if (seen.has(location.locationId)) return false;
    seen.add(location.locationId);
    return true;
  });
};

const rankNearbyPopularRows = (rows: DiscoverCityRow[]) => {
  return rows.slice().sort((left, right) => {
    const leftPopularity = left.popularityRank ?? Number.MAX_SAFE_INTEGER;
    const rightPopularity = right.popularityRank ?? Number.MAX_SAFE_INTEGER;
    if (leftPopularity !== rightPopularity) {
      return leftPopularity - rightPopularity;
    }

    const leftFeatured = left.featuredRank ?? Number.MAX_SAFE_INTEGER;
    const rightFeatured = right.featuredRank ?? Number.MAX_SAFE_INTEGER;
    if (leftFeatured !== rightFeatured) {
      return leftFeatured - rightFeatured;
    }

    const leftDistance = Number(left.distanceScore ?? Number.MAX_SAFE_INTEGER);
    const rightDistance = Number(right.distanceScore ?? Number.MAX_SAFE_INTEGER);
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return left.cityName.localeCompare(right.cityName);
  });
};

const rankLocation = (location: CanonicalLocation, query: string) => {
  const lowerQuery = normalizeSearchText(query);
  const upperQuery = lowerQuery.toUpperCase();
  const display = location.displayName.toLowerCase();
  const city = String(location.cityName || "").toLowerCase();
  const airport = String(location.airportName || "").toLowerCase();
  const airportCode = String(location.airportCode || "").toUpperCase();

  if (airportCode && airportCode === upperQuery) return 0;
  if (location.kind === "city" && city === lowerQuery) return 1;
  if (location.kind === "airport" && airport === lowerQuery) return 2;
  if (location.kind === "city" && city.startsWith(lowerQuery)) return 3;
  if (location.kind === "airport" && airport.startsWith(lowerQuery)) return 4;
  if (display.startsWith(lowerQuery)) return 5;
  if (city.includes(lowerQuery)) return 6;
  if (airport.includes(lowerQuery)) return 7;
  return 8;
};

export const searchLocationsInDb = async (
  query: string,
  options: SearchLocationsOptions = {},
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return [];

  const slugQuery = normalizeSlugText(query);
  const uppercaseQuery = normalizedQuery.toUpperCase();
  const limit = Math.max(1, Math.min(12, options.limit || DEFAULT_LIMIT));
  const db = getDb();

  const cityRows = await db
    .select({
      cityId: cities.id,
      citySlug: cities.slug,
      cityName: cities.name,
      regionId: regions.id,
      regionName: regions.name,
      regionCode: regions.code,
      countryName: countries.name,
      countryCode: countries.iso2,
      latitude: cities.latitude,
      longitude: cities.longitude,
      primaryAirportCode: sql<string | null>`(
        select ${airports.iataCode}
        from ${airports}
        where ${airports.cityId} = ${cities.id}
        order by ${airports.isPrimary} desc, ${airports.id} asc
        limit 1
      )`,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .where(
      or(
        ilike(cities.name, `${normalizedQuery}%`),
        ilike(cities.name, `%${normalizedQuery}%`),
        ilike(cities.slug, `${slugQuery}%`),
        cityAliasContains(normalizedQuery),
        ilike(regions.name, `${normalizedQuery}%`),
        ilike(regions.code, `${uppercaseQuery}%`),
        ilike(countries.name, `${normalizedQuery}%`),
      ),
    )
    .orderBy(...cityRankOrder(normalizedQuery, slugQuery))
    .limit(limit);

  const airportRows = await db
    .select({
      airportId: airports.id,
      airportName: airports.name,
      airportCode: airports.iataCode,
      cityId: cities.id,
      citySlug: cities.slug,
      cityName: cities.name,
      regionId: regions.id,
      regionName: regions.name,
      regionCode: regions.code,
      countryName: countries.name,
      countryCode: countries.iso2,
      latitude: airports.latitude,
      longitude: airports.longitude,
    })
    .from(airports)
    .innerJoin(cities, eq(airports.cityId, cities.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .where(
      or(
        ilike(airports.iataCode, `${uppercaseQuery}%`),
        ilike(airports.name, `${normalizedQuery}%`),
        ilike(airports.name, `%${normalizedQuery}%`),
        ilike(cities.name, `${normalizedQuery}%`),
        ilike(cities.slug, `${slugQuery}%`),
        airportCityAliasContains(normalizedQuery),
      ),
    )
    .orderBy(...airportRankOrder(normalizedQuery, uppercaseQuery))
    .limit(limit);

  return [...cityRows.map(mapCityRow), ...airportRows.map(mapAirportRow)]
    .filter((location): location is CanonicalLocation => Boolean(location))
    .sort((left, right) => {
      const leftRank = rankLocation(left, normalizedQuery);
      const rightRank = rankLocation(right, normalizedQuery);
      if (leftRank !== rightRank) return leftRank - rightRank;

      if (left.kind !== right.kind) {
        return left.kind === "city" ? -1 : 1;
      }

      return left.displayName.localeCompare(right.displayName);
    })
    .slice(0, limit);
};

export const discoverLocationsInDb = async (
  options: DiscoverLocationsOptions = {},
) => {
  const limit = Math.max(
    3,
    Math.min(6, Number.isFinite(options.limit) ? Number(options.limit) : DEFAULT_DISCOVER_LIMIT),
  );
  const db = getDb();
  const hasCoordinates =
    typeof options.latitude === "number" &&
    Number.isFinite(options.latitude) &&
    typeof options.longitude === "number" &&
    Number.isFinite(options.longitude);

  const selectedLocations: CanonicalLocation[] = [];
  const excludedCityIds = new Set<number>();

  if (hasCoordinates) {
    const nearestDistance = cityDistanceScore(options.latitude as number, options.longitude as number);
    const nearestRows = await db
      .select({
        ...citySelectFields,
        distanceScore: nearestDistance,
      })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .orderBy(asc(nearestDistance), ...cityPopularityOrder())
      .limit(1);

    const nearestRow = nearestRows[0] as DiscoverCityRow | undefined;
    const nearestLocation = nearestRow ? mapCityRow(nearestRow) : null;

    if (nearestRow?.cityId && nearestLocation) {
      excludedCityIds.add(nearestRow.cityId);
      selectedLocations.push(withSuggestionReason(nearestLocation, "Near you"));

      const nearbyRows = await db
        .select({
          ...citySelectFields,
          distanceScore: nearestDistance,
        })
        .from(cities)
        .innerJoin(countries, eq(cities.countryId, countries.id))
        .leftJoin(regions, eq(cities.regionId, regions.id))
        .where(
          and(
            eq(cities.countryId, nearestRow.countryId),
            sql`${cities.id} <> ${nearestRow.cityId}`,
          ),
        )
        .orderBy(asc(nearestDistance))
        .limit(24);

      const nearbyLocations = rankNearbyPopularRows(
        nearbyRows as DiscoverCityRow[],
      )
        .map((row) => mapCityRow(row))
        .filter((location): location is CanonicalLocation => Boolean(location))
        .slice(0, Math.max(0, limit - selectedLocations.length))
        .map((location) =>
          withSuggestionReason(location, "Popular near you"),
        );

      for (const location of nearbyLocations) {
        if (location.cityId) {
          excludedCityIds.add(location.cityId);
        }
        selectedLocations.push(location);
      }
    }
  }

  if (selectedLocations.length < limit) {
    const fallbackRows = await db
      .select(citySelectFields)
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .orderBy(...cityPopularityOrder())
      .limit(24);

    const fallbackLocations = (fallbackRows as DiscoverCityRow[])
      .map((row) => mapCityRow(row))
      .filter((location): location is CanonicalLocation => Boolean(location))
      .filter((location) => !excludedCityIds.has(location.cityId || -1))
      .map((location) =>
        withSuggestionReason(location, "Popular destination"),
      );

    selectedLocations.push(...fallbackLocations);
  }

  return dedupeLocations(selectedLocations).slice(0, limit);
};

export const resolveLocationById = async (locationId: string) => {
  const parsed = parseLocationId(locationId);
  if (!parsed) return null;
  const db = getDb();

  if (parsed.kind === "city") {
    const rows = await db
      .select({
        cityId: cities.id,
        citySlug: cities.slug,
        cityName: cities.name,
        regionId: regions.id,
        regionName: regions.name,
        regionCode: regions.code,
        countryName: countries.name,
        countryCode: countries.iso2,
        latitude: cities.latitude,
        longitude: cities.longitude,
        primaryAirportCode: sql<string | null>`(
          select ${airports.iataCode}
          from ${airports}
          where ${airports.cityId} = ${cities.id}
          order by ${airports.isPrimary} desc, ${airports.id} asc
          limit 1
        )`,
      })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(eq(cities.id, parsed.id))
      .limit(1);

    return mapCityRow(rows[0] as (typeof rows)[number]);
  }

  if (parsed.kind === "airport") {
    const rows = await db
      .select({
        airportId: airports.id,
        airportName: airports.name,
        airportCode: airports.iataCode,
        cityId: cities.id,
        citySlug: cities.slug,
        cityName: cities.name,
        regionId: regions.id,
        regionName: regions.name,
        regionCode: regions.code,
        countryName: countries.name,
        countryCode: countries.iso2,
        latitude: airports.latitude,
        longitude: airports.longitude,
      })
      .from(airports)
      .innerJoin(cities, eq(airports.cityId, cities.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(eq(airports.id, parsed.id))
      .limit(1);

    return mapAirportRow(rows[0] as (typeof rows)[number]);
  }

  return null;
};

export const resolveLocationBySearchSlug = async (searchSlug: string) => {
  const normalizedSlug = normalizeSlugText(toText(searchSlug));
  if (!normalizedSlug) return null;
  const db = getDb();

  const airportMatch = /^([a-z0-9-]+)--([a-z0-9]{3})$/.exec(
    String(searchSlug || "").trim().toLowerCase(),
  );

  if (airportMatch) {
    const [, citySlug, airportCode] = airportMatch;
    const rows = await db
      .select({
        airportId: airports.id,
        airportName: airports.name,
        airportCode: airports.iataCode,
        cityId: cities.id,
        citySlug: cities.slug,
        cityName: cities.name,
        regionId: regions.id,
        regionName: regions.name,
        regionCode: regions.code,
        countryName: countries.name,
        countryCode: countries.iso2,
        latitude: airports.latitude,
        longitude: airports.longitude,
      })
      .from(airports)
      .innerJoin(cities, eq(airports.cityId, cities.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(
        and(
          eq(cities.slug, citySlug),
          eq(sql`lower(${airports.iataCode})`, airportCode),
        ),
      )
      .limit(1);

    return mapAirportRow(rows[0] as (typeof rows)[number]);
  }

  const cityRows = await db
    .select({
      cityId: cities.id,
      citySlug: cities.slug,
      cityName: cities.name,
      regionId: regions.id,
      regionName: regions.name,
      regionCode: regions.code,
      countryName: countries.name,
      countryCode: countries.iso2,
      latitude: cities.latitude,
      longitude: cities.longitude,
      primaryAirportCode: sql<string | null>`(
        select ${airports.iataCode}
        from ${airports}
        where ${airports.cityId} = ${cities.id}
        order by ${airports.isPrimary} desc, ${airports.id} asc
        limit 1
      )`,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .where(eq(cities.slug, normalizedSlug))
    .limit(1);

  if (cityRows[0]) {
    return mapCityRow(cityRows[0]);
  }

  if (/^[a-z]{3}$/.test(normalizedSlug)) {
    const airportRows = await db
      .select({
        airportId: airports.id,
        airportName: airports.name,
        airportCode: airports.iataCode,
        cityId: cities.id,
        citySlug: cities.slug,
        cityName: cities.name,
        regionId: regions.id,
        regionName: regions.name,
        regionCode: regions.code,
        countryName: countries.name,
        countryCode: countries.iso2,
        latitude: airports.latitude,
        longitude: airports.longitude,
      })
      .from(airports)
      .innerJoin(cities, eq(airports.cityId, cities.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(eq(sql`lower(${airports.iataCode})`, normalizedSlug))
      .limit(1);

    if (airportRows[0]) {
      return mapAirportRow(airportRows[0]);
    }
  }

  return null;
};

export const resolveLocationByQuery = async (query: string) => {
  const normalizedQuery = toText(query);
  if (!normalizedQuery) return null;

  const matches = await searchLocationsInDb(normalizedQuery, { limit: 6 });
  const directDisplayMatch = matches.find(
    (location) => location.displayName.toLowerCase() === normalizedQuery.toLowerCase(),
  );
  if (directDisplayMatch) return directDisplayMatch;

  const directCityMatch = matches.find(
    (location) => location.cityName?.toLowerCase() === normalizedQuery.toLowerCase(),
  );
  if (directCityMatch) return directCityMatch;

  const directAirportCodeMatch = matches.find(
    (location) => location.airportCode?.toLowerCase() === normalizedQuery.toLowerCase(),
  );
  if (directAirportCodeMatch) return directAirportCodeMatch;

  return matches[0] || null;
};

export const resolveLocationFromUrlValues = async (input: {
  locationId?: string | null;
  searchSlug?: string | null;
  text?: string | null;
}) => {
  const locationId = toText(input.locationId);
  if (locationId) {
    const byId = await resolveLocationById(locationId);
    if (byId) return byId;
  }

  const searchSlug = toText(input.searchSlug);
  if (searchSlug) {
    const bySlug = await resolveLocationBySearchSlug(searchSlug);
    if (bySlug) return bySlug;
  }

  const text = toText(input.text);
  if (text) {
    return resolveLocationByQuery(text);
  }

  return null;
};
