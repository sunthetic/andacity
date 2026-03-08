import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getTopTravelCities } from "../../src/seed/cities/top-100.js";
import { SEED_CONFIG } from "../../src/seed/config/seed-config.js";
import {
  generateHotelsForCity,
  generateHotelsInventory,
} from "../../src/seed/generators/generate-hotels.js";
import {
  generateCarRentalsForCity,
  generateCarRentalsInventory,
} from "../../src/seed/generators/generate-cars.js";
import {
  generateFlightsForRoute,
  getFlightPairingCountByCity,
  getFlightPairingsForCity,
  getFlightRouteScaleSummary,
} from "../../src/seed/generators/generate-flights.js";

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), "seed/output");

const parseArgs = (argv) => {
  const args = {
    vertical: "all",
    outDir: DEFAULT_OUT_DIR,
    city: "",
    from: "",
    to: "",
    itineraryType: "round-trip",
    departDate: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === "--vertical" && value) {
      args.vertical = String(value).trim().toLowerCase();
      index += 1;
      continue;
    }

    if (token === "--out" && value) {
      args.outDir = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (token === "--city" && value) {
      args.city = String(value).trim().toLowerCase();
      index += 1;
      continue;
    }

    if (token === "--from" && value) {
      args.from = String(value).trim().toLowerCase();
      index += 1;
      continue;
    }

    if (token === "--to" && value) {
      args.to = String(value).trim().toLowerCase();
      index += 1;
      continue;
    }

    if (token === "--itinerary" && value) {
      const itinerary = String(value).trim().toLowerCase();
      args.itineraryType = itinerary === "one-way" ? "one-way" : "round-trip";
      index += 1;
      continue;
    }

    if (token === "--depart" && value) {
      args.departDate = String(value).trim();
      index += 1;
      continue;
    }
  }

  return args;
};

const ensureDir = async (directory) => {
  await mkdir(directory, { recursive: true });
};

const writeJson = async (filePath, payload) => {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
};

const writeCities = async (outDir) => {
  const cities = getTopTravelCities().map((city) => ({
    ...city,
    query: city.slug,
    airportCode: city.airportCodes[0] || "",
  }));

  await writeJson(path.join(outDir, "cities/top-100.json"), {
    seed: SEED_CONFIG.seed,
    count: cities.length,
    generatedAt: new Date().toISOString(),
    cities,
  });

  return { cities: cities.length };
};

const writeHotels = async (outDir, options = {}) => {
  const cities = getTopTravelCities();
  const filteredCities = options.city
    ? cities.filter((city) => city.slug === options.city)
    : cities;

  let hotelsWritten = 0;

  for (const city of filteredCities) {
    const hotels = generateHotelsForCity(city);
    hotelsWritten += hotels.length;

    await writeJson(path.join(outDir, `hotels/${city.slug}.json`), {
      city: {
        slug: city.slug,
        name: city.name,
        country: city.country,
        region: city.region,
      },
      count: hotels.length,
      hotels,
    });
  }

  return {
    cityFiles: filteredCities.length,
    hotels: hotelsWritten,
    totalHotelsInMemory: generateHotelsInventory().length,
  };
};

const writeCars = async (outDir, options = {}) => {
  const cities = getTopTravelCities();
  const filteredCities = options.city
    ? cities.filter((city) => city.slug === options.city)
    : cities;

  let rentalsWritten = 0;

  for (const city of filteredCities) {
    const rentals = generateCarRentalsForCity(city);
    rentalsWritten += rentals.length;

    await writeJson(path.join(outDir, `cars/${city.slug}.json`), {
      city: {
        slug: city.slug,
        name: city.name,
        country: city.country,
        region: city.region,
      },
      count: rentals.length,
      rentals,
    });
  }

  return {
    cityFiles: filteredCities.length,
    rentals: rentalsWritten,
    totalRentalsInMemory: generateCarRentalsInventory().length,
  };
};

const writeFlights = async (outDir, options = {}) => {
  const allCities = getTopTravelCities();

  if (options.from && options.to) {
    const flights = generateFlightsForRoute({
      fromSlug: options.from,
      toSlug: options.to,
      itineraryType: options.itineraryType,
      departDate: options.departDate || undefined,
    });

    await writeJson(
      path.join(
        outDir,
        `flights/routes/${options.from}/${options.to}-${options.itineraryType}.json`,
      ),
      {
        from: options.from,
        to: options.to,
        itineraryType: options.itineraryType,
        departDate: options.departDate || null,
        count: flights.length,
        flights,
      },
    );

    return {
      mode: "route",
      from: options.from,
      to: options.to,
      itineraryType: options.itineraryType,
      flights: flights.length,
    };
  }

  const cities = options.city
    ? allCities.filter((city) => city.slug === options.city)
    : allCities;

  for (const city of cities) {
    const pairings = getFlightPairingsForCity(city.slug);

    await writeJson(path.join(outDir, `flights/pairings/${city.slug}.json`), {
      city: city.slug,
      count: pairings.length,
      pairings,
      notes:
        "Use --from/--to to materialize route-level flight results. Pairing generation is deterministic and yields >=20 flights per pairing.",
    });
  }

  await writeJson(path.join(outDir, "flights/scale-summary.json"), {
    ...getFlightRouteScaleSummary(),
    pairingCountsByCity: getFlightPairingCountByCity(),
  });

  return {
    mode: "pairings",
    cityFiles: cities.length,
    minPairingsPerCity: getFlightRouteScaleSummary().minPairingsPerCity,
    flightsPerPairing: SEED_CONFIG.flightsPerPairing,
    estimatedRows: getFlightRouteScaleSummary().estimatedRows,
  };
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  await ensureDir(args.outDir);

  const result = {
    outputDirectory: args.outDir,
    seed: SEED_CONFIG.seed,
    vertical: args.vertical,
    steps: {},
  };

  if (args.vertical === "all" || args.vertical === "cities") {
    result.steps.cities = await writeCities(args.outDir);
  }

  if (args.vertical === "all" || args.vertical === "hotels") {
    result.steps.hotels = await writeHotels(args.outDir, { city: args.city });
  }

  if (args.vertical === "all" || args.vertical === "cars") {
    result.steps.cars = await writeCars(args.outDir, { city: args.city });
  }

  if (args.vertical === "all" || args.vertical === "flights") {
    result.steps.flights = await writeFlights(args.outDir, {
      city: args.city,
      from: args.from,
      to: args.to,
      itineraryType: args.itineraryType,
      departDate: args.departDate,
    });
  }

  await writeJson(path.join(args.outDir, "manifest.json"), result);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
