import { getBookingAdapter } from "~/lib/booking/adapters";
import type { CreateBookingAdapterInput } from "~/types/booking-adapter";

const resolveProvider = (input: CreateBookingAdapterInput) => {
  const bookableEntityProvider = input.checkoutItem.inventory.bookableEntity?.provider;
  const metadataProvider = input.checkoutItem.inventory.providerMetadata?.provider;

  return (
    String(bookableEntityProvider || metadataProvider || input.provider || "")
      .trim()
      .toLowerCase() || input.checkoutItem.vertical
  );
};

export const createBooking = async (input: CreateBookingAdapterInput) => {
  const provider = resolveProvider(input);
  const adapter = getBookingAdapter(provider);

  return adapter.createBooking({
    ...input,
    provider,
  });
};
