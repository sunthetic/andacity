import { component$ } from "@builder.io/qwik";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsFilterBar = component$(
  (props: { filterBar: MyTripsPageModel["filterBar"] }) => {
    const { filterBar } = props;

    return (
      <div class="flex flex-col gap-4 border-b border-[color:var(--color-border)] pb-5">
        <div class="flex flex-wrap gap-2">
          {filterBar.filters.map((filter) => (
            <a
              key={filter.key}
              href={filter.href}
              class={[
                "rounded-full border px-3 py-2 text-sm font-medium transition",
                filter.active
                  ? "border-[color:var(--color-text-strong)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-strong)]"
                  : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-text-strong)] hover:text-[color:var(--color-text-strong)]",
              ]}
            >
              {filter.label}
            </a>
          ))}
        </div>

        <form
          method="get"
          action={filterBar.action}
          class="flex flex-col gap-3 md:flex-row md:items-center"
        >
          {filterBar.activeFilter !== "all" ? (
            <input type="hidden" name="filter" value={filterBar.activeFilter} />
          ) : null}
          <label class="sr-only" for="my-trips-search">
            Search your trips
          </label>
          <input
            id="my-trips-search"
            type="search"
            name="q"
            value={filterBar.searchValue}
            placeholder="Search by title, reference, or destination"
            class="min-w-0 flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3 text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-text-strong)]"
          />
          <div class="flex flex-wrap gap-2">
            <button
              type="submit"
              class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Search
            </button>
            <a
              href={filterBar.clearHref}
              class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Clear
            </a>
          </div>
        </form>
      </div>
    );
  },
);
