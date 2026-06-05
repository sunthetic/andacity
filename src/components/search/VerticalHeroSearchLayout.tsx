import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div class="border-b border-[rgba(15,23,42,0.10)] bg-[#F8FAFC]">
            <div class="mx-auto max-w-6xl px-4 py-2.5">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-10 md:py-14">
              {/* Compact eyebrow tag */}
              <div
                class="mb-3 inline-flex items-center gap-2 rounded px-2.5 py-1"
                style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22)"
              >
                <span class="font-mono text-xs font-semibold uppercase tracking-wider text-white/80">
                  {props.eyebrow}
                </span>
              </div>

              <h1
                class="text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                style="letter-spacing: -0.02em; line-height: 1.12"
              >
                {props.title}
              </h1>

              <p class="mt-2 max-w-lg text-sm text-white/65 md:text-base" style="line-height: 1.6">
                {props.description}
              </p>

              <div class="mt-6 max-w-5xl">
                {props.searchCard}
              </div>

              {props.helperLinks?.length ? (
                <div class="mt-3 max-w-5xl">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span class="font-mono text-xs text-white/50">Popular:</span>
                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="rounded px-2.5 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                        style="border: 1px solid rgba(255,255,255,0.18)"
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

        <main class="relative z-0 bg-[#F8FAFC]">
          <div class="mx-auto max-w-6xl px-4 pt-8 pb-10 md:pb-12 lg:pb-16">
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
