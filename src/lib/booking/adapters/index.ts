import { createCarBooking } from "~/lib/providers/car/booking/createBooking";
import { getCarBooking } from "~/lib/providers/car/booking/getBooking";
import { createFlightBooking } from "~/lib/providers/flight/booking/createBooking";
import { getFlightBooking } from "~/lib/providers/flight/booking/getBooking";
import { createHotelBooking } from "~/lib/providers/hotel/booking/createBooking";
import { getHotelBooking } from "~/lib/providers/hotel/booking/getBooking";
import type { BookingAdapter } from "~/types/booking-adapter";

const normalizeProviderKey = (value: string | null | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase();

const flightBookingAdapter: BookingAdapter = {
  provider: "flight-default",
  vertical: "flight",
  createBooking: createFlightBooking,
  getBooking: getFlightBooking,
};

const hotelBookingAdapter: BookingAdapter = {
  provider: "hotel-default",
  vertical: "hotel",
  createBooking: createHotelBooking,
  getBooking: getHotelBooking,
};

const carBookingAdapter: BookingAdapter = {
  provider: "car-default",
  vertical: "car",
  createBooking: createCarBooking,
  getBooking: getCarBooking,
};

// Add new provider booking implementations here. The registry is the only dispatch seam
// the orchestration layer should know about.
export const BOOKING_ADAPTERS: Record<string, BookingAdapter> = {
  "flight-default": flightBookingAdapter,
  flight: flightBookingAdapter,
  "hotel-default": hotelBookingAdapter,
  hotel: hotelBookingAdapter,
  "car-default": carBookingAdapter,
  car: carBookingAdapter,
};

export const getBookingAdapter = (provider: string | null | undefined) => {
  const normalizedProvider = normalizeProviderKey(provider);
  return normalizedProvider ? BOOKING_ADAPTERS[normalizedProvider] || null : null;
};
