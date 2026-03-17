import { defineConfig } from "drizzle-kit";

const DEFAULT_DB_SCHEMA = "andacity_app";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://andacity:andacity@localhost:5432/andacity";

const buildSearchPath = (schemaName: string) => {
  return Array.from(new Set([schemaName, DEFAULT_DB_SCHEMA, "public"])).join(",");
};

const withSearchPathOption = (connectionString: string, schemaName: string) => {
  const addition = `-c search_path=${buildSearchPath(schemaName)}`;

  try {
    const parsed = new URL(connectionString);
    const existing = String(parsed.searchParams.get("options") || "");
    const nextOptions = existing ? `${existing} ${addition}` : addition;
    parsed.searchParams.set("options", nextOptions);
    return parsed.toString();
  } catch {
    const separator = connectionString.includes("?") ? "&" : "?";
    return `${connectionString}${separator}options=${encodeURIComponent(addition)}`;
  }
};

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: withSearchPathOption(databaseUrl, DEFAULT_DB_SCHEMA),
  },
  strict: true,
  verbose: true,
});
