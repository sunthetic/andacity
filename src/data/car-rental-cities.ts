import { CAR_RENTALS } from "~/data/car-rentals";

const buildCarRentalCities = (): CarRentalCity[] => {
  const bySlug: Record<string, CarRentalCity> = {};

  for (const rental of CAR_RENTALS) {
    const slug = String(rental.cityQuery || "")
      .trim()
      .toLowerCase();
    if (!slug) continue;

    bySlug[slug] = bySlug[slug] || {
      slug,
      name: rental.city,
      region: rental.region,
      country: rental.country,
    };
  }

  return Object.values(bySlug).sort((a, b) => a.name.localeCompare(b.name));
};

export const CAR_RENTAL_CITIES: CarRentalCity[] = buildCarRentalCities();

export const CAR_RENTAL_CITIES_BY_SLUG = Object.fromEntries(
  CAR_RENTAL_CITIES.map((c) => [c.slug, c]),
) as Record<string, CarRentalCity>;

export const getCarRentalCityBySlug = (slug: string) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  return CAR_RENTAL_CITIES_BY_SLUG[key] || null;
};

/* -----------------------------
   Types
----------------------------- */

export type CarRentalCity = {
  slug: string;
  name: string;
  region: string;
  country: string;
};
