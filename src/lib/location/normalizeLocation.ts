import { formatLocationDisplay } from "~/lib/location/formatLocationDisplay";
import type { CanonicalLocation, CanonicalLocationKind } from "~/types/location";

type NormalizeLocationInput = {
  kind: CanonicalLocationKind;
  cityId?: number | null;
  airportId?: number | null;
  regionId?: number | null;
  citySlug?: string | null;
  cityName?: string | null;
  airportName?: string | null;
  airportCode?: string | null;
  primaryAirportCode?: string | null;
  stateOrProvinceName?: string | null;
  stateOrProvinceCode?: string | null;
  countryName?: string | null;
  countryCode?: string | null;
  displayName?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  providerMetadata?: Record<string, unknown> | null;
};

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toNumber = (value: unknown) => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toInteger = (value: unknown) => {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const COUNTRY_CODE_FALLBACKS: Record<string, string> = {
  "argentina": "AR",
  "australia": "AU",
  "austria": "AT",
  "belgium": "BE",
  "brazil": "BR",
  "bulgaria": "BG",
  "cambodia": "KH",
  "canada": "CA",
  "chile": "CL",
  "china": "CN",
  "colombia": "CO",
  "croatia": "HR",
  "czechia": "CZ",
  "denmark": "DK",
  "egypt": "EG",
  "estonia": "EE",
  "ethiopia": "ET",
  "finland": "FI",
  "france": "FR",
  "germany": "DE",
  "ghana": "GH",
  "greece": "GR",
  "hong-kong": "HK",
  "hungary": "HU",
  "iceland": "IS",
  "india": "IN",
  "indonesia": "ID",
  "ireland": "IE",
  "israel": "IL",
  "italy": "IT",
  "japan": "JP",
  "jordan": "JO",
  "kenya": "KE",
  "latvia": "LV",
  "lithuania": "LT",
  "malaysia": "MY",
  "maldives": "MV",
  "mauritius": "MU",
  "mexico": "MX",
  "morocco": "MA",
  "nepal": "NP",
  "netherlands": "NL",
  "new-zealand": "NZ",
  "norway": "NO",
  "oman": "OM",
  "peru": "PE",
  "philippines": "PH",
  "poland": "PL",
  "portugal": "PT",
  "puerto-rico": "PR",
  "qatar": "QA",
  "romania": "RO",
  "saudi-arabia": "SA",
  "singapore": "SG",
  "slovenia": "SI",
  "south-africa": "ZA",
  "south-korea": "KR",
  "spain": "ES",
  "sri-lanka": "LK",
  "sweden": "SE",
  "switzerland": "CH",
  "taiwan": "TW",
  "tanzania": "TZ",
  "thailand": "TH",
  "turkey": "TR",
  "united-arab-emirates": "AE",
  "united-kingdom": "GB",
  "united-states": "US",
  "vietnam": "VN",
};

const slugify = (value: string) => {
  return value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
};

const resolveCountryCode = (countryCode: string | null, countryName: string | null) => {
  if (countryCode) return countryCode;
  if (!countryName) return null;

  return COUNTRY_CODE_FALLBACKS[slugify(countryName)] || null;
};

export const buildLocationId = (
  kind: CanonicalLocationKind,
  numericId: number | null | undefined,
) => {
  const id = toInteger(numericId);
  return id && id > 0 ? `${kind}:${id}` : null;
};

export const parseLocationId = (value: unknown) => {
  const match = /^([a-z]+):(\d+)$/.exec(String(value ?? "").trim());
  if (!match) return null;

  const kind = match[1] as CanonicalLocationKind;
  if (
    kind !== "city" &&
    kind !== "airport" &&
    kind !== "station" &&
    kind !== "region"
  ) {
    return null;
  }

  return {
    kind,
    id: Number.parseInt(match[2], 10),
  };
};

export const buildLocationSearchSlug = (input: {
  kind: CanonicalLocationKind;
  citySlug?: string | null;
  cityName?: string | null;
  airportCode?: string | null;
  displayName?: string | null;
}) => {
  const citySlug = slugify(String(input.citySlug || ""));
  const airportCode = String(input.airportCode || "").trim().toLowerCase();

  if (input.kind === "airport" && citySlug && airportCode) {
    return `${citySlug}--${airportCode}`;
  }

  if (citySlug) {
    return citySlug;
  }

  const cityName = toText(input.cityName);
  if (cityName) {
    return slugify(cityName);
  }

  const displayName = toText(input.displayName);
  return displayName ? slugify(displayName) : "";
};

export const normalizeLocation = (
  input: NormalizeLocationInput,
): CanonicalLocation | null => {
  const kind = input.kind;
  const cityId = toInteger(input.cityId);
  const airportId = toInteger(input.airportId);
  const regionId = toInteger(input.regionId);
  const citySlug = toText(input.citySlug);
  const cityName = toText(input.cityName);
  const airportName = toText(input.airportName);
  const airportCode = toText(input.airportCode)?.toUpperCase() || null;
  const primaryAirportCode =
    toText(input.primaryAirportCode)?.toUpperCase() || null;
  const stateOrProvinceName = toText(input.stateOrProvinceName);
  const stateOrProvinceCode =
    toText(input.stateOrProvinceCode)?.toUpperCase() || null;
  const countryName = toText(input.countryName);
  const countryCode = resolveCountryCode(
    toText(input.countryCode)?.toUpperCase() || null,
    countryName,
  );

  const locationId = buildLocationId(
    kind,
    kind === "airport" ? airportId : cityId ?? regionId,
  );

  if (!locationId || !countryName || !countryCode) {
    return null;
  }

  if (kind === "airport" && (!airportName || !airportCode)) {
    return null;
  }

  if (kind === "city" && !cityName) {
    return null;
  }

  const searchSlug = buildLocationSearchSlug({
    kind,
    citySlug,
    cityName,
    airportCode,
    displayName: input.displayName,
  });
  const displayName =
    toText(input.displayName) ||
    formatLocationDisplay({
      kind,
      cityName,
      airportName,
      airportCode,
      stateOrProvinceCode,
      stateOrProvinceName,
      countryName,
    });

  return {
    locationId,
    searchSlug,
    kind,
    cityId,
    airportId,
    regionId,
    citySlug,
    cityName,
    airportName,
    airportCode,
    primaryAirportCode,
    stateOrProvinceName,
    stateOrProvinceCode,
    countryName,
    countryCode,
    displayName,
    latitude: toNumber(input.latitude),
    longitude: toNumber(input.longitude),
    providerMetadata: input.providerMetadata || undefined,
  };
};
