import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ params, redirect, url }) => {
  const path = `/car-rentals/search/${encodeURIComponent(String(params.airportCode || "").trim())}/${encodeURIComponent(String(params.pickupDate || "").trim())}/${encodeURIComponent(String(params.dropoffDate || "").trim())}`;
  const query = url.searchParams.toString();
  throw redirect(301, query ? `${path}?${query}` : path);
};
