// @ts-nocheck
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getTopTravelCities } from "../../src/seed/cities/top-100.js";
import { resolveSeedConfig } from "../../src/seed/config/seed-config.js";
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
    horizonDays: undefined,
    anchorDate: "",
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

    if (token === "--horizon-days" && value) {
      args.horizonDays = Number.parseInt(String(value), 10);
      index += 1;
      continue;
    }

    if ((token === "--anchor-date" || token === "--horizon-start") && value) {
      args.anchorDate = String(value).trim();
      index += 1;
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

const writeCities = async (outDir, config) => {
  const cities = getTopTravelCities().map((city) => ({
    ...city,
    query: city.slug,
    airportCode: city.airportCodes[0] || "",
  }));

  await writeJson(path.join(outDir, "cities/catalog.json"), {
    seed: config.seed,
    count: cities.length,
    generatedAt: new Date().toISOString(),
    horizonDays: config.horizonDays,
    horizonStartDate: config.horizonStartDate,
    horizonEndDate: config.horizonEndDate,
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
    const hotels = generateHotelsForCity(city, {
      seedConfig: options.seedConfig,
    });
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
    totalHotelsInMemory: generateHotelsInventory({
      seedConfig: options.seedConfig,
    }).length,
  };
};

const writeCars = async (outDir, options = {}) => {
  const cities = getTopTravelCities();
  const filteredCities = options.city
    ? cities.filter((city) => city.slug === options.city)
    : cities;

  let rentalsWritten = 0;

  for (const city of filteredCities) {
    const rentals = generateCarRentalsForCity(city, {
      seedConfig: options.seedConfig,
    });
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
    totalRentalsInMemory: generateCarRentalsInventory({
      seedConfig: options.seedConfig,
    }).length,
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
      seedConfig: options.seedConfig,
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
        departDate: options.departDate || options.seedConfig.horizonStartDate,
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

  const scaleSummary = getFlightRouteScaleSummary({
    seedConfig: options.seedConfig,
  });

  for (const city of cities) {
    const pairings = getFlightPairingsForCity(city.slug, {
      seedConfig: options.seedConfig,
    });

    await writeJson(path.join(outDir, `flights/pairings/${city.slug}.json`), {
      city: city.slug,
      count: pairings.length,
      pairings,
      notes:
        "Use --from/--to with --depart to materialize a concrete route day. Pairings follow the dense rolling horizon and target >=30 itineraries per route per week.",
    });
  }

  await writeJson(path.join(outDir, "flights/scale-summary.json"), {
    ...scaleSummary,
    pairingCountsByCity: getFlightPairingCountByCity({
      seedConfig: options.seedConfig,
    }),
  });

  return {
    mode: "pairings",
    cityFiles: cities.length,
    minPairingsPerCity: scaleSummary.minPairingsPerCity,
    minRoutesPerCity: scaleSummary.minRoutesPerCity,
    flightsPerPairing: scaleSummary.flightsPerPairing,
    horizonDays: scaleSummary.horizonDays,
    estimatedRows: scaleSummary.estimatedRows,
  };
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const seedConfig = resolveSeedConfig({
    horizonDays: args.horizonDays,
    horizonStartDate: args.anchorDate,
  });

  await ensureDir(args.outDir);

  const result = {
    outputDirectory: args.outDir,
    seed: seedConfig.seed,
    vertical: args.vertical,
    horizonDays: seedConfig.horizonDays,
    horizonStartDate: seedConfig.horizonStartDate,
    horizonEndDate: seedConfig.horizonEndDate,
    steps: {},
  };

  if (args.vertical === "all" || args.vertical === "cities") {
    result.steps.cities = await writeCities(args.outDir, seedConfig);
  }

  if (args.vertical === "all" || args.vertical === "hotels") {
    result.steps.hotels = await writeHotels(args.outDir, {
      city: args.city,
      seedConfig,
    });
  }

  if (args.vertical === "all" || args.vertical === "cars") {
    result.steps.cars = await writeCars(args.outDir, {
      city: args.city,
      seedConfig,
    });
  }

  if (args.vertical === "all" || args.vertical === "flights") {
    result.steps.flights = await writeFlights(args.outDir, {
      city: args.city,
      from: args.from,
      to: args.to,
      itineraryType: args.itineraryType,
      departDate: args.departDate,
      seedConfig,
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
