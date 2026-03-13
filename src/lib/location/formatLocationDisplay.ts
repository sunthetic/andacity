import type { CanonicalLocation } from "~/types/location";

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

export const formatLocationDisplay = (
  location: Pick<
    CanonicalLocation,
    | "kind"
    | "cityName"
    | "airportName"
    | "airportCode"
    | "stateOrProvinceCode"
    | "stateOrProvinceName"
    | "countryName"
  >,
) => {
  const primary =
    location.kind === "airport"
      ? [
          toText(location.airportName),
          toText(location.airportCode)
            ? `(${toText(location.airportCode)})`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : toText(location.cityName) || toText(location.airportName) || "";

  const region =
    toText(location.stateOrProvinceCode) ||
    toText(location.stateOrProvinceName) ||
    null;

  return [primary, region, toText(location.countryName)]
    .filter(Boolean)
    .join(", ");
};
