import { $, component$, useSignal } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import { ListSkeleton } from "~/components/async/AsyncSurfaceSkeleton";
import {
  markBookingStageProgress,
  trackBookingEvent,
} from "~/lib/analytics/booking-telemetry";
import {
  parseAddToTripContextTripId,
  readAddToTripErrorNotice,
} from "~/lib/trips/add-to-trip-feedback";
import {
  addBookableEntityToTripApi,
  createTripApi,
  listTripsApi,
  TripApiError,
} from "~/lib/trips/trips-api";
import { useOverlayBehavior } from "~/lib/ui/overlay";
import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type { TripListItem } from "~/types/trips/trip";

type BookableEntityAddToTripCta = {
  label: string;
  disabled: boolean;
  note: string;
  inventoryId: string;
  canonicalPath: string;
};

const resolvePreferredTripId = (
  trips: TripListItem[],
  preferredTripId: number | null,
  selectedTripId: number | null,
) => {
  if (
    selectedTripId != null &&
    trips.some((trip) => trip.id === selectedTripId)
  ) {
    return selectedTripId;
  }

  if (
    preferredTripId != null &&
    trips.some((trip) => trip.id === preferredTripId)
  ) {
    return preferredTripId;
  }

  return trips[0]?.id || null;
};

const statusMessageClass = (tone: "success" | "muted") =>
  tone === "success"
    ? "text-[color:var(--color-success,#0f766e)]"
    : "text-[color:var(--color-text-muted)]";

export const BookableEntityAddToTripForm = component$(
  (props: BookableEntityAddToTripFormProps) => {
    const location = useLocation();
    const feedback = readAddToTripErrorNotice(location.url);
    const preferredTripId = parseAddToTripContextTripId(
      location.url.searchParams.get("trip"),
    );
    const telemetryVertical =
      props.vertical === "flight"
        ? "flights"
        : props.vertical === "hotel"
          ? "hotels"
          : "cars";
    const open = useSignal(false);
    const loading = useSignal(false);
    const saving = useSignal(false);
    const error = useSignal<string | null>(null);
    const success = useSignal<string | null>(null);
    const successTripId = useSignal<number | null>(null);
    const lastSaveAction = useSignal<"add" | "create" | null>(null);
    const trips = useSignal<TripListItem[]>([]);
    const selectedTripId = useSignal<number | null>(preferredTripId);
    const newTripName = useSignal("");
    const onClose$ = $(() => {
      open.value = false;
    });
    const { overlayRef, initialFocusRef } = useOverlayBehavior({
      open,
      onClose$,
    });

    const refreshTrips$ = $(async () => {
      if (loading.value) return;
      loading.value = true;
      error.value = null;

      try {
        const nextTrips = await listTripsApi();
        trips.value = nextTrips;
        selectedTripId.value = resolvePreferredTripId(
          nextTrips,
          preferredTripId,
          selectedTripId.value,
        );
      } catch (cause) {
        const message =
          cause instanceof TripApiError
            ? cause.message
            : "Failed to load trips.";
        error.value = message;
        trackBookingEvent("booking_error", {
          vertical: telemetryVertical,
          surface: "detail",
          action: "load_trips",
          item_id: props.entity.inventoryId,
          error_message: message,
        });
      } finally {
        loading.value = false;
      }
    });

    const onOpen$ = $(async () => {
      if (props.cta.disabled || loading.value || saving.value) return;

      success.value = null;
      successTripId.value = null;
      trackBookingEvent("booking_add_to_trip_started", {
        vertical: telemetryVertical,
        surface: "detail",
        item_id: props.entity.inventoryId,
      });
      open.value = true;
      await refreshTrips$();
    });

    const onAddToSelected$ = $(async () => {
      if (!selectedTripId.value || saving.value || props.cta.disabled) return;

      saving.value = true;
      error.value = null;
      success.value = null;
      successTripId.value = null;
      lastSaveAction.value = "add";

      try {
        const trip = await addBookableEntityToTripApi(
          selectedTripId.value,
          props.entity,
        );
        successTripId.value = trip.id;
        success.value = `Added to ${trip.name}.`;
        open.value = false;
        await refreshTrips$();
        markBookingStageProgress("detail");
        trackBookingEvent("booking_add_to_trip_completed", {
          vertical: telemetryVertical,
          surface: "detail",
          item_id: props.entity.inventoryId,
          action: "add_existing_trip",
          trip_id: trip.id,
          outcome: "success",
        });
      } catch (cause) {
        const message =
          cause instanceof TripApiError
            ? cause.message
            : "Failed to add item to trip.";
        error.value = message;
        trackBookingEvent("booking_add_to_trip_completed", {
          vertical: telemetryVertical,
          surface: "detail",
          item_id: props.entity.inventoryId,
          action: "add_existing_trip",
          outcome: "failure",
          error_message: message,
        });
        trackBookingEvent("booking_error", {
          vertical: telemetryVertical,
          surface: "detail",
          action: "add_to_trip",
          item_id: props.entity.inventoryId,
          error_message: message,
        });
      } finally {
        saving.value = false;
      }
    });

    const onCreateAndAdd$ = $(async () => {
      if (saving.value || props.cta.disabled) return;

      saving.value = true;
      error.value = null;
      success.value = null;
      successTripId.value = null;
      lastSaveAction.value = "create";

      try {
        const created = await createTripApi({
          name:
            String(newTripName.value || "").trim() ||
            `Trip for ${props.entity.title}`,
        });
        const trip = await addBookableEntityToTripApi(created.id, props.entity);
        selectedTripId.value = trip.id;
        newTripName.value = "";
        successTripId.value = trip.id;
        success.value = `Created and added to ${trip.name}.`;
        open.value = false;
        await refreshTrips$();
        markBookingStageProgress("detail");
        trackBookingEvent("booking_add_to_trip_completed", {
          vertical: telemetryVertical,
          surface: "detail",
          item_id: props.entity.inventoryId,
          action: "create_trip_and_add",
          trip_id: trip.id,
          outcome: "success",
        });
      } catch (cause) {
        const message =
          cause instanceof TripApiError
            ? cause.message
            : "Failed to create trip.";
        error.value = message;
        trackBookingEvent("booking_add_to_trip_completed", {
          vertical: telemetryVertical,
          surface: "detail",
          item_id: props.entity.inventoryId,
          action: "create_trip_and_add",
          outcome: "failure",
          error_message: message,
        });
        trackBookingEvent("booking_error", {
          vertical: telemetryVertical,
          surface: "detail",
          action: "create_trip_and_add",
          item_id: props.entity.inventoryId,
          error_message: message,
        });
      } finally {
        saving.value = false;
      }
    });

    return (
      <div class="mt-6">
        {feedback ? (
          <AsyncStateNotice
            state="failed"
            title={feedback.title}
            message={feedback.message}
            class="mb-4"
          />
        ) : null}

        <button
          type="button"
          disabled={props.cta.disabled}
          data-bookable-vertical={props.vertical}
          data-bookable-inventory-id={props.cta.inventoryId}
          data-bookable-canonical-path={props.cta.canonicalPath}
          class="t-btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          onClick$={onOpen$}
        >
          {props.cta.label}
        </button>

        {success.value ? (
          <div
            class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
            role="status"
            aria-live="polite"
          >
            <span class={statusMessageClass("success")}>{success.value}</span>
            {successTripId.value ? (
              <a
                href={`/trips?trip=${successTripId.value}`}
                class="font-medium text-[color:var(--color-action)]"
              >
                Open trip builder
              </a>
            ) : null}
          </div>
        ) : null}

        <p
          class={[
            "mt-3 text-sm leading-6",
            statusMessageClass(success.value ? "muted" : "muted"),
          ]}
        >
          {props.cta.note}
        </p>

        {open.value ? (
          <div class="fixed inset-0 z-[95]">
            <button
              type="button"
              class="absolute inset-0 bg-black/35"
              aria-label="Close add-to-trip dialog"
              onClick$={onClose$}
            />

            <section
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              aria-label="Add to trip"
              tabIndex={-1}
              class="absolute inset-x-3 top-1/2 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-e3)] outline-none sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2"
            >
              <header class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    Add to trip
                  </h3>
                  <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {props.entity.title}
                  </p>
                </div>
                <button
                  ref={initialFocusRef}
                  type="button"
                  class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)]"
                  onClick$={onClose$}
                >
                  Close
                </button>
              </header>

              {loading.value && !trips.value.length ? (
                <div class="mt-4">
                  <ListSkeleton count={2} />
                </div>
              ) : error.value && !trips.value.length ? (
                <div class="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-4">
                  <AsyncRetryControl
                    message={error.value}
                    label="Retry trips"
                    onRetry$={refreshTrips$}
                    telemetry={{
                      vertical: telemetryVertical,
                      surface: "detail",
                      retryType: "load_trips",
                      context: "add_to_trip_dialog",
                    }}
                  />
                </div>
              ) : (
                <>
                  <div class="mt-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                      Existing trips
                    </p>
                    {trips.value.length ? (
                      <div class="mt-2 grid gap-2">
                        {trips.value.map((trip) => (
                          <label
                            key={trip.id}
                            class="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-3 py-2"
                          >
                            <span class="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`entity-trip-choice-${props.entity.inventoryId}`}
                                checked={selectedTripId.value === trip.id}
                                onChange$={() => {
                                  selectedTripId.value = trip.id;
                                }}
                              />
                              <span class="text-sm text-[color:var(--color-text-strong)]">
                                {trip.name}
                              </span>
                            </span>
                            <span class="text-xs text-[color:var(--color-text-muted)]">
                              {trip.itemCount} items
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                        No trips yet. Create one below to save this item.
                      </p>
                    )}

                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <AsyncPendingButton
                        class="t-btn-primary px-3 py-1.5 text-xs"
                        pending={saving.value && success.value == null}
                        pendingLabel="Adding..."
                        disabled={
                          !selectedTripId.value ||
                          (saving.value && success.value == null)
                        }
                        onClick$={onAddToSelected$}
                      >
                        Add to selected trip
                      </AsyncPendingButton>
                    </div>
                  </div>

                  <div class="mt-5 border-t border-[color:var(--color-divider)] pt-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                      Create new trip
                    </p>
                    <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        type="text"
                        value={newTripName.value}
                        onInput$={(event, target) => {
                          void event;
                          newTripName.value = target.value;
                        }}
                        placeholder="Summer planning"
                        class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                      />
                      <AsyncPendingButton
                        class="t-btn-ghost px-3 py-2 text-sm"
                        pending={saving.value && success.value == null}
                        pendingLabel="Creating..."
                        disabled={saving.value && success.value == null}
                        onClick$={onCreateAndAdd$}
                      >
                        Create + add
                      </AsyncPendingButton>
                    </div>
                  </div>

                  {error.value ? (
                    <AsyncRetryControl
                      class="mt-3"
                      message={error.value}
                      label={
                        trips.value.length
                          ? lastSaveAction.value === "create"
                            ? "Retry create"
                            : "Retry add"
                          : "Retry trips"
                      }
                      onRetry$={
                        trips.value.length
                          ? lastSaveAction.value === "create"
                            ? onCreateAndAdd$
                            : onAddToSelected$
                          : refreshTrips$
                      }
                      telemetry={{
                        vertical: telemetryVertical,
                        surface: "detail",
                        retryType:
                          trips.value.length &&
                          lastSaveAction.value === "create"
                            ? "create_trip_and_add"
                            : trips.value.length
                              ? "add_to_trip"
                              : "load_trips",
                        context: "add_to_trip_dialog",
                      }}
                    />
                  ) : null}
                </>
              )}
            </section>
          </div>
        ) : null}
      </div>
    );
  },
);

type BookableEntityAddToTripFormProps = {
  cta: BookableEntityAddToTripCta;
  entity: BookableEntity;
  vertical: BookableVertical;
};
