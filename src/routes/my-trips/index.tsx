import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { MyTripsAccessFallback } from "~/components/my-trips/MyTripsAccessFallback";
import { MyTripsLoading } from "~/components/my-trips/MyTripsLoading";
import { MyTripsPageShell } from "~/components/my-trips/MyTripsPageShell";
import { Page } from "~/components/site/Page";
import { getOwnedItinerarySummaries } from "~/fns/itinerary/getOwnedItinerarySummaries";
import { getMyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";
import { getCurrentOwnershipContext } from "~/lib/ownership/getCurrentOwnershipContext";
import { attachAnonymousItinerariesToCurrentUser } from "~/routes/itinerary/actions";

type MyTripsPageData =
  | {
      kind: "loaded";
      model: ReturnType<typeof getMyTripsPageModel>;
    }
  | {
      kind: "access_unavailable";
      message: string;
    };

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useMyTripsPage = routeLoader$(async (event) => {
  const initialContext = getCurrentOwnershipContext(event, {
    ensureAnonymousSession: true,
  });

  if (initialContext.ownerUserId) {
    await attachAnonymousItinerariesToCurrentUser(event);
  }

  const ownershipContext = getCurrentOwnershipContext(event, {
    ensureAnonymousSession: true,
  });

  if (!ownershipContext.ownerUserId && !ownershipContext.ownerSessionId) {
    return {
      kind: "access_unavailable",
      message:
        "We could not determine an account or anonymous ownership session for this request.",
    } satisfies MyTripsPageData;
  }

  const summaries = await getOwnedItinerarySummaries({
    ownershipContext,
  });

  return {
    kind: "loaded",
    model: getMyTripsPageModel({
      ownershipContext,
      summaries,
      url: event.url,
      now: new Date(),
    }),
  } satisfies MyTripsPageData;
});

export default component$(() => {
  const data = useMyTripsPage().value;
  const location = useLocation();

  if (location.isNavigating) {
    return (
      <Page breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Trips" }]}>
        <MyTripsLoading />
      </Page>
    );
  }

  return (
    <Page breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Trips" }]}>
      {data.kind === "loaded" ? (
        <MyTripsPageShell model={data.model} />
      ) : (
        <MyTripsAccessFallback message={data.message} />
      )}
    </Page>
  );
});

export const head: DocumentHead = ({ url }) => {
  const canonicalHref = new URL(url.pathname, url.origin).href;

  return {
    title: "My Trips | Andacity",
    meta: [
      {
        name: "description",
        content:
          "Reopen owned itineraries from your account or current anonymous session.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
