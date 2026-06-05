import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div style="border-bottom: 1px solid rgba(196,97,74,0.12); background: rgba(13,6,0,0.70); backdrop-filter: blur(12px)">
            <div class="mx-auto max-w-6xl px-4 py-3">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
              {/* Editorial stamp badge (TERRA-style, dark ATLAS palette) */}
              <div class="mb-5 inline-flex items-center gap-2">
                <span
                  class="rounded px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style="border: 1.5px solid rgba(212,151,58,0.40); color: #D4973A; background: rgba(212,151,58,0.08); letter-spacing: 0.10em"
                >
                  {props.eyebrow}
                </span>
              </div>

              <h1
                class="max-w-2xl text-4xl font-bold md:text-5xl lg:text-6xl"
                style="color: #FBF4EA; letter-spacing: -0.025em; line-height: 1.08; text-shadow: 0 4px 24px rgba(13,6,0,0.40)"
              >
                {props.title}
              </h1>

              <p class="mt-4 max-w-lg text-base" style="color: rgba(239,230,214,0.65); line-height: 1.65">
                {props.description}
              </p>

              <div class="mt-8 max-w-5xl">
                {props.searchCard}
              </div>

              {props.helperLinks?.length ? (
                <div class="mt-4 max-w-5xl">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="text-xs font-bold uppercase tracking-wider" style="color: rgba(239,230,214,0.40); letter-spacing: 0.08em">Popular:</span>
                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="rounded px-3 py-1 text-xs font-medium transition hover:bg-white/08"
                        style="border: 1px solid rgba(196,97,74,0.24); color: rgba(239,230,214,0.70)"
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
