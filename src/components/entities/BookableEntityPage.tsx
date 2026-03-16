import { component$ } from "@builder.io/qwik";
import { Page } from "~/components/site/Page";
import {
  getBookableEntityBrowseHref,
  getBookableEntityRouteBase,
  getBookableEntitySearchHref,
  getBookableEntityVerticalLabel,
} from "~/lib/entities/routing";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";

const SINGULAR_LABELS = {
  flight: "flight",
  hotel: "hotel",
  car: "car rental",
} as const;

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const formatMoneyFromCents = (
  amountCents: number | null,
  currency: string | null,
) => {
  if (amountCents == null || !currency) return "Price updates at resolution";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  } catch {
    return `${Math.round(amountCents / 100)} ${currency}`;
  }
};

const resolvePageCopy = (page: BookableEntityPageLoadResult) => {
  const singularLabel = SINGULAR_LABELS[page.vertical];

  if (page.kind === "invalid_route") {
    return {
      badge: "Invalid route",
      title: `This ${singularLabel} URL is not canonical.`,
      description:
        "The framework caught the route before page-specific detail logic ran, so malformed entity URLs fail in one shared place.",
    };
  }

  if (page.kind === "not_found") {
    return {
      badge: "Not found",
      title: `This ${singularLabel} could not be resolved.`,
      description:
        "The route parsed correctly, but Inventory Resolver could not return a live canonical entity for the requested inventory ID.",
    };
  }

  if (page.kind === "unavailable") {
    return {
      badge: "Unavailable",
      title: `${page.entity.title} is currently unavailable.`,
      description:
        "The canonical entity resolved, but the latest inventory check says it cannot be booked right now.",
    };
  }

  if (page.kind === "revalidation_required") {
    return {
      badge: "Revalidation needed",
      title: `${page.entity.title} changed since this link was created.`,
      description:
        "The route still maps to the right vertical, but live inventory drifted away from the exact canonical inventory ID in the URL.",
    };
  }

  return {
    badge: "Entity shell",
    title: page.entity.title,
    description:
      "This shared entity shell is routed through canonical inventory identity and Inventory Resolver, ready for the vertical-specific detail pages that follow.",
  };
};

export const BookableEntityPage = component$(
  (props: BookableEntityPageProps) => {
    const page = props.page;
    const browseHref = getBookableEntityBrowseHref(page.vertical);
    const searchHref = getBookableEntitySearchHref(page.vertical);
    const verticalLabel = getBookableEntityVerticalLabel(page.vertical);
    const copy = resolvePageCopy(page);
    const canonicalPath =
      page.kind === "invalid_route" ? null : page.route.canonicalPath;
    const hasResolvedEntity =
      page.kind === "resolved" ||
      page.kind === "unavailable" ||
      page.kind === "revalidation_required";

    return (
      <Page
        breadcrumbs={[
          { label: "Andacity Travel", href: "/" },
          { label: verticalLabel, href: browseHref },
          { label: "Entity", href: getBookableEntityRouteBase(page.vertical) },
          {
            label:
              page.kind === "invalid_route"
                ? "Invalid route"
                : page.kind === "resolved"
                  ? page.entity.title
                  : copy.badge,
            href: canonicalPath || searchHref,
          },
        ]}
      >
        <section class="mt-4 rounded-[32px] border border-[color:var(--color-border)] bg-white/90 px-6 py-7 shadow-[var(--shadow-soft)]">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-action)]">
            {copy.badge}
          </p>
          <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            {copy.title}
          </h1>
          <p class="mt-3 max-w-[78ch] text-sm leading-6 text-[color:var(--color-text-muted)] lg:text-base">
            {copy.description}
          </p>
        </section>

        {page.kind === "invalid_route" ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Shared route validation
              </h2>
              <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
                {page.error.message}
              </p>
              {page.error.value ? (
                <p class="mt-3 break-all rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 font-mono text-xs text-[color:var(--color-text)]">
                  {page.error.value}
                </p>
              ) : null}
            </div>

            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Next step
              </h2>
              <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
                Return to canonical search and open a result from a normalized
                entity link.
              </p>
              <a
                class="t-btn-primary mt-5 inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
                href={searchHref}
              >
                Browse {verticalLabel.toLowerCase()}
              </a>
            </div>
          </section>
        ) : page.kind === "not_found" ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Resolution boundary
              </h2>
              <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
                Inventory Resolver did not return a live canonical entity for
                this route.
              </p>
              <dl class="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Requested inventory ID
                  </dt>
                  <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                    {page.requestedInventoryId}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Canonical route
                  </dt>
                  <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                    {page.route.canonicalPath}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Next step
              </h2>
              <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
                Open a fresh result from canonical search to resolve current
                live inventory.
              </p>
              <a
                class="t-btn-primary mt-5 inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
                href={searchHref}
              >
                Browse {verticalLabel.toLowerCase()}
              </a>
            </div>
          </section>
        ) : hasResolvedEntity ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Canonical entity contract
              </h2>
              <dl class="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Inventory ID
                  </dt>
                  <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                    {page.kind === "revalidation_required"
                      ? page.requestedInventoryId
                      : page.route.inventoryId}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Route
                  </dt>
                  <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                    {page.route.canonicalPath}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Provider
                  </dt>
                  <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                    {toText(page.entity.provider) || "Provider-agnostic"}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Last checked
                  </dt>
                  <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                    {formatTimestamp(page.resolution.checkedAt)}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Live price
                  </dt>
                  <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                    {formatMoneyFromCents(
                      page.entity.price.amountCents,
                      page.entity.price.currency,
                    )}
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    Availability signal
                  </dt>
                  <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                    {page.resolution.isAvailable === false
                      ? "Unavailable"
                      : page.resolution.isAvailable === true
                        ? "Available"
                        : "Availability requires recheck"}
                  </dd>
                </div>
              </dl>

              {page.entity.subtitle ? (
                <p class="mt-5 text-sm leading-6 text-[color:var(--color-text-muted)]">
                  {page.entity.subtitle}
                </p>
              ) : null}

              {page.kind === "revalidation_required" ? (
                <p class="mt-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[color:var(--color-text)]">
                  Live inventory resolved to{" "}
                  <span class="font-mono">{page.resolvedInventoryId}</span>.
                  Follow-up tasks can use this boundary to present replacement
                  or refresh UI without bypassing canonical IDs.
                </p>
              ) : null}
            </div>

            <div class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Framework boundary
              </h2>
              <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
                TASK-025 stops at routing, resolution, and shared state
                handling. Flight, hotel, and car-specific detail UIs attach here
                in the next tasks.
              </p>
              <div class="mt-5 grid gap-3">
                <a
                  class="t-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
                  href={searchHref}
                >
                  Back to search
                </a>
                <a
                  class="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] px-5 text-sm font-semibold text-[color:var(--color-action)] transition hover:border-[color:var(--color-action)]"
                  href={browseHref}
                >
                  Explore {verticalLabel.toLowerCase()}
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </Page>
    );
  },
);

type BookableEntityPageProps = {
  page: BookableEntityPageLoadResult;
};
