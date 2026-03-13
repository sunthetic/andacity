import assert from "node:assert/strict";
import test from "node:test";

import { formatLocationDisplay } from "~/lib/location/formatLocationDisplay";
import {
  buildLocationId,
  buildLocationSearchSlug,
  normalizeLocation,
  parseLocationId,
} from "~/lib/location/normalizeLocation";
import {
  parseLocationSelection,
  validateLocationSelection,
} from "~/lib/location/validateLocationSelection";

test("formatLocationDisplay formats canonical city and airport labels", () => {
  assert.equal(
    formatLocationDisplay({
      kind: "city",
      cityName: "Orlando",
      airportName: null,
      airportCode: null,
      stateOrProvinceCode: "FL",
      stateOrProvinceName: "Florida",
      countryName: "United States",
    }),
    "Orlando, FL, United States",
  );

  assert.equal(
    formatLocationDisplay({
      kind: "airport",
      cityName: "London",
      airportName: "London Heathrow Airport",
      airportCode: "LHR",
      stateOrProvinceCode: null,
      stateOrProvinceName: "England",
      countryName: "United Kingdom",
    }),
    "London Heathrow Airport (LHR), England, United Kingdom",
  );
});

test("normalizeLocation creates stable canonical ids, slugs, and display names", () => {
  const city = normalizeLocation({
    kind: "city",
    cityId: 44,
    regionId: 9,
    citySlug: "orlando",
    cityName: "Orlando",
    primaryAirportCode: "mco",
    stateOrProvinceName: "Florida",
    stateOrProvinceCode: "fl",
    countryName: "United States",
    countryCode: "us",
    latitude: "28.5383",
    longitude: "-81.3792",
  });
  const airport = normalizeLocation({
    kind: "airport",
    airportId: 7,
    cityId: 44,
    regionId: 9,
    citySlug: "orlando",
    cityName: "Orlando",
    airportName: "Orlando International Airport",
    airportCode: "mco",
    stateOrProvinceName: "Florida",
    stateOrProvinceCode: "fl",
    countryName: "United States",
    countryCode: "us",
  });

  assert.deepEqual(city, {
    locationId: "city:44",
    searchSlug: "orlando",
    kind: "city",
    cityId: 44,
    airportId: null,
    regionId: 9,
    citySlug: "orlando",
    cityName: "Orlando",
    airportName: null,
    airportCode: null,
    primaryAirportCode: "MCO",
    stateOrProvinceName: "Florida",
    stateOrProvinceCode: "FL",
    countryName: "United States",
    countryCode: "US",
    displayName: "Orlando, FL, United States",
    latitude: 28.5383,
    longitude: -81.3792,
    providerMetadata: undefined,
  });

  assert.equal(airport?.locationId, "airport:7");
  assert.equal(airport?.searchSlug, "orlando--mco");
  assert.equal(
    airport?.displayName,
    "Orlando International Airport (MCO), FL, United States",
  );
});

test("normalize helpers preserve canonical identity across input variants", () => {
  const left = normalizeLocation({
    kind: "airport",
    airportId: 101,
    cityId: 22,
    citySlug: "moncton",
    cityName: "Moncton",
    airportName: "Greater Moncton Roméo LeBlanc International Airport",
    airportCode: "yqm",
    stateOrProvinceName: "New Brunswick",
    stateOrProvinceCode: "nb",
    countryName: "Canada",
    countryCode: "ca",
  });
  const right = normalizeLocation({
    kind: "airport",
    airportId: 101,
    cityId: 22,
    citySlug: "Moncton",
    cityName: "Moncton",
    airportName: "Greater Moncton Roméo LeBlanc International Airport",
    airportCode: "YQM",
    stateOrProvinceName: "New Brunswick",
    stateOrProvinceCode: "NB",
    countryName: "Canada",
    countryCode: "CA",
  });

  assert.equal(left?.locationId, right?.locationId);
  assert.equal(left?.searchSlug, right?.searchSlug);
  assert.equal(left?.displayName, right?.displayName);
});

test("normalizeLocation preserves provider metadata for suggestion labeling", () => {
  const location = normalizeLocation({
    kind: "city",
    cityId: 11,
    citySlug: "salt-lake-city",
    cityName: "Salt Lake City",
    stateOrProvinceName: "Utah",
    stateOrProvinceCode: "UT",
    countryName: "United States",
    countryCode: "US",
    providerMetadata: {
      suggestionReason: "Near you",
    },
  });

  assert.equal(location?.providerMetadata?.suggestionReason, "Near you");
});

test("location id helpers encode and parse stable canonical ids", () => {
  assert.equal(buildLocationId("city", 15), "city:15");
  assert.deepEqual(parseLocationId("airport:7"), {
    kind: "airport",
    id: 7,
  });
  assert.equal(buildLocationSearchSlug({
    kind: "airport",
    citySlug: "new-york",
    airportCode: "jfk",
  }), "new-york--jfk");
});

test("validateLocationSelection accepts canonical selections and rejects unmatched text", () => {
  const selection = JSON.stringify({
    kind: "city",
    cityId: 44,
    citySlug: "orlando",
    cityName: "Orlando",
    stateOrProvinceName: "Florida",
    stateOrProvinceCode: "FL",
    countryName: "United States",
    countryCode: "US",
  });

  const parsed = parseLocationSelection(selection);
  assert.equal(parsed?.locationId, "city:44");
  assert.equal(parsed?.displayName, "Orlando, FL, United States");

  assert.deepEqual(
    validateLocationSelection({
      selection,
      rawValue: "Orlando, FL, United States",
      required: true,
      fieldLabel: "destination",
      allowedKinds: ["city", "airport"],
    }),
    {
      location: parsed,
      error: null,
    },
  );

  assert.deepEqual(
    validateLocationSelection({
      selection: "",
      rawValue: "Orlando",
      required: true,
      fieldLabel: "destination",
      allowedKinds: ["city", "airport"],
    }),
    {
      location: null,
      error: "Choose a valid destination from the suggestions.",
    },
  );

  assert.deepEqual(
    validateLocationSelection({
      selection,
      rawValue: "Orlando",
      required: true,
      fieldLabel: "destination",
      allowedKinds: ["city", "airport"],
    }),
    {
      location: null,
      error: "Choose a valid destination from the suggestions.",
    },
  );
});
