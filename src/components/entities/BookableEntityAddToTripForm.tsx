import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import {
  parseAddToTripContextTripId,
  readAddToTripErrorNotice,
} from "~/lib/trips/add-to-trip-feedback";
import type { BookableVertical } from "~/types/bookable-entity";

type BookableEntityAddToTripCta = {
  label: string;
  disabled: boolean;
  note: string;
  inventoryId: string;
  canonicalPath: string;
};

export const BookableEntityAddToTripForm = component$(
  (props: BookableEntityAddToTripFormProps) => {
    const location = useLocation();
    const feedback = readAddToTripErrorNotice(location.url);
    const tripId = parseAddToTripContextTripId(
      location.url.searchParams.get("trip"),
    );

    return (
      <div class="mt-6">
        {feedback ? (
          <AsyncStateNotice
            state="failed"
            title={feedback.title}
            message={feedback.message}
            class="mb-4"
          />
        ) : null}

        <form method="post" action={props.cta.canonicalPath}>
          <input type="hidden" name="intent" value="add-to-trip" />
          {tripId ? <input type="hidden" name="tripId" value={tripId} /> : null}
          <button
            type="submit"
            disabled={props.cta.disabled}
            data-bookable-vertical={props.vertical}
            data-bookable-inventory-id={props.cta.inventoryId}
            data-bookable-canonical-path={props.cta.canonicalPath}
            class="t-btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.cta.label}
          </button>
        </form>

        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.cta.note}
        </p>
      </div>
    );
  },
);

type BookableEntityAddToTripFormProps = {
  cta: BookableEntityAddToTripCta;
  vertical: BookableVertical;
};
