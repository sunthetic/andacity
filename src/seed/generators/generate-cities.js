// @ts-nocheck
import { getTopTravelCities, findTopTravelCity } from "../cities/top-100.js";

export const generateCities = () => {
  return getTopTravelCities().map((city) => ({
    ...city,
    query: city.slug,
    airportCode: city.airportCodes[0] || "",
  }));
};

export const getCityBySlug = (slug) => {
  return findTopTravelCity(slug);
};

export const findCityByQuery = (query) => {
  return findTopTravelCity(query);
};
