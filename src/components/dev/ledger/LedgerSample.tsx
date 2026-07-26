/**
 * CLAUDE-UI-051 — Ledger results surface, dev sample.
 *
 * DEV / DESIGN-PREVIEW ONLY. Rendered by /dev/ui-ledger, which 404s on the
 * production host. Fixtures are local (same pattern as PalettePreview) so
 * the route needs no database.
 *
 * The surface under test:
 *   - results as a comparison matrix rather than a card grid
 *   - fees as a first-class column instead of a checkout surprise
 *   - the leading number is the all-in total, not the nightly rate
 *   - pinning holds a row's position while the rest re-sorts
 *   - a roll-up that turns four verticals into one budget
 *
 * Rendered inside PageShell with palette="baseline" so it can be judged
 * without changing the global default for anyone else.
 */
import { $, component$, useSignal, useComputed$ } from "@builder.io/qwik";
import { PageShell } from "~/components/ui/PageShell";
import {
  DataCell,
  DataHeadCell,
  DataNumericCell,
  DataRow,
  DataRowHeader,
  DataTable,
} from "~/components/ui/data/DataTable";
import {
  PinToggle,
  PolicyMark,
  RankMark,
  TrendIndicator,
  type CancellationPolicy,
  type TrendDirection,
} from "~/components/ui/data/DataMarks";
import { TripRollup } from "~/components/ui/data/TripRollup";
import type { ThemeMode } from "~/lib/ui-theme/theme";

type Stay = {
  id: string;
  name: string;
  area: string;
  nightly: number;
  fees: number;
  rating: number;
  policy: CancellationPolicy;
  trend: { direction: TrendDirection; magnitude: string };
};

const NIGHTS = 4;

/** Fixture — the shared scenario: SFO→MIA, 14–18 Mar, 2 travelers. */
const STAYS: Stay[] = [
  {
    id: "grand-meridian",
    name: "Grand Meridian Downtown",
    area: "Downtown · on the transit line",
    nightly: 129,
    fees: 74,
    rating: 8.7,
    policy: { kind: "refundable", until: "12 Mar" },
    trend: { direction: "down", magnitude: "6%" },
  },
  {
    id: "wynwood-foundry",
    name: "Wynwood Foundry House",
    area: "Wynwood · arts district",
    nightly: 146,
    fees: 0,
    rating: 9.1,
    policy: { kind: "refundable", until: "13 Mar" },
    trend: { direction: "flat", magnitude: "0%" },
  },
  {
    id: "aster-grove",
    name: "Aster Coconut Grove",
    area: "Coconut Grove · quiet, leafy",
    nightly: 162,
    fees: 96,
    rating: 8.4,
    policy: { kind: "nonrefundable" },
    trend: { direction: "up", magnitude: "9%" },
  },
  {
    id: "harborline",
    name: "Harborline Suites",
    area: "South Beach · 3 min to sand",
    nightly: 188,
    fees: 118,
    rating: 8.9,
    policy: { kind: "refundable", until: "10 Mar" },
    trend: { direction: "up", magnitude: "4%" },
  },
];

const usd = (n: number): string => `$${n.toLocaleString("en-US")}`;
const totalFor = (s: Stay): number => s.nightly * NIGHTS + s.fees;

export const LedgerSample = component$((props: { mode?: ThemeMode }) => {
  const pinned = useSignal<string[]>([]);

  const rows = useComputed$(() => {
    const withTotals = STAYS.map((s) => ({ ...s, total: totalFor(s) }));
    const isPinned = (id: string) => pinned.value.includes(id);
    return withTotals.sort((a, b) => {
      if (isPinned(a.id) !== isPinned(b.id)) return isPinned(a.id) ? -1 : 1;
      return a.total - b.total;
    });
  });

  const toggle = $((id: string) => {
    pinned.value = pinned.value.includes(id)
      ? pinned.value.filter((p) => p !== id)
      : [...pinned.value, id];
  });

  return (
    <PageShell palette="baseline" mode={props.mode} class="min-h-screen">
      <div style="background:var(--ui-bg)" class="min-h-screen">
        <div class="mx-auto max-w-5xl px-5 py-10">
          {/* ---- Header ------------------------------------------- */}
          <header class="pb-5" style="border-bottom:1px solid var(--ui-border)">
            <p
              class="text-[10px] font-bold uppercase tracking-[0.14em]"
              style="color:var(--ui-text-muted)"
            >
              Andacity &middot; Ledger &middot; dev preview
            </p>
            <h1
              class="mt-2 text-3xl leading-tight font-bold tracking-tight"
              style="color:var(--ui-text)"
            >
              Miami stays
            </h1>
            <p
              class="ui-num mt-1 text-sm"
              style="color:var(--ui-text-secondary)"
            >
              14&ndash;18 March &middot; 4 nights &middot; 2 travelers &middot;{" "}
              <span style="color:var(--ui-text)">
                totals include taxes and fees
              </span>
            </p>
          </header>

          {/* ---- Results matrix ----------------------------------- */}
          <div class="mt-7">
            <div class="mb-2.5 flex items-baseline justify-between">
              <h2
                class="text-[11px] font-bold uppercase tracking-[0.09em]"
                style="color:var(--ui-text-muted)"
              >
                Sorted by total &darr;
              </h2>
              <p class="text-[11px]" style="color:var(--ui-text-muted)">
                {pinned.value.length > 0
                  ? `${pinned.value.length} pinned · pinned rows hold position`
                  : "Pin a row to hold its position while the rest re-sorts"}
              </p>
            </div>

            <DataTable
              caption="Miami stays, 14\u201318 March, sorted by all-in total"
              head={
                <tr>
                  <DataHeadCell width="2.5rem">
                    <span class="sr-only">Rank</span>
                  </DataHeadCell>
                  <DataHeadCell>Stay</DataHeadCell>
                  <DataHeadCell align="end">Nightly</DataHeadCell>
                  <DataHeadCell align="end">Fees</DataHeadCell>
                  <DataHeadCell align="end">{NIGHTS}-night total</DataHeadCell>
                  <DataHeadCell>Cancellation</DataHeadCell>
                  <DataHeadCell align="end">30-day</DataHeadCell>
                  <DataHeadCell width="3rem">
                    <span class="sr-only">Pin</span>
                  </DataHeadCell>
                </tr>
              }
            >
              {rows.value.map((s, i) => (
                <DataRow key={s.id} pinned={pinned.value.includes(s.id)}>
                  <DataCell>
                    <RankMark rank={i + 1} />
                  </DataCell>

                  <DataRowHeader>
                    <div class="min-w-0 py-2">
                      <div
                        class="truncate text-sm font-semibold"
                        style="color:var(--ui-text)"
                      >
                        {s.name}
                      </div>
                      <div
                        class="mt-0.5 truncate text-[11px]"
                        style="color:var(--ui-text-muted)"
                      >
                        {s.area} &middot;{" "}
                        <span class="ui-num">Rated {s.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </DataRowHeader>

                  <DataNumericCell value={usd(s.nightly)} />
                  <DataNumericCell
                    value={s.fees === 0 ? "None" : usd(s.fees)}
                    note={s.fees === 0 ? "no resort fee" : undefined}
                  />
                  <DataNumericCell
                    value={usd(s.total)}
                    note="all in"
                    emphasis
                  />

                  <DataCell>
                    <PolicyMark policy={s.policy} />
                  </DataCell>

                  <DataCell align="end">
                    <TrendIndicator
                      direction={s.trend.direction}
                      magnitude={s.trend.magnitude}
                      window="30 days"
                    />
                  </DataCell>

                  <DataCell align="end">
                    <PinToggle
                      pinned={pinned.value.includes(s.id)}
                      label={s.name}
                      onToggle$={$(() => toggle(s.id))}
                    />
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          </div>

          {/* ---- Roll-up ------------------------------------------ */}
          <div class="mt-7">
            <TripRollup
              lines={[
                { label: "Flights", amount: "$624" },
                { label: "Stay", amount: "$590" },
                { label: "Car", amount: "$305", pending: true },
                { label: "Taxes & fees", amount: "$328" },
              ]}
              total="$1,847"
              perTraveler="$924"
              vsMedian="11%"
              vsMedianFavorable
              progress="Booked 3 of 4 · free cancellation until 12 Mar"
            />
          </div>

          <p class="mt-5 text-[11px]" style="color:var(--ui-text-muted)">
            Fixture data. Not connected to inventory.
          </p>
        </div>
      </div>
    </PageShell>
  );
});
