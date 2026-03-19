import type { BookableVertical } from "~/types/bookable-entity";

export const PROVIDER_BOOKING_ENV_KEYS = [
  "ANDACITY_BOOKING_FLIGHT_ENABLED",
  "ANDACITY_BOOKING_HOTEL_ENABLED",
  "ANDACITY_BOOKING_CAR_ENABLED",
] as const;
export type ProviderBookingEnvKey = (typeof PROVIDER_BOOKING_ENV_KEYS)[number];

export const NOTIFICATION_ENV_KEYS = [
  "NOTIFICATION_PROVIDER",
  "RESEND_API_KEY",
  "RESEND_API_BASE",
  "NOTIFICATION_FROM_EMAIL",
  "NOTIFICATION_FROM_NAME",
  "PUBLIC_BASE_URL",
] as const;
export type NotificationEnvKey = (typeof NOTIFICATION_ENV_KEYS)[number];

export type ProviderRuntimeConfig = {
  provider: string;
  canonicalProvider: string;
  vertical: BookableVertical | null;
  bookingEnabled: boolean;
  bookingMode: "internal";
};
