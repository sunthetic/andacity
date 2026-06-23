import { Slot, component$ } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";
import {
  formatMoney,
  formatPriceChange,
  formatPriceQualifier,
  type PriceDisplayContract,
} from "~/lib/pricing/price-display";

export const ResultCardScaffold = component$(
  (props: ResultCardScaffoldProps) => {
    const showAside = Boolean(
      props.hasSecondaryActions || props.hasPrice || props.hasPrimaryAction,
    );
    const contentGridClass = showAside
      ? props.hasMedia
        ? "md:grid-cols-[minmax(0,1fr)_176px] xl:grid-cols-[minmax(0,1fr)_200px]"
        : "md:grid-cols-[minmax(0,1fr)_200px] xl:grid-cols-[minmax(0,1fr)_220px]"
      : undefined;

    return (
      <article
        class="overflow-hidden rounded-xl transition hover:-translate-y-px"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
      >
        <div
          class={[
            "grid gap-0",
            props.hasMedia
              ? "md:grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]"
              : undefined,
          ]}
        >
          {props.hasMedia ? (
            <div
              class="md:shadow-[inset_-1px_0_0_var(--ui-divider)]"
              style="background:var(--ui-surface-muted)"
            >
              <Slot name="media" />
            </div>
          ) : null}

          <div class="p-4 md:p-5">
            <div class={["grid gap-5", contentGridClass]}>
              <div class="min-w-0">
                <Slot name="identity" />

                {props.hasFacts ? (
                  <div class="mt-4">
                    <Slot name="facts" />
                  </div>
                ) : null}

                {props.hasDetails ? (
                  <div class="mt-3">
                    <Slot name="details" />
                  </div>
                ) : null}

                {props.hasWhyThis ? (
                  <div class="mt-4">
                    <Slot name="why-this" />
                  </div>
                ) : null}
              </div>

              {showAside ? (
                <aside
                  class="flex min-w-0 flex-col gap-4 rounded-2xl p-3 xl:p-4"
                  style="background:var(--ui-surface-muted);border-left:3px solid var(--ui-primary)"
                >
                  {props.hasSecondaryActions ? (
                    <div class="flex flex-wrap gap-2 md:justify-end">
                      <Slot name="secondary-actions" />
                    </div>
                  ) : null}

                  {props.hasPrice ? (
                    <div>
                      <Slot name="price" />
                    </div>
                  ) : null}

                  {props.hasPrimaryAction ? (
                    <div class="mt-auto">
                      <Slot name="primary-action" />
                    </div>
                  ) : null}
                </aside>
              ) : null}
            </div>

            {props.hasTrust ? (
              <div class="mt-4 rounded-2xl px-3 py-3" style="background:var(--ui-surface-muted)">
                <Slot name="trust" />
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  },
);

export const ResultFactGrid = component$((props: ResultFactGridProps) => {
  const items = props.items.filter(
    (item) => String(item.value || "").trim().length > 0,
  );
  if (!items.length) return null;

  return (
    <div
      class={[
        "grid gap-2",
        items.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : undefined,
        items.length === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : undefined,
        items.length === 2 ? "sm:grid-cols-2" : undefined,
      ]}
    >
      {items.map((item) => (
        <div
          key={`${item.label}:${item.value}`}
          class="rounded-xl px-3 py-2.5 shadow-sm"
          style="background:var(--ui-surface-muted)"
        >
          <p class="text-[10px] font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
            {item.label}
          </p>
          <p class="mt-1 text-sm font-semibold leading-5" style="color:var(--ui-text)">
            {item.value}
          </p>
          {item.detail ? (
            <p class="mt-1 text-[11px] leading-4" style="color:var(--ui-text-muted)">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
});

export const ResultFactList = component$((props: ResultFactListProps) => {
  const items = props.items.filter(
    (item) =>
      String(item.value || "").trim().length > 0 ||
      String(item.detail || "").trim().length > 0,
  );
  if (!items.length) return null;

  return (
    <dl
      class={[
        "grid gap-2.5",
        (props.columns || 2) === 2
          ? props.columnsFrom === "xl"
            ? "xl:grid-cols-2"
            : props.columnsFrom === "lg"
              ? "lg:grid-cols-2"
              : props.columnsFrom === "md"
                ? "md:grid-cols-2"
                : "sm:grid-cols-2"
          : undefined,
      ]}
    >
      {items.map((item) => (
        <div
          key={`${item.label}:${item.value}:${item.detail || ""}`}
          class="min-w-0 rounded-lg px-3 py-2.5"
          style="background:var(--ui-surface-muted);border-left:3px solid var(--ui-accent)"
        >
          <dt class="text-[10px] font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
            {item.label}
          </dt>
          <dd class="mt-1 min-w-0 text-sm leading-5" style="color:var(--ui-text)">
            {item.value ? (
              <span class="font-semibold" style="color:var(--ui-text)">
                {item.value}
              </span>
            ) : null}
            {item.detail ? (
              <span style="color:var(--ui-text-muted)">
                {item.value ? " · " : null}
                {item.detail}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
});

export const ResultReasonCallout = component$(
  (props: ResultReasonCalloutProps) => {
    if (!String(props.text || "").trim()) return null;

    return (
      <div class="rounded-xl px-4 py-3" style="background:var(--ui-accent-soft);border-left:3px solid var(--ui-accent)">
        <p class="text-[10px] font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-accent)">
          {props.label || "Why this result"}
        </p>
        <p class="mt-1 text-sm leading-5" style="color:var(--ui-text)">
          {props.text}
        </p>
      </div>
    );
  },
);

export const ResultTrustBar = component$((props: ResultTrustBarProps) => {
  const detailText =
    props.freshness?.detailLabel ||
    props.confidence?.detailLabel ||
    props.note ||
    "";

  if (!props.confidence && !detailText) return null;

  return (
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        {props.confidence ? (
          <AvailabilityConfidence
            confidence={props.confidence}
            compact={true}
            showDetail={false}
          />
        ) : null}
      </div>

      {detailText ? (
        <div class="sm:max-w-[280px] sm:text-right">
          <p class="text-[11px] leading-4" style="color:var(--ui-text-muted)">
            {detailText}
          </p>
          {props.note && props.note !== detailText ? (
            <p class="mt-1 text-[11px] leading-4" style="color:var(--ui-text-muted)">
              {props.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export const ResultPricePanel = component$((props: ResultPricePanelProps) => {
  const alignClass =
    props.align === "right" ? "text-left md:text-right" : "text-left";
  const supportClass =
    props.align === "right"
      ? "md:ml-auto md:max-w-[176px] xl:max-w-[200px]"
      : "max-w-[220px]";
  const hasEstimatedTotal =
    props.display.totalAmount != null &&
    props.display.estimatedFeesAmount != null;
  const totalLabel =
    props.display.totalLabel === "Estimated total"
      ? "Est. total"
      : props.display.totalLabel;

  return (
    <div class={["rounded-2xl px-3 py-3 shadow-sm", alignClass]} style="background:var(--ui-surface-muted)">
      <div class="text-3xl font-semibold leading-none" style="color:var(--ui-price)">
        {formatMoney(props.display.baseAmount, props.currency)}
        {props.display.baseQualifier ? (
          <span class="ml-1 text-sm font-normal" style="color:var(--ui-text-muted)">
            {formatPriceQualifier(props.display.baseQualifier)}
          </span>
        ) : null}
      </div>

      {props.display.baseTotalAmount != null && !hasEstimatedTotal ? (
        <p class="mt-2 text-xs leading-5" style="color:var(--ui-text-muted)">
          <span>{props.display.baseTotalLabel}</span>
          <span aria-hidden="true">: </span>
          <span class="font-medium" style="color:var(--ui-text)">
            {formatMoney(props.display.baseTotalAmount, props.currency)}
          </span>
          {props.display.unitCountLabel ? (
            <span class="ml-1 whitespace-nowrap">
              for {props.display.unitCountLabel}
            </span>
          ) : null}
        </p>
      ) : props.missingTotalText ? (
        <p class="mt-2 text-xs leading-5" style="color:var(--ui-text-muted)">
          {props.missingTotalText}
        </p>
      ) : null}

      {hasEstimatedTotal ? (
        <p class="mt-2 text-xs leading-5" style="color:var(--ui-text-muted)">
          <span>{totalLabel}</span>
          <span aria-hidden="true"> </span>
          <span class="font-medium" style="color:var(--ui-text)">
            {formatMoney(props.display.totalAmount, props.currency)}
          </span>
          {props.display.unitCountLabel ? (
            <span class="ml-1 whitespace-nowrap">
              for {props.display.unitCountLabel}
            </span>
          ) : null}
        </p>
      ) : null}

      {props.display.supportText ? (
        <p
          class={[
            "mt-2 text-[11px] leading-4",
            supportClass,
          ]}
          style="color:var(--ui-text-muted)"
        >
          {props.display.supportText}
        </p>
      ) : null}

      {props.display.delta &&
      props.display.delta.status !== "unchanged" &&
      props.display.delta.status !== "unavailable" ? (
        <p
          class={[
            "mt-2 text-xs font-medium",
            props.display.delta.status === "increased"
              ? "text-[color:var(--ui-danger,#b91c1c)]"
              : "text-[color:var(--ui-success,#0f766e)]",
          ]}
        >
          {formatPriceChange(props.display.delta, props.currency)}
        </p>
      ) : null}
    </div>
  );
});

export type ResultFactItem = {
  label: string;
  value: string;
  detail?: string | null;
};

type ResultCardScaffoldProps = {
  hasMedia?: boolean;
  hasFacts?: boolean;
  hasDetails?: boolean;
  hasWhyThis?: boolean;
  hasSecondaryActions?: boolean;
  hasPrice?: boolean;
  hasPrimaryAction?: boolean;
  hasTrust?: boolean;
};

type ResultFactGridProps = {
  items: ResultFactItem[];
  surface?: "panel" | "soft";
};

type ResultFactListProps = {
  items: ResultFactItem[];
  columns?: 1 | 2;
  columnsFrom?: "sm" | "md" | "lg" | "xl";
};

type ResultReasonCalloutProps = {
  label?: string;
  text: string;
};

type ResultTrustBarProps = {
  confidence?: AvailabilityConfidenceModel | null;
  freshness?: InventoryFreshnessModel | null;
  note?: string | null;
};

type ResultPricePanelProps = {
  display: PriceDisplayContract;
  currency: string;
  align?: "left" | "right";
  missingTotalText?: string | null;
};
