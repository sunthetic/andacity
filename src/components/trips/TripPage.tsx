import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { TripEmptyState } from "~/components/trips/TripEmptyState";
import { TripItemGroup } from "~/components/trips/TripItemGroup";
import { TripSummary } from "~/components/trips/TripSummary";
import { readAddToTripSuccessNotice } from "~/lib/trips/add-to-trip-feedback";
import type { TripPageModel } from "~/lib/trips/trip-page-model";

export const TripPage = component$((props: { trip: TripPageModel }) => {
  const { trip } = props;
  const location = useLocation();
  const addToTripSuccess = readAddToTripSuccessNotice(location.url);

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        { label: trip.summary.reference },
      ]}
    >
      <div class="space-y-6">
        {addToTripSuccess ? (
          <div
            class="rounded-[var(--radius-xl)] border border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)] px-4 py-3 shadow-[var(--shadow-sm)]"
            role="status"
            aria-live="polite"
          >
            <p class="text-sm font-semibold text-[color:#166534]">
              {addToTripSuccess.title}
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {addToTripSuccess.message}
            </p>
          </div>
        ) : null}
        <TripSummary summary={trip.summary} />
        {trip.isEmpty ? (
          <TripEmptyState continueHref={trip.summary.continueHref} />
        ) : (
          trip.groups.map((group) => (
            <TripItemGroup key={group.itemType} group={group} />
          ))
        )}
      </div>
    </Page>
  );
});
