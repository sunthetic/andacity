import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div class="border-b border-[rgba(27,45,66,0.08)] bg-white/70 backdrop-blur-sm">
            <div class="mx-auto max-w-6xl px-4 py-3">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
              <div class="max-w-xl">
                {/* Eyebrow pill */}
                <div
                  class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 backdrop-blur-sm"
                  style="background: rgba(255,255,255,0.12)"
                >
                  <span class="text-xs font-semibold tracking-wide text-white/90">
                    {props.eyebrow}
                  </span>
                </div>

                <h1
                  class="text-4xl font-bold text-white md:text-5xl lg:text-6xl"
                  style="letter-spacing: -0.025em; line-height: 1.08; text-shadow: 0 2px 20px rgba(14,30,46,0.30)"
                >
                  {props.title}
                </h1>

                <p class="mt-4 max-w-md text-base text-white/75 md:text-lg" style="line-height: 1.6">
                  {props.description}
                </p>
              </div>

              <div class="mt-8 max-w-5xl">
                {props.searchCard}
              </div>

              {props.helperLinks?.length ? (
                <div class="mt-4 max-w-5xl">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="text-xs font-medium text-white/60">Popular:</span>
                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/75 transition hover:border-white/50 hover:text-white hover:bg-white/10"
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

        <main class="relative z-0 bg-[#FAFCFB]">
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
