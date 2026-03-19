import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { ConfirmationLoading } from "~/components/confirmation/ConfirmationLoading";
import { ConfirmationNotFound } from "~/components/confirmation/ConfirmationNotFound";
import { ConfirmationPageShell } from "~/components/confirmation/ConfirmationPageShell";
import { Page } from "~/components/site/Page";
import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { getBookingConfirmationByPublicRef } from "~/lib/confirmation/getBookingConfirmationByPublicRef";
import { getConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";
import { createOrResumeItineraryFromConfirmation } from "~/lib/itinerary/createOrResumeItineraryFromConfirmation";

const CONFIRMATION_REF_PATTERN = /^CNF-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

type ConfirmationPageData =
  | {
      kind: "loaded";
      model: ReturnType<typeof getConfirmationPageModel>;
    }
  | {
      kind: "invalid_ref";
      confirmationRef: string;
    }
  | {
      kind: "not_found";
      confirmationRef: string;
    }
  | {
      kind: "unavailable";
      confirmationRef: string;
      tripId: number | null;
    };

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useConfirmationPage = routeLoader$(async ({ params, status }) => {
  const confirmationRef = String(params.confirmationRef || "")
    .trim()
    .toUpperCase();

  if (!confirmationRef || !CONFIRMATION_REF_PATTERN.test(confirmationRef)) {
    status(400);
    return {
      kind: "invalid_ref",
      confirmationRef: confirmationRef || "(empty)",
    } satisfies ConfirmationPageData;
  }

  try {
    const confirmation =
      await getBookingConfirmationByPublicRef(confirmationRef);
    if (!confirmation) {
      status(404);
      return {
        kind: "not_found",
        confirmationRef,
      } satisfies ConfirmationPageData;
    }

    try {
      if (!confirmation.summaryJson?.hasItinerary) {
        try {
          await createOrResumeItineraryFromConfirmation(confirmation.id, {
            now: new Date(),
          });
        } catch {
          // Keep the confirmation page available even if itinerary promotion fails.
        }
      }

      const hydratedConfirmation =
        (await getBookingConfirmation(confirmation.id)) || confirmation;

      return {
        kind: "loaded",
        model: getConfirmationPageModel(hydratedConfirmation),
      } satisfies ConfirmationPageData;
    } catch {
      status(500);
      return {
        kind: "unavailable",
        confirmationRef,
        tripId: confirmation.tripId,
      } satisfies ConfirmationPageData;
    }
  } catch {
    status(500);
    return {
      kind: "unavailable",
      confirmationRef,
      tripId: null,
    } satisfies ConfirmationPageData;
  }
});

export default component$(() => {
  const data = useConfirmationPage().value;
  const location = useLocation();
  const pendingRef = String(location.params.confirmationRef || "")
    .trim()
    .toUpperCase();

  if (location.isNavigating) {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Confirmation" },
          { label: pendingRef || "Loading" },
        ]}
      >
        <ConfirmationLoading />
      </Page>
    );
  }

  if (data.kind === "loaded") {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Trips", href: "/trips" },
          { label: data.model.tripReference, href: data.model.tripHref },
          { label: data.model.confirmationRef },
        ]}
      >
        <ConfirmationPageShell model={data.model} />
      </Page>
    );
  }

  if (data.kind === "invalid_ref") {
    return (
      <Page
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Confirmation" }]}
      >
        <ConfirmationNotFound
          message={`The confirmation reference "${data.confirmationRef}" is not valid.`}
        />
      </Page>
    );
  }

  if (data.kind === "unavailable") {
    return (
      <Page
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Confirmation" }]}
      >
        <ConfirmationNotFound
          title="This confirmation is unavailable"
          message="We found this confirmation reference, but its saved details could not be loaded safely right now."
          primaryHref={data.tripId ? `/trips/${data.tripId}` : "/trips"}
          primaryLabel="Go to trip"
        />
      </Page>
    );
  }

  return (
    <Page
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Confirmation" }]}
    >
      <ConfirmationNotFound
        message={`Confirmation ${data.confirmationRef} does not exist or is no longer available.`}
      />
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useConfirmationPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    return {
      title: `${data.model.confirmationRef} | Booking confirmation | Andacity`,
      meta: [
        {
          name: "description",
          content: `View booking confirmation ${data.model.confirmationRef} for ${data.model.tripReference}.`,
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  return {
    title:
      data.kind === "invalid_ref"
        ? "Invalid confirmation link | Andacity"
        : "Confirmation unavailable | Andacity",
    meta: [
      {
        name: "description",
        content:
          data.kind === "invalid_ref"
            ? "The requested confirmation reference is not valid."
            : "The requested confirmation could not be loaded.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
