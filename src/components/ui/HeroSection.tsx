/**
 * CLAUDE-UI-002 — HeroSection primitive.
 *
 * Photographic hero with a guaranteed legibility scrim. Production passes a
 * real `imageUrl`; when omitted the palette's `--ui-hero` atmosphere gradient
 * stands in. A search panel / actions can be projected via the default slot.
 */
import { Slot, component$ } from "@builder.io/qwik";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Caption describing the intended photography (preview aid). */
  photoNote?: string;
  class?: string;
};

export const HeroSection = component$((props: HeroSectionProps) => {
  const bg = props.imageUrl
    ? `background-image:url(${props.imageUrl});background-size:cover;background-position:center`
    : "background-image:var(--ui-hero)";

  return (
    <section class={["relative isolate overflow-hidden", props.class]} style={bg}>
      <div class="absolute inset-0 -z-10" style="background-image:var(--ui-hero-scrim)" aria-hidden="true" />
      <div class="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <div class="max-w-3xl">
          {props.eyebrow ? (
            <p class="text-[11px] font-bold uppercase tracking-[0.18em]" style="color:rgba(255,255,255,0.82)">
              {props.eyebrow}
            </p>
          ) : null}
          <h1
            class="mt-2 text-balance text-3xl font-bold leading-[1.08] md:text-5xl"
            style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
          >
            {props.title}
          </h1>
          {props.subtitle ? (
            <p class="mt-3 max-w-[52ch] text-sm md:text-base" style="color:rgba(255,255,255,0.88)">
              {props.subtitle}
            </p>
          ) : null}

          <div class="mt-6">
            <Slot />
          </div>

          {props.photoNote ? (
            <p class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.70)">
              Photography direction: {props.photoNote}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
});
