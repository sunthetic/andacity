import { getProviderConfig } from "~/lib/providers/getProviderConfig";
import type { ProviderBookingCapabilities } from "~/types/provider-capabilities";

export const getProviderCapabilities = (
  provider: string | null | undefined,
): ProviderBookingCapabilities => {
  const config = getProviderConfig(provider);
  const supported = Boolean(config.vertical);

  return {
    provider: config.provider,
    vertical: config.vertical,
    supportsBookingCreate: supported && config.bookingEnabled,
    supportsBookingRead: supported && config.bookingEnabled,
    supportsBookingCancel: false,
    supportsIdempotencyKeys: supported && config.bookingEnabled,
  };
};
