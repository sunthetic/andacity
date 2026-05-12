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
      <article class="t-card overflow-hidden transition hover:-translate-y-px hover:shadow-[var(--shadow-lg)]">
        <div
          class={[
            "grid gap-0",
            props.hasMedia
              ? "md:grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]"
              : undefined,
          ]}
        >
          {props.hasMedia ? (
            <div class="bg-[linear-gradient(145deg,var(--color-primary-50),var(--color-secondary-50))] md:shadow-[inset_-1px_0_0_var(--color-divider)]">
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
                <aside class="flex min-w-0 flex-col gap-4 rounded-2xl bg-[color:rgba(255,255,255,0.58)] p-3 shadow-[inset_1px_0_0_var(--color-divider),inset_0_1px_0_rgba(255,255,255,0.7)] md:p-0 md:pl-4 xl:pl-5">
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
              <div class="mt-4 rounded-2xl bg-[color:rgba(255,255,255,0.48)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
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

  const surfaceClass =
    props.surface === "soft"
      ? "bg-[color:var(--color-surface-3)]"
      : "bg-[color:var(--color-panel)]";

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
          class={[
            "rounded-xl px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_6px_16px_rgba(15,23,42,0.04)]",
            surfaceClass,
          ]}
        >
          <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            {item.label}
          </p>
          <p class="mt-1 text-sm font-semibold leading-5 text-[color:var(--color-text-strong)]">
            {item.value}
          </p>
          {item.detail ? (
            <p class="mt-1 text-[11px] leading-4 text-[color:var(--color-text-muted)]">
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
          class="min-w-0 rounded-lg bg-[linear-gradient(145deg,var(--color-surface-1),rgba(255,255,255,0.72))] px-3 py-2.5"
        >
          <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            {item.label}
          </dt>
          <dd class="mt-1 min-w-0 text-sm leading-5 text-[color:var(--color-text)]">
            {item.value ? (
              <span class="font-semibold text-[color:var(--color-text-strong)]">
                {item.value}
              </span>
            ) : null}
            {item.detail ? (
              <span class="text-[color:var(--color-text-muted)]">
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
      <div class="rounded-xl bg-[linear-gradient(135deg,var(--color-primary-50),var(--color-secondary-50))] px-4 py-3 shadow-[inset_3px_0_0_var(--color-action),0_8px_22px_rgba(37,99,235,0.08)]">
        <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-action)]">
          {props.label || "Why this result"}
        </p>
        <p class="mt-1 text-sm leading-5 text-[color:var(--color-text)]">
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
          <p class="text-[11px] leading-4 text-[color:var(--color-text-muted)]">
            {detailText}
          </p>
          {props.note && props.note !== detailText ? (
            <p class="mt-1 text-[11px] leading-4 text-[color:var(--color-text-muted)]">
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
    <div class={alignClass}>
      <div class="text-2xl font-semibold leading-none text-[color:var(--color-text-strong)]">
        {formatMoney(props.display.baseAmount, props.currency)}
        {props.display.baseQualifier ? (
          <span class="ml-1 text-sm font-normal text-[color:var(--color-text-muted)]">
            {formatPriceQualifier(props.display.baseQualifier)}
          </span>
        ) : null}
      </div>

      {props.display.baseTotalAmount != null && !hasEstimatedTotal ? (
        <p class="mt-2 text-xs leading-5 text-[color:var(--color-text-muted)]">
          <span>{props.display.baseTotalLabel}</span>
          <span aria-hidden="true">: </span>
          <span class="font-medium text-[color:var(--color-text)]">
            {formatMoney(props.display.baseTotalAmount, props.currency)}
          </span>
          {props.display.unitCountLabel ? (
            <span class="ml-1 whitespace-nowrap">
              for {props.display.unitCountLabel}
            </span>
          ) : null}
        </p>
      ) : props.missingTotalText ? (
        <p class="mt-2 text-xs leading-5 text-[color:var(--color-text-muted)]">
          {props.missingTotalText}
        </p>
      ) : null}

      {hasEstimatedTotal ? (
        <p class="mt-2 text-xs leading-5 text-[color:var(--color-text-muted)]">
          <span>{totalLabel}</span>
          <span aria-hidden="true"> </span>
          <span class="font-medium text-[color:var(--color-text)]">
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
            "mt-2 text-[11px] leading-4 text-[color:var(--color-text-subtle)]",
            supportClass,
          ]}
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
              ? "text-[color:var(--color-error,#b91c1c)]"
              : "text-[color:var(--color-success,#0f766e)]",
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
