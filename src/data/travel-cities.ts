import { getTopTravelCities } from "~/seed/cities/top-100.js";

export type TravelCity = {
  rank: number;
  name: string;
  slug: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  airportCodes: string[];
  aliases?: string[];
  query: string;
  airportCode: string;
};

export const TRAVEL_CITIES: TravelCity[] = getTopTravelCities().map((city) => ({
  ...city,
  query: city.slug,
  airportCode: city.airportCodes[0] || "",
}));

export const TRAVEL_CITIES_BY_SLUG = Object.fromEntries(
  TRAVEL_CITIES.map((city) => [city.slug, city]),
) as Record<string, TravelCity>;

export const getTravelCityBySlug = (slug: string) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  return TRAVEL_CITIES_BY_SLUG[key] || null;
};
