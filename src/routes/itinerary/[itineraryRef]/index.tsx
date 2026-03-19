import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { getItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";
import { ItineraryAccessDenied } from "~/components/itinerary/ItineraryAccessDenied";
import { ItineraryLoading } from "~/components/itinerary/ItineraryLoading";
import { ItineraryPageShell } from "~/components/itinerary/ItineraryPageShell";
import { Page } from "~/components/site/Page";
import { buildItineraryDetail } from "~/lib/itinerary/buildItineraryDetail";
import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { canAccessItinerary } from "~/lib/ownership/canAccessItinerary";
import { getCurrentOwnershipContext } from "~/lib/ownership/getCurrentOwnershipContext";
import { getOwnershipDisplayState } from "~/lib/ownership/getOwnershipDisplayState";
import { resolveItineraryAccess } from "~/lib/ownership/resolveItineraryAccess";
import {
  attachAnonymousItinerariesToCurrentUser,
  claimItineraryOwnership,
} from "~/routes/itinerary/actions";
import { ITINERARY_REF_PATTERN } from "~/types/itinerary";

type ItineraryClaimNotice = {
  code: string;
  message: string;
  tone: "success" | "warning" | "error" | "info";
};

const readClaimNotice = (url: URL): ItineraryClaimNotice | null => {
  const code = String(url.searchParams.get("claim_code") || "").trim();
  const message = String(url.searchParams.get("claim_message") || "").trim();
  const tone = String(url.searchParams.get("claim_tone") || "").trim();

  if (!code || !message) return null;

  return {
    code,
    message,
    tone:
      tone === "success" || tone === "warning" || tone === "error" || tone === "info"
        ? tone
        : "info",
  };
};

const readResumeClaimNotice = (
  url: URL,
  input: {
    isClaimable: boolean;
    hasCurrentUser: boolean;
  },
): ItineraryClaimNotice | null => {
  const resumeMode = String(url.searchParams.get("resume") || "")
    .trim()
    .toLowerCase();

  if (resumeMode !== "claim" || !input.isClaimable) return null;

  return {
    code: "RESUME_CLAIM",
    tone: "warning",
    message: input.hasCurrentUser
      ? "This itinerary is claimable. Attach it to your account to preserve post-booking ownership."
      : "This itinerary is claimable. Sign in to attach it to your account.",
  };
};

const buildItineraryPageHref = (
  pathname: string,
  sourceUrl: URL,
  options: {
    claimNotice?: ItineraryClaimNotice | null;
  } = {},
) => {
  const params = new URLSearchParams(sourceUrl.search);
  params.delete("claim_code");
  params.delete("claim_message");
  params.delete("claim_tone");

  if (options.claimNotice) {
    params.set("claim_code", options.claimNotice.code);
    params.set("claim_message", options.claimNotice.message);
    params.set("claim_tone", options.claimNotice.tone);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onPost: RequestHandler = async ({
  params,
  request,
  redirect,
  cookie,
  sharedMap,
  url,
}) => {
  const itineraryRef = String(params.itineraryRef || "")
    .trim()
    .toUpperCase();
  const formData = await request.formData().catch(() => null);
  const intent = String(formData?.get("intent") || "").trim();

  if (intent === "claim-itinerary" && itineraryRef) {
    const result = await claimItineraryOwnership(itineraryRef, {
      cookie,
      request,
      sharedMap,
      url,
    });

    throw redirect(
      303,
      buildItineraryPageHref(`/itinerary/${itineraryRef}`, url, {
        claimNotice: {
          code: result.reasonCode,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  throw redirect(
    303,
    buildItineraryPageHref(`/itinerary/${itineraryRef}`, url),
  );
};

export const useItineraryPage = routeLoader$(async ({
  params,
  status,
  cookie,
  request,
  sharedMap,
  url,
}) => {
  const itineraryRef = String(params.itineraryRef || "")
    .trim()
    .toUpperCase();

  if (!itineraryRef || !ITINERARY_REF_PATTERN.test(itineraryRef)) {
    status(400);
    return {
      kind: "invalid_ref",
      itineraryRef: itineraryRef || "(empty)",
    } as const;
  }

  const context = getCurrentOwnershipContext({
    cookie,
    request,
    sharedMap,
    url,
  });

  if (context.ownerUserId) {
    await attachAnonymousItinerariesToCurrentUser({
      cookie,
      request,
      sharedMap,
      url,
    });
  }

  const itinerary = await getItineraryByPublicRef(itineraryRef);
  if (!itinerary) {
    status(404);
    return {
      kind: "not_found",
      itineraryRef,
    } as const;
  }

  const access = await resolveItineraryAccess(
    itineraryRef,
    getCurrentOwnershipContext({
      cookie,
      request,
      sharedMap,
      url,
    }),
  );
  const displayState = getOwnershipDisplayState(access, {
    hasCurrentUser: Boolean(context.ownerUserId),
    surface: "itinerary",
  });

  if (!canAccessItinerary(access)) {
    status(403);
    return {
      kind: "denied",
      itineraryRef,
      displayState,
    } as const;
  }

  const detail = buildItineraryDetail(itinerary, {
    access,
    hasCurrentUser: Boolean(context.ownerUserId),
  });
  const model = getItineraryPageModel(detail, {
    hasCurrentUser: Boolean(context.ownerUserId),
    ownershipDisplayState: displayState,
    claimNotice:
      readClaimNotice(url) ||
      readResumeClaimNotice(url, {
        isClaimable: access.isClaimable,
        hasCurrentUser: Boolean(context.ownerUserId),
      }),
    previewOnly: !access.isOwner,
  });

  return {
    kind: "loaded",
    model,
  } as const;
});

export default component$(() => {
  const data = useItineraryPage().value;
  const location = useLocation();
  const pendingRef = String(location.params.itineraryRef || "")
    .trim()
    .toUpperCase();

  if (location.isNavigating) {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Itinerary" },
          { label: pendingRef || "Loading" },
        ]}
      >
        <ItineraryLoading />
      </Page>
    );
  }

  if (data.kind === "loaded") {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          ...(data.model.tripHref
            ? [
                {
                  label: "Trips",
                  href: "/trips",
                },
              ]
            : []),
          ...(data.model.tripHref
            ? [
                {
                  label: "Trip",
                  href: data.model.tripHref,
                },
              ]
            : []),
          { label: data.model.itineraryRef },
        ]}
      >
        <ItineraryPageShell model={data.model} />
      </Page>
    );
  }

  if (data.kind === "denied") {
    return (
      <Page
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Itinerary" }]}
      >
        <ItineraryAccessDenied message={data.displayState.message} />
      </Page>
    );
  }

  return (
    <Page
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Itinerary" }]}
    >
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          Itinerary unavailable
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {data.kind === "invalid_ref"
            ? `The itinerary reference "${data.itineraryRef}" is not valid.`
            : `Itinerary ${data.itineraryRef} could not be found.`}
        </p>
      </section>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useItineraryPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    return {
      title: `${data.model.itineraryRef} | Saved itinerary | Andacity`,
      meta: [
        {
          name: "description",
          content: `View saved itinerary ${data.model.itineraryRef} with ownership-aware access controls and persisted booking details.`,
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  return {
    title: "Itinerary unavailable | Andacity",
    meta: [
      {
        name: "description",
        content: "The requested itinerary could not be loaded.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
