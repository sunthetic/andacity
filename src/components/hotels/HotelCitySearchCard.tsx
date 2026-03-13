import { component$, useSignal } from "@builder.io/qwik";
import { DateField } from "~/components/ui/DateField";
import { getTodayIsoDate } from "~/lib/date/validateDate";
import { addDays } from "~/lib/trips/date-utils";

const HOTEL_DATE_INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]";

export const HotelCitySearchCard = component$(
  (props: HotelCitySearchCardProps) => {
    const checkIn = useSignal(props.checkIn || "");
    const checkOut = useSignal(props.checkOut || "");
    const todayIsoDate = getTodayIsoDate();
    const tomorrowIsoDate = addDays(todayIsoDate, 1) || todayIsoDate;
    const minimumCheckoutDate =
      addDays(
        checkIn.value >= todayIsoDate ? checkIn.value : todayIsoDate,
        1,
      ) || tomorrowIsoDate;

    return (
      <div class="t-card p-5">
        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.title}
        </div>

        <form method="get" action={props.action} class="mt-4 grid gap-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label
                for="hotel-city-check-in"
                class="text-xs font-medium text-[color:var(--color-text-subtle)]"
              >
                Check-in
              </label>
              <DateField
                id="hotel-city-check-in"
                name="checkIn"
                value={checkIn}
                minValue={todayIsoDate}
                inputClass={HOTEL_DATE_INPUT_CLASS}
                iconLabel="Open check-in date picker"
                overlayLabel="Check-in date picker"
              />
            </div>

            <div>
              <label
                for="hotel-city-check-out"
                class="text-xs font-medium text-[color:var(--color-text-subtle)]"
              >
                Check-out
              </label>
              <DateField
                id="hotel-city-check-out"
                name="checkOut"
                value={checkOut}
                minValue={minimumCheckoutDate}
                inputClass={HOTEL_DATE_INPUT_CLASS}
                iconLabel="Open check-out date picker"
                overlayLabel="Check-out date picker"
                overlayPosition="right"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label
                for="hotel-city-adults"
                class="text-xs font-medium text-[color:var(--color-text-subtle)]"
              >
                Adults
              </label>
              <input
                id="hotel-city-adults"
                name="adults"
                class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                placeholder="2"
                value={props.adults || ""}
              />
            </div>

            <div>
              <label
                for="hotel-city-rooms"
                class="text-xs font-medium text-[color:var(--color-text-subtle)]"
              >
                Rooms
              </label>
              <input
                id="hotel-city-rooms"
                name="rooms"
                class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                placeholder="1"
                value={props.rooms || ""}
              />
            </div>
          </div>

          <button class="t-btn-primary" type="submit">
            {props.updateLabel || "Update"}
          </button>

          <a class="t-btn-primary block text-center" href={props.resultsHref}>
            {props.resultsLabel || "See hotel results"}
          </a>

          <div class="text-xs text-[color:var(--color-text-muted)]">
            {props.helperText ||
              "This city page is indexable. Search pages remain noindex."}
          </div>
        </form>
      </div>
    );
  },
);

/* -----------------------------
  Types
----------------------------- */

type HotelCitySearchCardProps = {
  title: string;
  action: string;
  resultsHref: string;
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  rooms?: string;
  updateLabel?: string;
  resultsLabel?: string;
  helperText?: string;
};
