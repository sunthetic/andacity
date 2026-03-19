import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { MyTripsAccessFallback } from "~/components/my-trips/MyTripsAccessFallback";
import { Page } from "~/components/site/Page";
import { SavedTravelersPageShell } from "~/components/travelers/SavedTravelersPageShell";
import {
  getSavedTravelersPageModel,
  type SavedTravelersPageModel,
} from "~/fns/saved-travelers/getSavedTravelersPageModel";
import { getCurrentOwnershipContext } from "~/lib/ownership/getCurrentOwnershipContext";
import { TRAVELER_DOCUMENT_TYPES, TRAVELER_TYPES } from "~/types/travelers";
import {
  archiveSavedTravelerProfileAction,
  createSavedTravelerProfileAction,
  setDefaultSavedTravelerProfileAction,
  updateSavedTravelerProfileAction,
} from "~/routes/travelers/actions";

type SavedTravelersRouteData =
  | {
      kind: "loaded";
      model: SavedTravelersPageModel;
      notice: {
        code: string;
        message: string;
        tone: "info" | "success" | "error";
      } | null;
    }
  | {
      kind: "access_unavailable";
      message: string;
    };

const readNotice = (url: URL) => {
  const code = String(url.searchParams.get("traveler_code") || "").trim();
  const message = String(url.searchParams.get("traveler_message") || "").trim();
  const tone = String(url.searchParams.get("traveler_tone") || "").trim();

  if (!code || !message) return null;

  return {
    code,
    message,
    tone:
      tone === "success" || tone === "error" || tone === "info" ? tone : "info",
  } as const;
};

const buildPageHref = (
  pathname: string,
  sourceUrl: URL,
  notice?: {
    code: string;
    message: string;
    tone: "info" | "success" | "error";
  } | null,
) => {
  const params = new URLSearchParams(sourceUrl.search);
  params.delete("traveler_code");
  params.delete("traveler_message");
  params.delete("traveler_tone");

  if (notice) {
    params.set("traveler_code", notice.code);
    params.set("traveler_message", notice.message);
    params.set("traveler_tone", notice.tone);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const readTravelerType = (value: FormDataEntryValue | null | undefined) => {
  return TRAVELER_TYPES.includes(value as (typeof TRAVELER_TYPES)[number])
    ? (value as (typeof TRAVELER_TYPES)[number])
    : null;
};

const readTravelerDocumentType = (
  value: FormDataEntryValue | null | undefined,
) => {
  return TRAVELER_DOCUMENT_TYPES.includes(
    value as (typeof TRAVELER_DOCUMENT_TYPES)[number],
  )
    ? (value as (typeof TRAVELER_DOCUMENT_TYPES)[number])
    : null;
};

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onPost: RequestHandler = async ({
  request,
  redirect,
  url,
  cookie,
  sharedMap,
}) => {
  const formData = await request.formData().catch(() => null);
  const intent = String(formData?.get("intent") || "").trim();
  const ownershipContext = getCurrentOwnershipContext({
    cookie,
    request,
    sharedMap,
    url,
  });

  let result:
    | Awaited<ReturnType<typeof createSavedTravelerProfileAction>>
    | Awaited<ReturnType<typeof updateSavedTravelerProfileAction>>
    | Awaited<ReturnType<typeof archiveSavedTravelerProfileAction>>
    | null = null;

  if (intent === "create-saved-traveler") {
    result = await createSavedTravelerProfileAction({
      ownerUserId: ownershipContext.ownerUserId,
      payload: {
        type: readTravelerType(formData?.get("type")),
        firstName: String(formData?.get("firstName") || "").trim() || null,
        middleName: String(formData?.get("middleName") || "").trim() || null,
        lastName: String(formData?.get("lastName") || "").trim() || null,
        dateOfBirth: String(formData?.get("dateOfBirth") || "").trim() || null,
        email: String(formData?.get("email") || "").trim() || null,
        phone: String(formData?.get("phone") || "").trim() || null,
        nationality: String(formData?.get("nationality") || "").trim() || null,
        documentType: readTravelerDocumentType(formData?.get("documentType")),
        documentNumber:
          String(formData?.get("documentNumber") || "").trim() || null,
        documentExpiryDate:
          String(formData?.get("documentExpiryDate") || "").trim() || null,
        issuingCountry:
          String(formData?.get("issuingCountry") || "").trim() || null,
        knownTravelerNumber:
          String(formData?.get("knownTravelerNumber") || "").trim() || null,
        redressNumber:
          String(formData?.get("redressNumber") || "").trim() || null,
        driverAge: String(formData?.get("driverAge") || "").trim() || null,
        label: String(formData?.get("label") || "").trim() || null,
        isDefault: (formData?.getAll("isDefault") || []).some(
          (value) => String(value || "").trim() === "true",
        ),
      },
    });
  } else if (intent === "update-saved-traveler") {
    result = await updateSavedTravelerProfileAction({
      ownerUserId: ownershipContext.ownerUserId,
      savedTravelerId: String(formData?.get("savedTravelerId") || "").trim(),
      payload: {
        type: readTravelerType(formData?.get("type")),
        firstName: String(formData?.get("firstName") || "").trim() || null,
        middleName: String(formData?.get("middleName") || "").trim() || null,
        lastName: String(formData?.get("lastName") || "").trim() || null,
        dateOfBirth: String(formData?.get("dateOfBirth") || "").trim() || null,
        email: String(formData?.get("email") || "").trim() || null,
        phone: String(formData?.get("phone") || "").trim() || null,
        nationality: String(formData?.get("nationality") || "").trim() || null,
        documentType: readTravelerDocumentType(formData?.get("documentType")),
        documentNumber:
          String(formData?.get("documentNumber") || "").trim() || null,
        documentExpiryDate:
          String(formData?.get("documentExpiryDate") || "").trim() || null,
        issuingCountry:
          String(formData?.get("issuingCountry") || "").trim() || null,
        knownTravelerNumber:
          String(formData?.get("knownTravelerNumber") || "").trim() || null,
        redressNumber:
          String(formData?.get("redressNumber") || "").trim() || null,
        driverAge: String(formData?.get("driverAge") || "").trim() || null,
        label: String(formData?.get("label") || "").trim() || null,
        isDefault: (formData?.getAll("isDefault") || []).some(
          (value) => String(value || "").trim() === "true",
        ),
      },
    });
  } else if (intent === "archive-saved-traveler") {
    result = await archiveSavedTravelerProfileAction({
      ownerUserId: ownershipContext.ownerUserId,
      savedTravelerId: String(formData?.get("savedTravelerId") || "").trim(),
    });
  } else if (intent === "set-default-saved-traveler") {
    result = await setDefaultSavedTravelerProfileAction({
      ownerUserId: ownershipContext.ownerUserId,
      savedTravelerId: String(formData?.get("savedTravelerId") || "").trim(),
    });
  }

  throw redirect(
    303,
    buildPageHref(
      url.pathname,
      url,
      result
        ? {
            code: result.code,
            message: result.message,
            tone: result.ok ? "success" : "error",
          }
        : null,
    ),
  );
};

export const useSavedTravelersPage = routeLoader$(async (event) => {
  const ownershipContext = getCurrentOwnershipContext(event, {
    ensureAnonymousSession: true,
  });

  if (!ownershipContext.ownerUserId) {
    return {
      kind: "access_unavailable",
      message:
        "Saved travelers are only available when an authenticated account context is attached to this session.",
    } satisfies SavedTravelersRouteData;
  }

  return {
    kind: "loaded",
    model: await getSavedTravelersPageModel({
      ownerUserId: ownershipContext.ownerUserId,
    }),
    notice: readNotice(event.url),
  } satisfies SavedTravelersRouteData;
});

export default component$(() => {
  const data = useSavedTravelersPage().value;

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "My Trips", href: "/my-trips" },
        { label: "Saved Travelers" },
      ]}
    >
      {data.kind === "loaded" ? (
        <SavedTravelersPageShell model={data.model} notice={data.notice} />
      ) : (
        <MyTripsAccessFallback
          title="Saved travelers are unavailable"
          message={data.message}
        />
      )}
    </Page>
  );
});

export const head: DocumentHead = ({ url }) => {
  const canonicalHref = new URL(url.pathname, url.origin).href;

  return {
    title: "Saved Travelers | Andacity",
    meta: [
      {
        name: "description",
        content:
          "Manage reusable account-owned traveler profiles for future checkout reuse.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
