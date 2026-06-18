/**
 * CLAUDE-UI-009 — Hotel detail sample: media-first gallery.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-hotel-detail). A premium
 * editorial gallery: one large lead tile + a 2×2 thumbnail grid on desktop,
 * collapsing to a lead tile + a horizontal thumbnail strip on mobile. Tiles
 * are `--ui-hero` gradient placeholders (no remote image dependency, no broken
 * <img>), each `role="img"` with a descriptive caption-based label, so the
 * concept is fully accessible and degrades gracefully for hotels with weak or
 * missing imagery. A "View all N photos" affordance stands in for the future
 * lightbox. Photography drops into these slots later with no structural change.
 */
import { component$ } from "@builder.io/qwik";

type GalleryTileProps = {
  caption: string;
  index: number;
  total: number;
  class?: string;
  /** Subtle hue rotation so adjacent gradient tiles read as distinct photos. */
  hue?: number;
};

const GalleryTile = component$((props: GalleryTileProps) => (
  <div
    class={["relative overflow-hidden", props.class]}
    style={`background-image:var(--ui-hero);border-radius:var(--ui-radius);${
      props.hue ? `filter:hue-rotate(${props.hue}deg)` : ""
    }`}
    role="img"
    aria-label={`Photo ${props.index + 1} of ${props.total}: ${props.caption}`}
  >
    <span
      class="absolute inset-0"
      style="background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.32))"
      aria-hidden="true"
    />
    <span
      class="absolute bottom-2 left-2.5 text-[11px] font-medium text-white/85"
      aria-hidden="true"
    >
      {props.caption}
    </span>
  </div>
));

export const HotelGallery = component$(
  (props: { captions: string[]; photoCount: number; hotelName: string }) => {
    const total = props.photoCount;
    // Lead tile + up to 4 thumbnails; the 4th carries the "view all" overlay.
    const lead = props.captions[0] ?? "Hotel photo";
    const thumbs = props.captions.slice(1, 5);

    return (
      <section aria-label={`${props.hotelName} photo gallery`}>
        <div class="grid gap-2 lg:grid-cols-[1.7fr_1fr]">
          {/* Lead */}
          <GalleryTile
            caption={lead}
            index={0}
            total={total}
            class="h-60 sm:h-80 lg:h-[26rem]"
          />

          {/* Desktop 2×2 thumbnail grid */}
          <div class="hidden grid-cols-2 grid-rows-2 gap-2 lg:grid">
            {thumbs.map((caption, i) => (
              <div key={caption} class="relative">
                <GalleryTile
                  caption={caption}
                  index={i + 1}
                  total={total}
                  hue={(i + 1) * 14}
                  class="h-[12.6rem]"
                />
                {i === thumbs.length - 1 ? (
                  <button
                    type="button"
                    class="absolute inset-0 grid place-items-center rounded-[var(--ui-radius)] text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    style="background:rgba(8,12,22,0.42)"
                    aria-label={`View all ${total} photos`}
                  >
                    + View all {total} photos
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile thumbnail strip + count */}
        <div
          class="mt-2 flex items-center gap-2 overflow-x-auto lg:hidden"
          aria-hidden="true"
        >
          {thumbs.map((caption, i) => (
            <div
              key={caption}
              class="h-16 w-24 shrink-0 overflow-hidden"
              style={`background-image:var(--ui-hero);border-radius:var(--ui-radius-sm);filter:hue-rotate(${(i + 1) * 14}deg)`}
            />
          ))}
          <button
            type="button"
            class="ml-1 shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
          >
            All {total} photos
          </button>
        </div>
      </section>
    );
  },
);
