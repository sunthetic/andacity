import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CheckoutShell } from "~/components/checkout/CheckoutShell";
import { Page } from "~/components/site/Page";
import { getCheckoutSessionSummary } from "~/lib/checkout/getCheckoutSessionSummary";
import {
  getCheckoutSession,
  CheckoutSessionError,
} from "~/lib/checkout/getCheckoutSession";
import { shouldCheckoutSessionRevalidate } from "~/lib/checkout/shouldCheckoutSessionRevalidate";
import type { CheckoutSessionEntryMode } from "~/types/checkout";
import { runCheckoutRevalidation } from "~/routes/checkout/actions";

const readEntryMode = (
  value: string | null | undefined,
): CheckoutSessionEntryMode | null => {
  if (value !== "created" && value !== "resumed") return null;
  return value;
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
  }

  throw redirect(303, `${url.pathname}${url.search}`);
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

      return {
        kind: "loaded",
        session,
        entryMode: readEntryMode(url.searchParams.get("entry")),
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
    });
    return <CheckoutShell session={data.session} summary={summary} />;
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
