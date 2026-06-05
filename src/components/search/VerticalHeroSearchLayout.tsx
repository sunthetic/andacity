import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div class="border-b-2 border-[#0A0A08] bg-[#F8F8F5]">
            <div class="mx-auto max-w-6xl px-4 py-2.5">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-16">
              {/* Left-aligned bold layout */}
              <div class="max-w-2xl">
                {/* Eyebrow stamp */}
                <div
                  class="mb-4 inline-block border-2 border-white px-3 py-1"
                  style="background: var(--color-action, #0050FF)"
                >
                  <span class="text-xs font-black uppercase tracking-widest text-white">
                    {props.eyebrow}
                  </span>
                </div>

                <h1
                  class="text-4xl font-black uppercase text-white md:text-5xl lg:text-6xl"
                  style="letter-spacing: -0.03em; line-height: 1.0; text-shadow: 2px 2px 0 rgba(0,0,0,0.4)"
                >
                  {props.title}
                </h1>

                {/* Bold underline */}
                <div
                  class="mt-4 h-1 w-16"
                  style="background: var(--color-action, #0050FF)"
                />

                <p class="mt-4 max-w-lg text-sm font-semibold uppercase tracking-wide text-white/80">
                  {props.description}
                </p>
              </div>

              {/* Search card */}
              <div class="mt-8 max-w-5xl text-left">
                {props.searchCard}
              </div>

              {/* Helper links */}
              {props.helperLinks?.length ? (
                <div class="mt-4 max-w-5xl">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="text-xs font-black uppercase tracking-widest text-white/60">
                      Popular:
                    </span>

                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80 transition hover:border-[#AAFF00] hover:text-[#AAFF00]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </HeroBackground>
        </section>

        {/* Below-fold content — bordered top */}
        <main class="relative z-0 border-t-2 border-[#0A0A08] bg-[#F8F8F5]">
          <div class="mx-auto max-w-6xl px-4 pt-10 pb-10 md:pb-12 lg:pb-16">
            <Slot />
          </div>
        </main>
      </div>
    );
  },
);

const getVerticalThemeClass = (
  overlay: VerticalHeroSearchLayoutProps["heroOverlay"],
) => {
  if (overlay === "flights") return "t-vertical-theme t-vertical-theme-flights";
  if (overlay === "hotels") return "t-vertical-theme t-vertical-theme-hotels";
  if (overlay === "cars") return "t-vertical-theme t-vertical-theme-cars";
  return "";
};

type VerticalHeroSearchLayoutProps = {
  breadcrumbs?: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description: string;
  heroImageUrl: string;
  heroOverlay?: "soft" | "base" | "strong" | "flights" | "hotels" | "cars";
  searchCard: JSXOutput;
  helperLinks?: HelperLink[];
};

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type HelperLink = {
  label: string;
  href: string;
};
