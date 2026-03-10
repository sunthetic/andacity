import { $, Slot, component$, useSignal } from "@builder.io/qwik";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import {
  InventoryRefreshControl,
  type InventoryRefreshControlProps,
} from "~/components/inventory/InventoryRefreshControl";
import { ResultsControlBar } from "~/components/results/ResultsControlBar";
import { ResultsEmpty } from "~/components/results/ResultsEmpty";
import { ResultsFilters } from "~/components/results/ResultsFilters";
import type { ResultsFilterChip } from "~/components/results/ResultsFilterGroups";
import { ResultsHeader } from "~/components/results/ResultsHeader";
import { ResultsLoading } from "~/components/results/ResultsLoading";
import { ResultsPagination } from "~/components/results/ResultsPagination";
import type { ResultsPaginationLink } from "~/components/results/ResultsPagination";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import type { BookingAsyncState } from "~/lib/async/booking-async-state";

export const ResultsShell = component$((props: ResultsShellProps) => {
  const asyncState = props.asyncState || "loaded";
  const showNotice =
    asyncState === "refreshing" ||
    asyncState === "partial" ||
    asyncState === "stale";
  const mobileFiltersOpen = useSignal(false);
  const desktopFiltersOpen = useSignal(true);

  const onToggleFilters$ = $(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      desktopFiltersOpen.value = !desktopFiltersOpen.value;
      return;
    }

    mobileFiltersOpen.value = !mobileFiltersOpen.value;
  });

  return (
    <section class={props.class}>
      <ResultsHeader
        querySummary={props.querySummary}
        editSearchHref={props.editSearchHref}
      />

      {props.refreshControl ? (
        <div class="mt-3 flex justify-end">
          <InventoryRefreshControl {...props.refreshControl} align="right" />
        </div>
      ) : null}

      <ResultsControlBar
        class="mt-4"
        sortId={props.sortId || "results-sort"}
        resultCountLabel={props.resultCountLabel}
        sortOptions={props.sortOptions}
        activeFilterChips={props.activeFilterChips}
        clearAllHref={props.clearAllFiltersHref}
        onToggleFilters$={onToggleFilters$}
        busy={asyncState === "refreshing" || asyncState === "initial_loading"}
        disabled={props.controlsDisabled}
      />

      {mobileFiltersOpen.value ? (
        <ResultsFilters title={props.filtersTitle || "Filters"} class="mt-4 lg:hidden">
          <Slot name="filters-mobile" />
        </ResultsFilters>
      ) : null}

      <div
        class={[
          "mt-6 grid gap-6 lg:items-start",
          desktopFiltersOpen.value
            ? "lg:grid-cols-[280px_1fr]"
            : "lg:grid-cols-[1fr]",
        ]}
      >
        {desktopFiltersOpen.value ? (
          <aside class="hidden lg:block">
            <ResultsFilters title={props.filtersTitle || "Filters"}>
              <Slot name="filters-desktop" />
            </ResultsFilters>
          </aside>
        ) : null}

        <div>
          {showNotice && props.statusNotice ? (
            <AsyncStateNotice
              class="mt-1"
              state={asyncState}
              title={props.statusNotice.title}
              message={props.statusNotice.message}
              retryLabel={props.statusNotice.retryLabel}
              retryHref={props.statusNotice.retryHref}
              onRetry$={props.statusNotice.onRetry$}
            />
          ) : null}

          <div class="mt-4">
            {asyncState === "initial_loading" ? (
              <ResultsLoading
                variant={props.loadingVariant}
                count={props.loadingCount}
              />
            ) : asyncState === "failed" && props.failed ? (
              <ResultsEmpty
                title={props.failed.title}
                description={props.failed.description}
                primaryAction={props.failed.primaryAction}
                secondaryAction={props.failed.secondaryAction}
              />
            ) : asyncState === "empty" && props.empty ? (
              <ResultsEmpty
                title={props.empty.title}
                description={props.empty.description}
                primaryAction={props.empty.primaryAction}
                secondaryAction={props.empty.secondaryAction}
              />
            ) : (
              <div class="relative">
                {asyncState === "refreshing" ? (
                  <div class="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
                    <div class="rounded-full border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.92)] px-3 py-1 shadow-[var(--shadow-sm)]">
                      <AsyncInlineSpinner
                        compact={true}
                        label={
                          props.refreshingOverlayLabel || "Updating results"
                        }
                      />
                    </div>
                  </div>
                ) : null}

                <div class={asyncState === "refreshing" ? "opacity-70" : null}>
                  <Slot />
                </div>
              </div>
            )}
          </div>

          {asyncState !== "initial_loading" &&
          asyncState !== "failed" &&
          asyncState !== "empty" &&
          props.pagination ? (
            <ResultsPagination
              page={props.pagination.page}
              totalPages={props.pagination.totalPages}
              prevHref={props.pagination.prevHref}
              nextHref={props.pagination.nextHref}
              pageLinks={props.pagination.pageLinks}
              disabled={props.controlsDisabled}
            />
          ) : null}
        </div>
      </div>

      <Slot name="results-overlay" />
    </section>
  );
});

type ResultsShellProps = {
  querySummary: string;
  resultCountLabel: string;
  sortOptions: ResultsSortOption[];
  sortId?: string;
  activeFilterChips?: ResultsFilterChip[];
  clearAllFiltersHref?: string;
  pagination?: {
    page: number;
    totalPages: number;
    prevHref?: string;
    nextHref?: string;
    pageLinks: ResultsPaginationLink[];
  };
  editSearchHref?: string;
  filtersTitle?: string;
  asyncState?: BookingAsyncState;
  statusNotice?: {
    title: string;
    message: string;
    retryLabel?: string;
    retryHref?: string;
    onRetry$?: InventoryRefreshControlProps["onRefresh$"];
  };
  failed?: {
    title: string;
    description: string;
    primaryAction?: {
      label: string;
      href: string;
    };
    secondaryAction?: {
      label: string;
      href: string;
    };
  };
  loadingVariant?: "card" | "list";
  loadingCount?: number;
  refreshingOverlayLabel?: string;
  controlsDisabled?: boolean;
  refreshControl?: InventoryRefreshControlProps;
  empty?: {
    title: string;
    description: string;
    primaryAction?: {
      label: string;
      href: string;
    };
    secondaryAction?: {
      label: string;
      href: string;
    };
  };
  class?: string;
};
