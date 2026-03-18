import type { BookableVertical } from "~/types/bookable-entity";

export type ProviderBookingCapabilities = {
  provider: string;
  vertical: BookableVertical | null;
  supportsBookingCreate: boolean;
  supportsBookingRead: boolean;
  supportsBookingCancel: boolean;
  supportsIdempotencyKeys: boolean;
};
