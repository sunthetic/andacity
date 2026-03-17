import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { TripErrorState } from "~/components/trips/TripErrorState";
import { TripNotFoundState } from "~/components/trips/TripNotFoundState";
import { TripPage } from "~/components/trips/TripPage";
import { parseTripIdParam } from "~/lib/queries/trips.server";
import { getTripDetails, TripRepoError } from "~/lib/repos/trips-repo.server";
import {
  mapTripDetailsToTripPageModel,
  type TripPageModel,
} from "~/lib/trips/trip-page-model";

type TripPageRouteData =
  | {
      kind: "loaded";
      trip: TripPageModel;
    }
  | {
      kind: "invalid_id";
      tripIdParam: string;
    }
  | {
      kind: "not_found";
      tripId: number;
    }
  | {
      kind: "error";
      title: string;
      message: string;
    };

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useTripPage = routeLoader$(async ({ params, status }) => {
  const tripIdParam = String(params.tripId || "").trim();
  const tripId = parseTripIdParam(params.tripId);

  if (!tripId) {
    status(400);
    return {
      kind: "invalid_id",
      tripIdParam,
    } satisfies TripPageRouteData;
  }

  try {
    const trip = await getTripDetails(tripId);
    if (!trip) {
      status(404);
      return {
        kind: "not_found",
        tripId,
      } satisfies TripPageRouteData;
    }

    return {
      kind: "loaded",
      trip: mapTripDetailsToTripPageModel(trip),
    } satisfies TripPageRouteData;
  } catch (error) {
    if (error instanceof TripRepoError) {
      if (error.code === "trip_not_found") {
        status(404);
        return {
          kind: "not_found",
          tripId,
        } satisfies TripPageRouteData;
      }

      status(
        error.code === "trip_schema_missing" ||
          error.code === "trip_runtime_stale"
          ? 503
          : 400,
      );
      return {
        kind: "error",
        title:
          error.code === "trip_schema_missing" ||
          error.code === "trip_runtime_stale"
            ? "Trip persistence is not ready"
            : "Trip retrieval failed",
        message: error.message,
      } satisfies TripPageRouteData;
    }

    status(500);
    return {
      kind: "error",
      title: "Trip retrieval failed",
      message: error instanceof Error ? error.message : "Failed to load trip.",
    } satisfies TripPageRouteData;
  }
});

export default component$(() => {
  const data = useTripPage().value;
  const location = useLocation();

  if (data.kind === "loaded") {
    return <TripPage trip={data.trip} />;
  }

  if (data.kind === "invalid_id") {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Trips", href: "/trips" },
          { label: "Invalid trip" },
        ]}
      >
        <TripNotFoundState
          title="Trip link is invalid"
          message={`The trip id "${data.tripIdParam || "(empty)"}" is not a valid persisted trip reference.`}
        />
      </Page>
    );
  }

  if (data.kind === "not_found") {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Trips", href: "/trips" },
          { label: "Trip not found" },
        ]}
      >
        <TripNotFoundState
          title="Trip not found"
          message={`Trip ${data.tripId} does not exist in persisted storage or is no longer available.`}
        />
      </Page>
    );
  }

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        { label: "Trip unavailable" },
      ]}
    >
      <TripErrorState
        title={data.title}
        message={data.message}
        retryHref={location.url.pathname + location.url.search}
      />
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useTripPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    const title = `${data.trip.summary.name} · ${data.trip.summary.reference} | Andacity`;
    const description = data.trip.isEmpty
      ? `View persisted trip ${data.trip.summary.reference} and its empty saved itinerary state in Andacity.`
      : `View persisted trip ${data.trip.summary.reference} with grouped saved flights, hotels, and cars in Andacity.`;

    return {
      title,
      meta: [
        { name: "description", content: description },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalHref },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  const title =
    data.kind === "invalid_id"
      ? "Invalid trip link | Andacity"
      : data.kind === "not_found"
        ? "Trip not found | Andacity"
        : "Trip unavailable | Andacity";
  const description =
    data.kind === "invalid_id"
      ? "The requested trip URL does not include a valid persisted trip id."
      : data.kind === "not_found"
        ? "The requested persisted trip could not be found."
        : "The persisted trip could not be loaded right now.";

  return {
    title,
    meta: [
      { name: "description", content: description },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
