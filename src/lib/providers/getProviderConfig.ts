import { getServerRuntimeEnvValue } from "~/lib/server/runtime-env.server";
import type {
  ProviderBookingEnvKey,
  ProviderRuntimeConfig,
} from "~/types/env";

type ProviderDescriptor = {
  canonicalProvider: string;
  vertical: ProviderRuntimeConfig["vertical"];
  envKey: ProviderBookingEnvKey;
};

const normalizeProviderKey = (value: string | null | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase();

const PROVIDER_BOOKING_DESCRIPTORS: Record<string, ProviderDescriptor> = {
  flight: {
    canonicalProvider: "flight-default",
    vertical: "flight",
    envKey: "ANDACITY_BOOKING_FLIGHT_ENABLED",
  },
  "flight-default": {
    canonicalProvider: "flight-default",
    vertical: "flight",
    envKey: "ANDACITY_BOOKING_FLIGHT_ENABLED",
  },
  hotel: {
    canonicalProvider: "hotel-default",
    vertical: "hotel",
    envKey: "ANDACITY_BOOKING_HOTEL_ENABLED",
  },
  "hotel-default": {
    canonicalProvider: "hotel-default",
    vertical: "hotel",
    envKey: "ANDACITY_BOOKING_HOTEL_ENABLED",
  },
  car: {
    canonicalProvider: "car-default",
    vertical: "car",
    envKey: "ANDACITY_BOOKING_CAR_ENABLED",
  },
  "car-default": {
    canonicalProvider: "car-default",
    vertical: "car",
    envKey: "ANDACITY_BOOKING_CAR_ENABLED",
  },
};

const readBooleanRuntimeEnv = (key: ProviderBookingEnvKey) => {
  const value = String(getServerRuntimeEnvValue(key) || "")
    .trim()
    .toLowerCase();
  if (!value) return true;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return true;
};

export const resolveProviderBookingDescriptor = (
  provider: string | null | undefined,
) => {
  const normalizedProvider = normalizeProviderKey(provider);
  return normalizedProvider
    ? PROVIDER_BOOKING_DESCRIPTORS[normalizedProvider] || null
    : null;
};

export const getProviderConfig = (
  provider: string | null | undefined,
): ProviderRuntimeConfig => {
  const normalizedProvider = normalizeProviderKey(provider);
  const descriptor = resolveProviderBookingDescriptor(normalizedProvider);

  if (!descriptor) {
    return {
      provider: normalizedProvider || "unknown-provider",
      canonicalProvider: normalizedProvider || "unknown-provider",
      vertical: null,
      bookingEnabled: false,
      bookingMode: "internal",
    };
  }

  return {
    provider: normalizedProvider || descriptor.canonicalProvider,
    canonicalProvider: descriptor.canonicalProvider,
    vertical: descriptor.vertical,
    bookingEnabled: readBooleanRuntimeEnv(descriptor.envKey),
    bookingMode: "internal",
  };
};
