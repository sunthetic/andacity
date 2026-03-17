import { component$ } from "@builder.io/qwik";
import { Page } from "~/components/site/Page";
import { TripEmptyState } from "~/components/trips/TripEmptyState";
import { TripItemGroup } from "~/components/trips/TripItemGroup";
import { TripSummary } from "~/components/trips/TripSummary";
import type { TripPageModel } from "~/lib/trips/trip-page-model";

export const TripPage = component$((props: { trip: TripPageModel }) => {
  const { trip } = props;

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        { label: trip.summary.reference },
      ]}
    >
      <div class="space-y-6">
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
