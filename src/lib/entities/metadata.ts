import type { DocumentHeadValue } from "@builder.io/qwik-city";
import type {
  BookableEntityPageLoadResult,
  ParsedBookableEntityRoute,
} from "~/types/bookable-entity-route";

const SINGULAR_LABELS = {
  flight: "flight",
  hotel: "hotel",
  car: "car rental",
} as const;

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const formatIsoDate = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const [year, month, day] = text.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatDateRange = (route: ParsedBookableEntityRoute) => {
  if (route.parsedInventory.vertical === "flight") {
    return formatIsoDate(route.parsedInventory.departDate);
  }

  if (route.parsedInventory.vertical === "hotel") {
    return [formatIsoDate(route.parsedInventory.checkInDate), formatIsoDate(route.parsedInventory.checkOutDate)]
      .filter((value): value is string => Boolean(value))
      .join(" to ");
  }

  return [
    formatIsoDate(route.parsedInventory.pickupDateTime.slice(0, 10)),
    formatIsoDate(route.parsedInventory.dropoffDateTime.slice(0, 10)),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" to ");
};

const resolveResolvedTitle = (page: Extract<BookableEntityPageLoadResult, { kind: "resolved" | "unavailable" | "revalidation_required" }>) => {
  const dateRange = formatDateRange(page.route);
  const entityTitle = toText(page.entity.title) || "Bookable option";

  if (!dateRange) {
    return `${entityTitle} | Andacity`;
  }

  return `${entityTitle} · ${dateRange} | Andacity`;
};

const resolveResolvedDescription = (
  page: Extract<BookableEntityPageLoadResult, { kind: "resolved" | "unavailable" | "revalidation_required" }>,
) => {
  const entityTitle = toText(page.entity.title) || "This itinerary";
  const singularLabel = SINGULAR_LABELS[page.vertical];

  if (page.kind === "revalidation_required") {
    return `The linked ${singularLabel} no longer exactly matches the requested canonical inventory. Revalidate ${entityTitle} before adding it to a trip.`;
  }

  if (page.kind === "unavailable") {
    return `The requested ${singularLabel} is currently unavailable. Review the canonical route and return to search for a fresh option.`;
  }

  return `Inspect the canonical ${singularLabel} route, live inventory resolution status, and provider-agnostic entity shell for ${entityTitle}.`;
};

const resolveTitle = (page: BookableEntityPageLoadResult) => {
  if (page.kind === "invalid_route") {
    return `Invalid ${SINGULAR_LABELS[page.vertical]} route | Andacity`;
  }

  if (page.kind === "not_found") {
    return `${SINGULAR_LABELS[page.vertical][0].toUpperCase()}${SINGULAR_LABELS[page.vertical].slice(1)} not found | Andacity`;
  }

  return resolveResolvedTitle(page);
};

const resolveDescription = (page: BookableEntityPageLoadResult) => {
  if (page.kind === "invalid_route") {
    return `The requested ${SINGULAR_LABELS[page.vertical]} route is not a valid canonical entity URL.`;
  }

  if (page.kind === "not_found") {
    return `The requested canonical ${SINGULAR_LABELS[page.vertical]} could not be resolved through live inventory.`;
  }

  return resolveResolvedDescription(page);
};

const resolveCanonicalHref = (page: BookableEntityPageLoadResult, url: URL) => {
  if (page.kind === "invalid_route") {
    return null;
  }

  return new URL(page.route.canonicalPath, url.origin).href;
};

const resolveRobots = (
  page: BookableEntityPageLoadResult,
  options: {
    allowIndexing?: boolean;
  },
) =>
  options.allowIndexing && page.kind === "resolved"
    ? "index,follow,max-image-preview:large"
    : "noindex,follow,max-image-preview:large";

export const buildBookableEntityDocumentHead = (
  page: BookableEntityPageLoadResult,
  url: URL,
  options: {
    allowIndexing?: boolean;
  } = {},
): DocumentHeadValue => {
  const title = resolveTitle(page);
  const description = resolveDescription(page);
  const canonicalHref = resolveCanonicalHref(page, url);
  const robots = resolveRobots(page, options);

  return {
    title,
    meta: [
      { name: "description", content: description },
      { name: "robots", content: robots },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref || url.href },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: canonicalHref ? [{ rel: "canonical", href: canonicalHref }] : [],
  };
};
