import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@builder.io/qwik";
import {
  discoverLocations,
  searchLocations,
} from "~/lib/location/searchLocations";
import type { CanonicalLocation } from "~/types/location";

export const LocationAutosuggestField = component$(
  (props: LocationAutosuggestFieldProps) => {
    const suggestions = useSignal<CanonicalLocation[]>([]);
    const open = useSignal(false);
    const loading = useSignal(false);
    const errorMessage = useSignal<string | null>(null);
    const statusMessage = useSignal("");
    const highlightedIndex = useSignal(-1);
    const rootRef = useSignal<HTMLElement>();
    const requestSequence = useSignal(0);
    const discoveryCoordinates = useSignal<{
      latitude: number;
      longitude: number;
    } | null>();
    const geolocationRequested = useSignal(false);
    const listboxId = `${props.id}-suggestions`;

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      const rootEl = track(() => rootRef.value);
      if (!(rootEl instanceof HTMLElement)) return;

      const onDocumentClick = (event: MouseEvent) => {
        if (!(event.target instanceof Node)) return;
        if (rootEl.contains(event.target)) return;
        open.value = false;
        highlightedIndex.value = -1;
      };

      document.addEventListener("click", onDocumentClick);
      cleanup(() => {
        document.removeEventListener("click", onDocumentClick);
      });
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      const isOpen = track(() => open.value);
      const disabled = track(() => props.disabled === true);
      const rawQuery = track(() => props.value.value);
      const selectedDisplay = track(
        () => props.selectedLocation.value?.displayName || "",
      );
      const discoveryEnabled = track(() => props.enableDiscovery !== false);
      const geolocationDiscoveryEnabled = track(
        () => props.enableGeolocationDiscovery !== false,
      );
      const query = String(rawQuery || "").trim();
      const hasSelectedDisplay =
        Boolean(selectedDisplay) && query === selectedDisplay;

      if (
        !discoveryEnabled ||
        !geolocationDiscoveryEnabled ||
        disabled ||
        !isOpen ||
        query.length > 0 ||
        hasSelectedDisplay ||
        geolocationRequested.value
      ) {
        return;
      }

      geolocationRequested.value = true;
      if (!("geolocation" in navigator)) {
        discoveryCoordinates.value = null;
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          discoveryCoordinates.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        },
        () => {
          discoveryCoordinates.value = null;
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 300_000,
        },
      );
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      const rawQuery = track(() => props.value.value);
      const isOpen = track(() => open.value);
      const selectedDisplay = track(
        () => props.selectedLocation.value?.displayName || "",
      );
      const disabled = track(() => props.disabled === true);
      const discoveryEnabled = track(() => props.enableDiscovery !== false);
      const coords = track(() => discoveryCoordinates.value);
      const query = String(rawQuery || "").trim();
      const hasSelectedDisplay =
        Boolean(selectedDisplay) && query === selectedDisplay;

      if (disabled || !isOpen || hasSelectedDisplay) {
        loading.value = false;
        errorMessage.value = null;
        if (!isOpen || hasSelectedDisplay) {
          suggestions.value = [];
          highlightedIndex.value = -1;
        }
        if (!query.length) statusMessage.value = "";
        return;
      }

      if (query.length > 0 && query.length < 2) {
        loading.value = false;
        errorMessage.value = null;
        suggestions.value = [];
        highlightedIndex.value = -1;
        statusMessage.value = "Type at least 2 characters to search.";
        return;
      }

      if (!query.length && !discoveryEnabled) {
        loading.value = false;
        errorMessage.value = null;
        suggestions.value = [];
        highlightedIndex.value = -1;
        statusMessage.value = "";
        return;
      }

      const nextRequest = requestSequence.value + 1;
      requestSequence.value = nextRequest;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        async () => {
          try {
            loading.value = true;
            errorMessage.value = null;
            const results = query.length
              ? await searchLocations(query, {
                  limit: props.resultLimit,
                  signal: controller.signal,
                })
              : await discoverLocations({
                  limit: Math.max(3, Math.min(props.resultLimit || 5, 6)),
                  latitude: coords?.latitude,
                  longitude: coords?.longitude,
                  signal: controller.signal,
                });
            if (requestSequence.value !== nextRequest) return;

            suggestions.value = results;
            highlightedIndex.value = results.length ? 0 : -1;
            statusMessage.value = results.length
              ? !query.length
                ? `${results.length} suggested destinations available.`
                : `${results.length} suggestions available.`
              : !query.length
                ? "No suggested destinations available."
                : "No matching locations found.";
          } catch (error) {
            if (controller.signal.aborted) return;
            suggestions.value = [];
            highlightedIndex.value = -1;
            errorMessage.value =
              error instanceof Error
                ? error.message
                : "Unable to load location suggestions.";
            statusMessage.value = "Unable to load location suggestions.";
          } finally {
            if (
              !controller.signal.aborted &&
              requestSequence.value === nextRequest
            ) {
              loading.value = false;
            }
          }
        },
        query.length ? 150 : 0,
      );

      cleanup(() => {
        controller.abort();
        window.clearTimeout(timeoutId);
      });
    });

    const selectLocation$ = $(async (location: CanonicalLocation) => {
      props.selectedLocation.value = location;
      props.value.value = location.displayName;
      open.value = false;
      suggestions.value = [];
      highlightedIndex.value = -1;
      loading.value = false;
      errorMessage.value = null;
      statusMessage.value = `${location.displayName} selected.`;

      if (props.onSelect$) {
        await props.onSelect$(location);
      }
    });

    const activeSuggestion =
      highlightedIndex.value >= 0
        ? suggestions.value[highlightedIndex.value]
        : null;

    return (
      <div ref={rootRef} class={["relative", props.class]}>
        <input
          id={props.id}
          name={props.name}
          type="text"
          value={props.value.value}
          placeholder={props.placeholder || "City or airport"}
          inputMode="search"
          autoComplete="off"
          spellcheck={false}
          disabled={props.disabled}
          required={props.required}
          aria-label={props.ariaLabel}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open.value ? "true" : "false"}
          aria-haspopup="listbox"
          aria-activedescendant={
            activeSuggestion
              ? `${props.id}-option-${highlightedIndex.value}`
              : undefined
          }
          class={props.inputClass}
          onFocus$={() => {
            const query = String(props.value.value || "").trim();
            if (!query.length || query.length >= 2) {
              open.value = true;
            }
          }}
          onInput$={(_, inputEl) => {
            const nextValue = inputEl.value;
            props.value.value = nextValue;
            open.value = true;
            errorMessage.value = null;

            if (props.selectedLocation.value?.displayName !== nextValue) {
              props.selectedLocation.value = null;
            }
          }}
          onKeyDown$={async (event) => {
            if (!open.value) {
              const query = props.value.value.trim();
              if (
                event.key === "ArrowDown" &&
                (!query.length || query.length >= 2)
              ) {
                open.value = true;
              }
              return;
            }

            if (!suggestions.value.length) {
              if (event.key === "Escape") {
                open.value = false;
                highlightedIndex.value = -1;
              }
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              highlightedIndex.value =
                highlightedIndex.value < suggestions.value.length - 1
                  ? highlightedIndex.value + 1
                  : 0;
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              highlightedIndex.value =
                highlightedIndex.value > 0
                  ? highlightedIndex.value - 1
                  : suggestions.value.length - 1;
              return;
            }

            if (event.key === "Enter" && highlightedIndex.value >= 0) {
              event.preventDefault();
              const selected = suggestions.value[highlightedIndex.value];
              if (selected) {
                await selectLocation$(selected);
              }
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              open.value = false;
              highlightedIndex.value = -1;
            }
          }}
        />

        <input
          type="hidden"
          name={props.selectionName}
          value={
            props.selectedLocation.value
              ? JSON.stringify(props.selectedLocation.value)
              : ""
          }
          disabled={props.disabled}
        />

        <div class="sr-only" aria-live="polite">
          {statusMessage.value}
        </div>

        {open.value ? (
          <div
            id={listboxId}
            role="listbox"
            class="absolute left-0 top-full z-30 mt-2 max-h-72 min-w-full max-w-[min(48rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface)] shadow-[var(--shadow-lg)] [width:max-content]"
          >
            {loading.value ? (
              <div class="px-3 py-2 text-sm text-[color:var(--color-text-muted)]">
                {String(props.value.value || "").trim().length
                  ? "Searching locations..."
                  : "Loading suggestions..."}
              </div>
            ) : errorMessage.value ? (
              <div class="px-3 py-2 text-sm text-[color:var(--color-danger,#b91c1c)]">
                {errorMessage.value}
              </div>
            ) : suggestions.value.length ? (
              suggestions.value.map((location, index) => {
                const isHighlighted = index === highlightedIndex.value;
                const isSelected =
                  props.selectedLocation.value?.locationId ===
                  location.locationId;

                return (
                  <button
                    key={location.locationId}
                    id={`${props.id}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted ? "true" : "false"}
                    class={[
                      "flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      isHighlighted
                        ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-text-strong)]"
                        : "text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-elevated)]",
                    ]}
                    onMouseDown$={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter$={() => {
                      highlightedIndex.value = index;
                    }}
                    onClick$={async () => {
                      await selectLocation$(location);
                    }}
                  >
                    <span class="min-w-0">
                      <span class="block break-words sm:whitespace-nowrap">
                        {location.displayName}
                      </span>
                      <span class="mt-0.5 block text-xs text-[color:var(--color-text-muted)]">
                        {typeof location.providerMetadata?.suggestionReason ===
                        "string"
                          ? location.providerMetadata.suggestionReason
                          : location.kind === "airport"
                            ? "Airport"
                            : location.kind === "city"
                              ? "City"
                              : "Location"}
                      </span>
                    </span>

                    {isSelected ? (
                      <span class="text-xs font-semibold text-[color:var(--color-action)]">
                        Selected
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div class="px-3 py-2 text-sm text-[color:var(--color-text-muted)]">
                No matching locations found.
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  },
);

type LocationAutosuggestFieldProps = {
  id: string;
  selectionName: string;
  value: Signal<string>;
  selectedLocation: Signal<CanonicalLocation | null>;
  name?: string;
  placeholder?: string;
  ariaLabel?: string;
  inputClass?: string;
  class?: string;
  disabled?: boolean;
  required?: boolean;
  resultLimit?: number;
  enableDiscovery?: boolean;
  enableGeolocationDiscovery?: boolean;
  onSelect$?: QRL<(location: CanonicalLocation) => void>;
};
