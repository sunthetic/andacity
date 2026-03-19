import {
  OWNED_ITINERARY_GROUP_KEYS,
  getOwnedItineraryGroupKey,
  groupOwnedItineraries,
  type OwnedItineraryGroupKey,
} from "~/fns/itinerary/groupOwnedItineraries";
import { formatItineraryCurrency } from "~/fns/itinerary/formatItineraryCurrency";
import { formatItineraryDateRange } from "~/fns/itinerary/formatItineraryDates";
import {
  filterMyTrips,
  normalizeMyTripsFilter,
  normalizeMyTripsSearch,
  type MyTripsFilterValue,
} from "~/fns/my-trips/filterMyTrips";
import { sortMyTrips } from "~/fns/my-trips/sortMyTrips";
import type { ItinerarySummary } from "~/types/itinerary";
import type { CurrentOwnershipContext } from "~/types/ownership";

export type MyTripsNoticeTone = "success" | "warning" | "error" | "info";

export type MyTripsCardBadge = {
  label: string;
  tone: MyTripsNoticeTone;
};

export type MyTripsCardModel = {
  publicRef: string;
  href: string;
  title: string;
  description: string;
  locationLabel: string | null;
  dateRangeLabel: string | null;
  statusLabel: string;
  statusTone: MyTripsNoticeTone;
  itineraryRefLabel: string;
  itemCountLabel: string;
  totalPaidLabel: string | null;
  ownershipLabel: string | null;
  badges: MyTripsCardBadge[];
  ctaLabel: string;
};

export type MyTripsGroupModel = {
  key: OwnedItineraryGroupKey;
  title: string;
  description: string;
  countLabel: string;
  trips: MyTripsCardModel[];
};

export type MyTripsPageModel = {
  header: {
    title: string;
    eyebrow: string;
    helper: string;
    countLabel: string;
    modeLabel: string;
  };
  ownershipNotice: {
    tone: MyTripsNoticeTone;
    badgeLabel: string;
    title: string;
    message: string;
    hint: string | null;
  };
  filterBar: {
    action: string;
    activeFilter: MyTripsFilterValue;
    searchValue: string;
    clearHref: string;
    filters: Array<{
      key: MyTripsFilterValue;
      label: string;
      href: string;
      active: boolean;
    }>;
  };
  statusSummary: {
    title: string;
    description: string;
    items: Array<{
      label: string;
      tone: MyTripsNoticeTone;
    }>;
    ctaHref: string | null;
    ctaLabel: string | null;
  } | null;
  resumeBanner: {
    href: string;
    title: string;
    description: string;
    ctaLabel: string;
    refLabel: string | null;
  } | null;
  groups: MyTripsGroupModel[];
  emptyState: {
    title: string;
    message: string;
    detail: string | null;
    primaryAction: {
      label: string;
      href: string;
    };
    secondaryAction: {
      label: string;
      href: string;
    } | null;
  } | null;
  isEmpty: boolean;
};

const START_NEW_TRIP_HREF = "/#global-search-entry";
const TRIP_WORKSPACE_HREF = "/trips";
const FILTER_OPTIONS: Array<{
  key: MyTripsFilterValue;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "issues", label: "Issues" },
];

const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const buildPageHref = (
  url: URL,
  input: {
    filter?: MyTripsFilterValue;
    search?: string | null;
  } = {},
) => {
  const params = new URLSearchParams(url.search);
  const filter = normalizeMyTripsFilter(input.filter ?? params.get("filter"));
  const search = normalizeMyTripsSearch(input.search ?? params.get("q"));

  if (filter === "all") {
    params.delete("filter");
  } else {
    params.set("filter", filter);
  }

  if (search) {
    params.set("q", search);
  } else {
    params.delete("q");
  }

  const query = params.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
};

const getOwnershipMode = (
  context: CurrentOwnershipContext,
  summaries: ItinerarySummary[],
) => {
  const hasCurrentUser = Boolean(context.ownerUserId);
  const sessionTripCount = summaries.filter(
    (summary) => summary.ownershipMode === "anonymous",
  ).length;

  if (hasCurrentUser && sessionTripCount > 0) return "mixed" as const;
  if (hasCurrentUser) return "account" as const;
  if (context.ownerSessionId) return "session" as const;
  return "unavailable" as const;
};

const getHeaderCopy = (
  ownershipMode: ReturnType<typeof getOwnershipMode>,
  input: {
    totalCount: number;
    filteredCount: number;
  },
) => {
  const countLabel =
    input.filteredCount === input.totalCount
      ? pluralize(input.filteredCount, "trip")
      : `${input.filteredCount} of ${input.totalCount} trips`;

  if (ownershipMode === "account") {
    return {
      eyebrow: "Trips linked to your account",
      helper: "Your saved trips",
      modeLabel: "Account access",
      countLabel,
    };
  }

  if (ownershipMode === "mixed") {
    return {
      eyebrow: "Trips linked to your account and this session",
      helper: "Your saved trips",
      modeLabel: "Mixed access",
      countLabel,
    };
  }

  return {
    eyebrow: "Trips linked to this session",
    helper: "Saved trips for this browser session",
    modeLabel: "Session access",
    countLabel,
  };
};

const getOwnershipNotice = (
  ownershipMode: ReturnType<typeof getOwnershipMode>,
  input: {
    claimableTripCount: number;
  },
) => {
  if (ownershipMode === "account") {
    return {
      tone: "success" as const,
      badgeLabel: "Account-linked",
      title: "Showing trips attached to your account",
      message:
        "These itineraries are stored against your current account context and are ready to reopen any time.",
      hint:
        input.claimableTripCount > 0
          ? `${pluralize(input.claimableTripCount, "session trip")} can still be attached to your account.`
          : "Future anonymous trips can attach here after sign-in.",
    };
  }

  if (ownershipMode === "mixed") {
    return {
      tone: "warning" as const,
      badgeLabel: "Mixed access",
      title: "Showing account and session trips together",
      message:
        "Most trips are already account-linked, but some itineraries are still tied to this browser session.",
      hint:
        input.claimableTripCount > 0
          ? `${pluralize(input.claimableTripCount, "session trip")} can be attached to your account from its itinerary page.`
          : "Session-linked trips will attach here when the ownership bridge is resolved.",
    };
  }

  return {
    tone: "info" as const,
    badgeLabel: "Session-linked",
    title: "Showing trips linked to this browser session",
    message:
      "Anonymous ownership is active for this device, so trips you booked here are available without a sign-in flow.",
    hint: "If you later connect an account, these trips can be attached and reopened there.",
  };
};

const getGroupPresentation = (key: OwnedItineraryGroupKey) => {
  if (key === "in_progress") {
    return {
      title: "In Progress",
      description: "Trips that are happening now or have already started.",
    };
  }

  if (key === "upcoming") {
    return {
      title: "Upcoming",
      description: "Booked itineraries scheduled for future travel.",
    };
  }

  if (key === "issues") {
    return {
      title: "Needs Attention",
      description:
        "Trips with partial bookings, manual review work, or notification follow-up.",
    };
  }

  return {
    title: "Past",
    description: "Completed, canceled, or archived itineraries.",
  };
};

const getCardStatusTone = (summary: ItinerarySummary): MyTripsNoticeTone => {
  const manualReviewCount = Number(summary.manualReviewItemCount) || 0;
  const failedItemCount = Number(summary.failedItemCount) || 0;

  if (
    manualReviewCount > 0 ||
    (failedItemCount > 0 && !summary.confirmedItemCount)
  ) {
    return "error";
  }

  if (summary.hasRecoveryIssue || summary.hasNotificationIssue) {
    return "warning";
  }

  if (summary.status === "completed") {
    return "success";
  }

  return "info";
};

const getOwnershipLabel = (summary: ItinerarySummary) => {
  if (summary.canAttachToUser) {
    return "Session-linked";
  }

  if (summary.ownershipMode === "user") {
    return "Account-linked";
  }

  if (summary.ownershipMode === "anonymous") {
    return "Session-linked";
  }

  return null;
};

const getCardBadges = (summary: ItinerarySummary): MyTripsCardBadge[] => {
  const badges: MyTripsCardBadge[] = [];
  const manualReviewCount = Number(summary.manualReviewItemCount) || 0;
  const failedItemCount = Number(summary.failedItemCount) || 0;
  const pendingItemCount = Number(summary.pendingItemCount) || 0;
  const confirmedItemCount = Number(summary.confirmedItemCount) || 0;

  if (summary.canAttachToUser) {
    badges.push({
      label: "Attach to account",
      tone: "info",
    });
  }

  if (manualReviewCount > 0) {
    badges.push({
      label:
        manualReviewCount === 1
          ? "Manual review"
          : `${manualReviewCount} manual review`,
      tone: "warning",
    });
  } else if (failedItemCount > 0 && confirmedItemCount > 0) {
    badges.push({
      label: "Partial booking",
      tone: "warning",
    });
  } else if (failedItemCount > 0) {
    badges.push({
      label: "Booking failed",
      tone: "error",
    });
  } else if (pendingItemCount > 0) {
    badges.push({
      label:
        pendingItemCount === 1 ? "Pending item" : `${pendingItemCount} pending`,
      tone: "info",
    });
  }

  if (summary.notificationSummary?.status === "failed") {
    badges.push({
      label: "Notification failed",
      tone: "warning",
    });
  } else if (summary.notificationSummary?.status === "skipped") {
    badges.push({
      label: "Notification skipped",
      tone: "warning",
    });
  }

  return badges.slice(0, 3);
};

const buildCardModel = (summary: ItinerarySummary): MyTripsCardModel => {
  return {
    publicRef: summary.publicRef,
    href: `/itinerary/${encodeURIComponent(summary.publicRef)}`,
    title: summary.title,
    description:
      summary.tripDescription ||
      summary.locationSummary ||
      "Persisted itinerary details are ready to reopen.",
    locationLabel: summary.locationSummary,
    dateRangeLabel: formatItineraryDateRange(summary.startAt, summary.endAt, {
      emptyLabel: "Dates unavailable",
    }),
    statusLabel: summary.statusLabel,
    statusTone: getCardStatusTone(summary),
    itineraryRefLabel: summary.publicRef,
    itemCountLabel: pluralize(summary.itemCount, "item"),
    totalPaidLabel: formatItineraryCurrency(
      summary.totalAmountCents,
      summary.currency,
      {
        emptyLabel: null,
      },
    ),
    ownershipLabel: getOwnershipLabel(summary),
    badges: getCardBadges(summary),
    ctaLabel: "View itinerary",
  };
};

const resolveVisibleGroupKeys = (filter: MyTripsFilterValue) => {
  if (filter === "upcoming") {
    return ["in_progress", "upcoming"] satisfies OwnedItineraryGroupKey[];
  }

  if (filter === "past") {
    return ["past"] satisfies OwnedItineraryGroupKey[];
  }

  if (filter === "issues") {
    return ["issues"] satisfies OwnedItineraryGroupKey[];
  }

  return [...OWNED_ITINERARY_GROUP_KEYS];
};

const buildEmptyState = (input: {
  ownershipMode: ReturnType<typeof getOwnershipMode>;
  totalCount: number;
  filteredCount: number;
  filter: MyTripsFilterValue;
  searchValue: string;
  clearHref: string;
}) => {
  if (input.filteredCount === 0 && input.totalCount > 0) {
    return {
      title: "No trips match this view",
      message:
        "Try a different filter, reference, destination, or clear the current search.",
      detail:
        input.searchValue || input.filter !== "all"
          ? "The dashboard is still loading from persisted ownership records, but nothing matched the current view."
          : null,
      primaryAction: {
        label: "Clear filters",
        href: input.clearHref,
      },
      secondaryAction: {
        label: "Start a new trip",
        href: START_NEW_TRIP_HREF,
      },
    };
  }

  if (input.ownershipMode === "account") {
    return {
      title: "No account-linked trips yet",
      message:
        "Trips attached to your account will appear here after booking, recovery, or attachment from a session-owned itinerary.",
      detail:
        "If you booked on another device, reopen the itinerary or confirmation link there first to bridge ownership.",
      primaryAction: {
        label: "Start a new trip",
        href: START_NEW_TRIP_HREF,
      },
      secondaryAction: {
        label: "Open trip workspace",
        href: TRIP_WORKSPACE_HREF,
      },
    };
  }

  return {
    title: "No session-linked trips yet",
    message:
      "Trips booked in this browser session will appear here once durable itinerary ownership is created.",
    detail:
      "Use a saved itinerary or confirmation link on this device to reconnect an existing booking.",
    primaryAction: {
      label: "Start a new trip",
      href: START_NEW_TRIP_HREF,
    },
    secondaryAction: {
      label: "Open trip workspace",
      href: TRIP_WORKSPACE_HREF,
    },
  };
};

const buildStatusSummary = (
  url: URL,
  summaries: ItinerarySummary[],
  currentFilter: MyTripsFilterValue,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const issueTripCount = summaries.filter((summary) => {
    return (
      getOwnedItineraryGroupKey(summary, { now: options.now }) === "issues"
    );
  }).length;
  const notificationIssueCount = summaries.filter(
    (summary) => summary.hasNotificationIssue,
  ).length;
  const claimableTripCount = summaries.filter(
    (summary) => summary.canAttachToUser,
  ).length;

  const summaryItems: Array<{
    label: string;
    tone: MyTripsNoticeTone;
  } | null> = [
    issueTripCount
      ? {
          label: `${pluralize(issueTripCount, "trip")} need attention`,
          tone: "warning" as const,
        }
      : null,
    notificationIssueCount
      ? {
          label: `${pluralize(notificationIssueCount, "notification")} need follow-up`,
          tone: "info" as const,
        }
      : null,
    claimableTripCount
      ? {
          label: `${pluralize(claimableTripCount, "session trip")} can be attached`,
          tone: "info" as const,
        }
      : null,
  ];

  const items = summaryItems.filter(
    (
      item,
    ): item is {
      label: string;
      tone: MyTripsNoticeTone;
    } => Boolean(item),
  );

  if (!items.length) return null;

  return {
    title: "Post-booking signals",
    description:
      "Issue and notification states stay secondary here, but they remain visible so returning travelers can recover quickly.",
    items,
    ctaHref:
      issueTripCount > 0 && currentFilter !== "issues"
        ? buildPageHref(url, { filter: "issues" })
        : null,
    ctaLabel:
      issueTripCount > 0 && currentFilter !== "issues" ? "View issues" : null,
  };
};

const buildResumeBanner = (
  summaries: ItinerarySummary[],
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const candidate = sortMyTrips(summaries, { now: options.now }).find(
    (summary) => {
      const groupKey = getOwnedItineraryGroupKey(summary, { now: options.now });
      return (
        groupKey !== "past" ||
        summary.hasRecoveryIssue ||
        summary.hasNotificationIssue
      );
    },
  );

  if (!candidate) return null;

  const groupKey = getOwnedItineraryGroupKey(candidate, { now: options.now });

  return {
    href:
      candidate.canAttachToUser ||
      candidate.hasRecoveryIssue ||
      candidate.hasNotificationIssue
        ? `/resume/${encodeURIComponent(candidate.publicRef)}`
        : `/itinerary/${encodeURIComponent(candidate.publicRef)}`,
    title: candidate.canAttachToUser
      ? "Resume and attach this trip"
      : groupKey === "issues"
        ? "Resume the trip that needs attention"
        : "Continue your saved trip",
    description: candidate.canAttachToUser
      ? "We found a session-linked itinerary that can be attached to your account while you continue."
      : groupKey === "issues"
        ? "This saved itinerary still has recovery or notification follow-up waiting."
        : "Jump back into your most relevant saved itinerary from the dashboard.",
    ctaLabel: candidate.canAttachToUser ? "Resume and attach" : "Resume trip",
    refLabel: candidate.publicRef,
  };
};

export const getMyTripsPageModel = (input: {
  ownershipContext: CurrentOwnershipContext;
  summaries: ItinerarySummary[];
  url: URL;
  now?: Date | string | null;
}) => {
  const filter = normalizeMyTripsFilter(input.url.searchParams.get("filter"));
  const searchValue = normalizeMyTripsSearch(input.url.searchParams.get("q"));
  const ownershipMode = getOwnershipMode(
    input.ownershipContext,
    input.summaries,
  );
  const filteredSummaries = filterMyTrips(input.summaries, {
    filter,
    search: searchValue,
    now: input.now,
  });
  const grouped = groupOwnedItineraries(filteredSummaries, {
    now: input.now,
  });
  const visibleGroupKeys = resolveVisibleGroupKeys(filter);
  const groups = visibleGroupKeys
    .map((groupKey) => {
      const trips = sortMyTrips(grouped[groupKey], {
        groupKey,
        now: input.now,
      });
      if (!trips.length) return null;

      const presentation = getGroupPresentation(groupKey);

      return {
        key: groupKey,
        title: presentation.title,
        description: presentation.description,
        countLabel: pluralize(trips.length, "trip"),
        trips: trips.map((summary) => buildCardModel(summary)),
      } satisfies MyTripsGroupModel;
    })
    .filter((group): group is MyTripsGroupModel => Boolean(group));

  const clearHref = buildPageHref(input.url, {
    filter: "all",
    search: "",
  });

  return {
    header: {
      title: "My Trips",
      ...getHeaderCopy(ownershipMode, {
        totalCount: input.summaries.length,
        filteredCount: filteredSummaries.length,
      }),
    },
    ownershipNotice: getOwnershipNotice(ownershipMode, {
      claimableTripCount: input.summaries.filter(
        (summary) => summary.canAttachToUser,
      ).length,
    }),
    filterBar: {
      action: input.url.pathname,
      activeFilter: filter,
      searchValue,
      clearHref,
      filters: FILTER_OPTIONS.map((filterOption) => ({
        ...filterOption,
        href: buildPageHref(input.url, {
          filter: filterOption.key,
          search: searchValue,
        }),
        active: filterOption.key === filter,
      })),
    },
    statusSummary: buildStatusSummary(input.url, input.summaries, filter, {
      now: input.now,
    }),
    resumeBanner: buildResumeBanner(input.summaries, {
      now: input.now,
    }),
    groups,
    emptyState:
      filteredSummaries.length === 0
        ? buildEmptyState({
            ownershipMode,
            totalCount: input.summaries.length,
            filteredCount: filteredSummaries.length,
            filter,
            searchValue,
            clearHref,
          })
        : null,
    isEmpty: filteredSummaries.length === 0,
  } satisfies MyTripsPageModel;
};
