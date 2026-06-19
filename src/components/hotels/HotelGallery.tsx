/**
 * Production hotel detail gallery.
 *
 * Media-first layout: one large lead tile + a 2×2 thumbnail grid on desktop,
 * collapsing to a lead tile + horizontal strip on mobile.
 *
 * Real hotel images are used when available; gradient (`--ui-hero`) placeholder
 * tiles are rendered defensively when images are absent, broken, or incomplete.
 * No broken <img> states. Full lightbox is deferred work.
 */
import { component$ } from "@builder.io/qwik";

const HUE_OFFSETS = [0, 14, 28, 42, 56];

type GalleryTileProps = {
  src?: string;
  alt: string;
  caption?: string;
  index: number;
  total: number;
  class?: string;
  hue?: number;
  showViewAll?: boolean;
  totalPhotos?: number;
};

const GalleryTile = component$((props: GalleryTileProps) => {
  const label = props.caption
    ? `Photo ${props.index + 1} of ${props.total}: ${props.caption}`
    : props.alt;

  if (props.src) {
    return (
      <div
        class={["relative overflow-hidden", props.class]}
        style="border-radius:var(--ui-radius)"
      >
        <img
          src={props.src}
          alt={props.alt}
          class="h-full w-full object-cover"
          loading={props.index === 0 ? "eager" : "lazy"}
          width={props.index === 0 ? 1280 : 640}
          height={props.index === 0 ? 768 : 480}
        />
        <span
          class="pointer-events-none absolute inset-0"
          style="background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.24))"
          aria-hidden="true"
        />
        {props.showViewAll && props.totalPhotos ? (
          <button
            type="button"
            class="absolute inset-0 grid place-items-center rounded-[var(--ui-radius)] text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style="background:rgba(8,12,22,0.40)"
            aria-label={`View all ${props.totalPhotos} photos`}
          >
            + View all {props.totalPhotos} photos
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      class={["relative overflow-hidden", props.class]}
      style={`background-image:var(--ui-hero);border-radius:var(--ui-radius);${props.hue ? `filter:hue-rotate(${props.hue}deg)` : ""}`}
      role="img"
      aria-label={label}
    >
      <span
        class="absolute inset-0"
        style="background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.28))"
        aria-hidden="true"
      />
      {props.showViewAll && props.totalPhotos ? (
        <button
          type="button"
          class="absolute inset-0 grid place-items-center rounded-[var(--ui-radius)] text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style="background:rgba(8,12,22,0.32)"
          aria-label={`View all ${props.totalPhotos} photos`}
        >
          + View all {props.totalPhotos} photos
        </button>
      ) : null}
    </div>
  );
});

export const HotelGallery = component$(
  (props: { images: string[]; hotelName: string }) => {
    const images = props.images ?? [];
    const total = images.length;
    const leadSrc = images[0];
    const thumbSrcs = images.slice(1, 5);
    const displayTotal = total;
    const thumbCount = 4;

    return (
      <section aria-label={`${props.hotelName} photo gallery`}>
        <div class="grid gap-2 lg:grid-cols-[1.7fr_1fr]">
          {/* Lead image */}
          <GalleryTile
            src={leadSrc}
            alt={props.hotelName}
            index={0}
            total={Math.max(displayTotal, 1)}
            class="h-60 sm:h-80 lg:h-[26rem]"
            hue={0}
          />

          {/* Desktop 2×2 thumbnail grid */}
          <div class="hidden grid-cols-2 grid-rows-2 gap-2 lg:grid">
            {Array.from({ length: thumbCount }).map((_, i) => (
              <GalleryTile
                key={i}
                src={thumbSrcs[i]}
                alt={`${props.hotelName} photo ${i + 2}`}
                index={i + 1}
                total={Math.max(displayTotal, 1)}
                hue={HUE_OFFSETS[i + 1]}
                class="h-[12.6rem]"
                showViewAll={
                  i === thumbCount - 1 && displayTotal > thumbCount + 1
                }
                totalPhotos={displayTotal}
              />
            ))}
          </div>
        </div>

        {/* Mobile thumbnail strip */}
        <div
          class="mt-2 flex items-center gap-2 overflow-x-auto lg:hidden"
          aria-hidden="true"
        >
          {Array.from({ length: Math.min(thumbCount, Math.max(4, thumbSrcs.length)) }).map(
            (_, i) =>
              thumbSrcs[i] ? (
                <div
                  key={i}
                  class="h-16 w-24 shrink-0 overflow-hidden"
                  style="border-radius:var(--ui-radius-sm)"
                >
                  <img
                    src={thumbSrcs[i]}
                    alt=""
                    class="h-full w-full object-cover"
                    loading="lazy"
                    width={96}
                    height={64}
                  />
                </div>
              ) : (
                <div
                  key={i}
                  class="h-16 w-24 shrink-0 overflow-hidden"
                  style={`background-image:var(--ui-hero);border-radius:var(--ui-radius-sm);filter:hue-rotate(${(i + 1) * 14}deg)`}
                />
              ),
          )}
          {displayTotal > 1 ? (
            <button
              type="button"
              class="ml-1 shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
            >
              All {displayTotal} photos
            </button>
          ) : null}
        </div>
      </section>
    );
  },
);
