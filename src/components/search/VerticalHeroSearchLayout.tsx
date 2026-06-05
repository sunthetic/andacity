import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div style="border-bottom: 1px solid rgba(200,160,255,0.12); background: rgba(22,1,32,0.70); backdrop-filter: blur(12px)">
            <div class="mx-auto max-w-6xl px-4 py-3">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
              {/* Elegant eyebrow */}
              <div
                class="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style="border: 1px solid rgba(245,200,66,0.30); background: rgba(245,200,66,0.08)"
              >
                <span class="h-1 w-1 rounded-full" style="background: #F5C842" />
                <span class="text-xs font-semibold tracking-wide" style="color: #F5C842">
                  {props.eyebrow}
                </span>
              </div>

              <h1
                class="max-w-2xl text-4xl font-bold md:text-5xl lg:text-6xl"
                style="color: #FFF8F0; letter-spacing: -0.025em; line-height: 1.08; text-shadow: 0 4px 24px rgba(22,1,32,0.40)"
              >
                {props.title}
              </h1>

              <p class="mt-4 max-w-lg text-base" style="color: rgba(240,232,216,0.68); line-height: 1.6">
                {props.description}
              </p>

              <div class="mt-8 max-w-5xl">
                {props.searchCard}
              </div>

              {props.helperLinks?.length ? (
                <div class="mt-4 max-w-5xl">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="text-xs" style="color: rgba(240,232,216,0.45)">Popular:</span>
                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="rounded-full px-3 py-1 text-xs font-medium transition hover:bg-white/10"
                        style="border: 1px solid rgba(200,160,255,0.22); color: rgba(240,232,216,0.70)"
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

        <main class="relative z-0" style="background: var(--color-bg)">
          <div class="mx-auto max-w-6xl px-4 pt-10 pb-10 md:pb-12 lg:pb-16">
            <Slot />
          </div>
        </main>
      </div>
    );
  },
);

const getVerticalThemeClass = (overlay: VerticalHeroSearchLayoutProps["heroOverlay"]) => {
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

type BreadcrumbItem = { label: string; href?: string };
type HelperLink = { label: string; href: string };
