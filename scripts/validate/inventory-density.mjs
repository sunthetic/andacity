// @ts-nocheck
import process from "node:process";
import {
  assertSeedInventory,
  validateSeedInventory,
} from "../../src/seed/validation/inventory-validation.js";

const parseArgs = (argv) => {
  const args = {
    horizonDays: undefined,
    anchorDate: "",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === "--horizon-days" && value) {
      args.horizonDays = Number.parseInt(String(value), 10);
      index += 1;
      continue;
    }

    if ((token === "--anchor-date" || token === "--horizon-start") && value) {
      args.anchorDate = String(value).trim();
      index += 1;
      continue;
    }

    if (token === "--json") {
      args.json = true;
    }
  }

  return args;
};

const printHumanSummary = (report) => {
  const lines = [
    `seed=${report.config.seed}`,
    `horizon=${report.config.horizonDays} days (${report.config.horizonStartDate} -> ${report.config.horizonEndDate})`,
    `cities=${report.config.cityCount}`,
    `flight routes=${report.flights.totalDirectedRoutes}, estimated itineraries=${report.flights.estimatedItineraryRows}, estimated fares=${report.flights.estimatedFareRows}`,
    `hotels=${report.hotels.totalHotels}, min nightly=${report.hotels.globalMinimumNightly}, min 2-night ratio=${report.hotels.globalMinimumContinuityRatio}`,
    `cars=${report.cars.totalInventory}, min nightly=${report.cars.globalMinimumNightly}, min weeklong pass rate=${report.cars.weeklongPassRateMinimum}`,
    `storage estimate=${report.storage.estimatedGb} GB`,
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
};

const run = () => {
  const args = parseArgs(process.argv.slice(2));
  const input = {
    horizonDays: args.horizonDays,
    horizonStartDate: args.anchorDate,
  };

  if (args.json) {
    const report = validateSeedInventory(input);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.ok ? 0 : 1);
  }

  try {
    const report = assertSeedInventory(input);
    printHumanSummary(report);
  } catch (error) {
    const report = error?.report || validateSeedInventory(input);
    printHumanSummary(report);
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
};

run();
