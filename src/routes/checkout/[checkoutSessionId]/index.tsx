import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CheckoutShell } from "~/components/checkout/CheckoutShell";
import { Page } from "~/components/site/Page";
import { getBookingSummary } from "~/lib/booking/getBookingSummary";
import { refreshBookingRunStatus } from "~/lib/booking/refreshBookingRunStatus";
import { getBookingConfirmationForBookingRun } from "~/lib/confirmation/getBookingConfirmationForBookingRun";
import { getCheckoutSessionSummary } from "~/lib/checkout/getCheckoutSessionSummary";
import {
  getCheckoutSession,
  CheckoutSessionError,
} from "~/lib/checkout/getCheckoutSession";
import { getActiveCheckoutPaymentSession } from "~/lib/payments/getActiveCheckoutPaymentSession";
import { getCheckoutPaymentSummary } from "~/lib/payments/getCheckoutPaymentSummary";
import { refreshCheckoutPaymentStatus } from "~/lib/payments/refreshCheckoutPaymentStatus";
import { shouldCheckoutSessionRevalidate } from "~/lib/checkout/shouldCheckoutSessionRevalidate";
import { getCheckoutTravelerPageModel } from "~/fns/travelers/getCheckoutTravelerPageModel";
import { attachCheckoutTravelerState } from "~/fns/travelers/attachCheckoutTravelerState";
import type { CheckoutSessionEntryMode } from "~/types/checkout";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { BookingConfirmation } from "~/types/confirmation";
import type { CheckoutPaymentSummary } from "~/types/payment";
import {
  cancelCheckoutPayment,
  createBookingConfirmationFromCheckout,
  createCheckoutPaymentIntent,
  executeCheckoutBooking,
  saveCheckoutTravelerProfile,
  assignCheckoutTravelerToItem,
  removeCheckoutTravelerProfile,
  validateCheckoutTravelersAction,
  refreshBookingConfirmation,
  refreshBookingRun,
  refreshCheckoutPaymentSession,
  runCheckoutRevalidation,
} from "~/routes/checkout/actions";

const readEntryMode = (
  value: string | null | undefined,
): CheckoutSessionEntryMode | null => {
  if (value !== "created" && value !== "resumed") return null;
  return value;
};

const readPaymentNotice = (url: URL) => {
  const code = String(url.searchParams.get("payment_code") || "").trim();
  const message = String(url.searchParams.get("payment_message") || "").trim();
  const tone = String(url.searchParams.get("payment_tone") || "").trim();
  if (!code || !message) return null;

  return {
    code,
    message,
    tone:
      tone === "success" || tone === "error" || tone === "info" ? tone : "info",
  } as const;
};

const readBookingNotice = (url: URL) => {
  const code = String(url.searchParams.get("booking_code") || "").trim();
  const message = String(url.searchParams.get("booking_message") || "").trim();
  const tone = String(url.searchParams.get("booking_tone") || "").trim();
  if (!code || !message) return null;

  return {
    code,
    message,
    tone:
      tone === "success" || tone === "error" || tone === "info" ? tone : "info",
  } as const;
};

const readConfirmationNotice = (url: URL) => {
  const code = String(url.searchParams.get("confirmation_code") || "").trim();
  const message = String(
    url.searchParams.get("confirmation_message") || "",
  ).trim();
  const tone = String(url.searchParams.get("confirmation_tone") || "").trim();
  if (!code || !message) return null;

  return {
    code,
    message,
    tone:
      tone === "success" || tone === "error" || tone === "info" ? tone : "info",
  } as const;
};

const readTravelerNotice = (url: URL) => {
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

const buildCheckoutPageHref = (
  pathname: string,
  sourceUrl: URL,
  notices: {
    paymentNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    bookingNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    confirmationNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    travelerNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  } = {},
) => {
  const params = new URLSearchParams(sourceUrl.search);
  params.delete("payment_code");
  params.delete("payment_message");
  params.delete("payment_tone");
  params.delete("booking_code");
  params.delete("booking_message");
  params.delete("booking_tone");
  params.delete("confirmation_code");
  params.delete("confirmation_message");
  params.delete("confirmation_tone");
  params.delete("traveler_code");
  params.delete("traveler_message");
  params.delete("traveler_tone");

  if (notices.paymentNotice) {
    params.set("payment_code", notices.paymentNotice.code);
    params.set("payment_message", notices.paymentNotice.message);
    params.set("payment_tone", notices.paymentNotice.tone);
  }

  if (notices.bookingNotice) {
    params.set("booking_code", notices.bookingNotice.code);
    params.set("booking_message", notices.bookingNotice.message);
    params.set("booking_tone", notices.bookingNotice.tone);
  }

  if (notices.confirmationNotice) {
    params.set("confirmation_code", notices.confirmationNotice.code);
    params.set("confirmation_message", notices.confirmationNotice.message);
    params.set("confirmation_tone", notices.confirmationNotice.tone);
  }

  if (notices.travelerNotice) {
    params.set("traveler_code", notices.travelerNotice.code);
    params.set("traveler_message", notices.travelerNotice.message);
    params.set("traveler_tone", notices.travelerNotice.tone);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

type CheckoutSessionRouteData =
  | {
      kind: "loaded";
      session: Awaited<
        ReturnType<typeof getCheckoutSessionSummary>
      > extends never
        ? never
        : NonNullable<Awaited<ReturnType<typeof getCheckoutSession>>>;
      entryMode: CheckoutSessionEntryMode | null;
      paymentSummary: CheckoutPaymentSummary;
      paymentNotice: {
        code: string;
        message: string;
        tone: "info" | "success" | "error";
      } | null;
      bookingSummary: CheckoutBookingSummary;
      bookingNotice: {
        code: string;
        message: string;
        tone: "info" | "success" | "error";
      } | null;
      confirmation: BookingConfirmation | null;
      confirmationNotice: {
        code: string;
        message: string;
        tone: "info" | "success" | "error";
      } | null;
      travelerPageModel: Awaited<ReturnType<typeof getCheckoutTravelerPageModel>>;
      travelerNotice: {
        code: string;
        message: string;
        tone: "info" | "success" | "error";
      } | null;
    }
  | {
      kind: "not_found";
      checkoutSessionId: string;
    }
  | {
      kind: "error";
      title: string;
      message: string;
    };

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onPost: RequestHandler = async ({
  params,
  request,
  redirect,
  url,
}) => {
  const checkoutSessionId = String(params.checkoutSessionId || "").trim();
  const formData = await request.formData().catch(() => null);
  const intent = String(formData?.get("intent") || "").trim();

  if (checkoutSessionId && intent === "revalidate") {
    await runCheckoutRevalidation(checkoutSessionId);
    throw redirect(303, buildCheckoutPageHref(url.pathname, url));
  }

  if (checkoutSessionId && intent === "create-payment") {
    const result = await createCheckoutPaymentIntent(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        paymentNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "cancel-payment") {
    const result = await cancelCheckoutPayment(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        paymentNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "refresh-payment") {
    const result = await refreshCheckoutPaymentSession(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        paymentNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "info" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "execute-booking") {
    const result = await executeCheckoutBooking(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        bookingNotice: {
          code: result.code,
          message: result.message,
          tone:
            result.code === "BOOKING_SUCCEEDED"
              ? "success"
              : result.ok
                ? "info"
                : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "refresh-booking") {
    const result = await refreshBookingRun(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        bookingNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "info" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "create-confirmation") {
    const result =
      await createBookingConfirmationFromCheckout(checkoutSessionId);

    if (result.ok && result.redirectTo) {
      throw redirect(303, result.redirectTo);
    }

    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        confirmationNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok
            ? result.code === "CONFIRMATION_CREATED"
              ? "success"
              : "info"
            : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "refresh-confirmation") {
    const result = await refreshBookingConfirmation(checkoutSessionId);
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        confirmationNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "info" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "save-traveler-profile") {
    const result = await saveCheckoutTravelerProfile({
      checkoutSessionId,
      profile: {
        id: String(formData?.get("travelerProfileId") || "").trim() || null,
        type: String(formData?.get("type") || "").trim() || null,
        role: String(formData?.get("role") || "").trim() || null,
        firstName: String(formData?.get("firstName") || "").trim() || null,
        middleName: String(formData?.get("middleName") || "").trim() || null,
        lastName: String(formData?.get("lastName") || "").trim() || null,
        dateOfBirth:
          String(formData?.get("dateOfBirth") || "").trim() || null,
        email: String(formData?.get("email") || "").trim() || null,
        phone: String(formData?.get("phone") || "").trim() || null,
        nationality: String(formData?.get("nationality") || "").trim() || null,
        documentType:
          String(formData?.get("documentType") || "").trim() || null,
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
      },
    });
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        travelerNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "assign-traveler") {
    const result = await assignCheckoutTravelerToItem({
      checkoutSessionId,
      assignment: {
        id: String(formData?.get("travelerAssignmentId") || "").trim() || null,
        checkoutItemKey:
          String(formData?.get("checkoutItemKey") || "").trim() || null,
        travelerProfileId: String(formData?.get("travelerProfileId") || "").trim(),
        role: String(formData?.get("role") || "").trim() || null,
        isPrimary: (formData?.getAll("isPrimary") || []).some(
          (value) => String(value || "").trim() === "true",
        ),
      },
    });
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        travelerNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "remove-traveler-profile") {
    const travelerProfileId = String(formData?.get("travelerProfileId") || "").trim();
    const result = await removeCheckoutTravelerProfile({
      checkoutSessionId,
      travelerProfileId,
    });
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        travelerNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  if (checkoutSessionId && intent === "validate-travelers") {
    const result = await validateCheckoutTravelersAction({
      checkoutSessionId,
    });
    throw redirect(
      303,
      buildCheckoutPageHref(url.pathname, url, {
        travelerNotice: {
          code: result.code,
          message: result.message,
          tone: result.ok ? "success" : "error",
        },
      }),
    );
  }

  throw redirect(303, buildCheckoutPageHref(url.pathname, url));
};

export const useCheckoutSessionPage = routeLoader$(
  async ({ params, status, url }) => {
    const checkoutSessionId = String(params.checkoutSessionId || "").trim();
    if (!checkoutSessionId) {
      status(404);
      return {
        kind: "not_found",
        checkoutSessionId: "(empty)",
      } satisfies CheckoutSessionRouteData;
    }

    try {
      let session = await getCheckoutSession(checkoutSessionId, {
        includeTerminal: true,
      });
      if (!session) {
        status(404);
        return {
          kind: "not_found",
          checkoutSessionId,
        } satisfies CheckoutSessionRouteData;
      }

      if (shouldCheckoutSessionRevalidate(session)) {
        const revalidation = await runCheckoutRevalidation(checkoutSessionId);
        if (revalidation.code !== "CHECKOUT_NOT_FOUND") {
          const refreshed = await getCheckoutSession(checkoutSessionId, {
            includeTerminal: true,
          });
          if (refreshed) {
            session = refreshed;
          }
        }
      }

      const activePaymentSession = await getActiveCheckoutPaymentSession(
        checkoutSessionId,
        { now: new Date() },
      );
      if (activePaymentSession) {
        try {
          await refreshCheckoutPaymentStatus(activePaymentSession.id, {
            now: new Date(),
          });
        } catch {
          // Keep checkout available even when provider status refresh fails.
        }
      }

      const refreshedSession = await getCheckoutSession(checkoutSessionId, {
        includeTerminal: true,
      });
      if (refreshedSession) {
        session = refreshedSession;
      }
      const sessionWithTravelers = await attachCheckoutTravelerState(session);
      const paymentSummary = await getCheckoutPaymentSummary(sessionWithTravelers, {
        now: new Date(),
      });
      await refreshBookingRunStatus(checkoutSessionId, {
        now: new Date(),
      }).catch(() => null);
      const bookingSummary = await getBookingSummary(checkoutSessionId, {
        now: new Date(),
      });
      const confirmation = bookingSummary.run
        ? await getBookingConfirmationForBookingRun(bookingSummary.run.id)
        : null;
      const travelerPageModel =
        await getCheckoutTravelerPageModel(sessionWithTravelers);

      return {
        kind: "loaded",
        session: sessionWithTravelers,
        entryMode: readEntryMode(url.searchParams.get("entry")),
        paymentSummary,
        paymentNotice: readPaymentNotice(url),
        bookingSummary,
        bookingNotice: readBookingNotice(url),
        confirmation,
        confirmationNotice: readConfirmationNotice(url),
        travelerPageModel,
        travelerNotice: readTravelerNotice(url),
      } satisfies CheckoutSessionRouteData;
    } catch (error) {
      if (error instanceof CheckoutSessionError) {
        status(error.code === "checkout_schema_missing" ? 503 : 400);
        return {
          kind: "error",
          title:
            error.code === "checkout_schema_missing"
              ? "Checkout persistence is not ready"
              : "Checkout retrieval failed",
          message: error.message,
        } satisfies CheckoutSessionRouteData;
      }

      status(500);
      return {
        kind: "error",
        title: "Checkout retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load the checkout session.",
      } satisfies CheckoutSessionRouteData;
    }
  },
);

export default component$(() => {
  const data = useCheckoutSessionPage().value;

  if (data.kind === "loaded") {
    const summary = getCheckoutSessionSummary(data.session, {
      entryMode: data.entryMode,
      bookingSummary: data.bookingSummary,
      confirmation: data.confirmation,
      travelerValidationSummary: data.travelerPageModel.validationSummary,
      hasCompleteTravelerDetails: data.travelerPageModel.hasCompleteTravelerDetails,
    });
    return (
      <CheckoutShell
        session={data.session}
        summary={summary}
        paymentSummary={data.paymentSummary}
        paymentNotice={data.paymentNotice}
        bookingSummary={data.bookingSummary}
        bookingNotice={data.bookingNotice}
        confirmation={data.confirmation}
        confirmationNotice={data.confirmationNotice}
        travelerPageModel={data.travelerPageModel}
        travelerNotice={data.travelerNotice}
      />
    );
  }

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        { label: "Checkout" },
      ]}
    >
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          Checkout session
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {data.kind === "not_found"
            ? "Checkout session not found"
            : data.title}
        </h1>
        <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
          {data.kind === "not_found"
            ? `Checkout session ${data.checkoutSessionId} does not exist or is no longer available.`
            : data.message}
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href="/trips"
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Back to trips
          </a>
        </div>
      </section>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useCheckoutSessionPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    const summary = getCheckoutSessionSummary(data.session, {
      entryMode: data.entryMode,
      bookingSummary: data.bookingSummary,
      confirmation: data.confirmation,
      travelerValidationSummary: data.travelerPageModel.validationSummary,
      hasCompleteTravelerDetails: data.travelerPageModel.hasCompleteTravelerDetails,
    });
    const title = `${summary.tripReference} checkout | Andacity`;
    return {
      title,
      meta: [
        {
          name: "description",
          content: `Resume persisted checkout session ${summary.shortId} for ${summary.tripReference}.`,
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  return {
    title: "Checkout unavailable | Andacity",
    meta: [
      {
        name: "description",
        content: "The requested checkout session could not be loaded.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
