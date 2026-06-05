import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    const verticalThemeClass = getVerticalThemeClass(props.heroOverlay);

    return (
      <div class={verticalThemeClass}>
        {props.breadcrumbs?.length ? (
          <div class="border-b border-[color:var(--color-border)]">
            <div class="mx-auto max-w-6xl px-4 py-3">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground imageUrl={props.heroImageUrl} overlay={props.heroOverlay}>
            <div class="mx-auto max-w-6xl px-4 py-12 md:py-18 lg:py-22">
              {/* Left-aligned editorial hero text */}
              <div class="max-w-lg">
                <div
                  class="mb-4 inline-block border border-[rgba(212,151,58,0.40)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
                  style="color: rgba(250,240,225,0.80); background: rgba(212,151,58,0.10); border-radius: 2px"
                >
                  {props.eyebrow}
                </div>
                <h1 class="text-4xl font-bold tracking-tight text-[color:var(--color-text-on-hero)] md:text-5xl">
                  {props.title}
                </h1>
                <div
                  class="mt-3 h-0.5 w-12"
                  style="background: linear-gradient(90deg, #C4614A, #D4973A)"
                />
                <p class="mt-4 text-sm leading-6 text-[color:var(--color-text-on-hero-muted)] md:text-base md:leading-7">
                  {props.description}
                </p>
              </div>

              <div class="mt-8 max-w-5xl">
                {props.searchCard}
              </div>

              {props.helperLinks?.length ? (
                <div class="mt-5 flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wide text-[rgba(250,240,225,0.50)]">
                    Popular
                  </span>
                  {props.helperLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      class="rounded border border-[rgba(250,240,225,0.20)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[color:var(--color-text-on-hero-muted)] backdrop-blur-sm transition hover:border-[rgba(212,151,58,0.40)] hover:bg-[rgba(212,151,58,0.12)] hover:text-[color:var(--color-text-on-hero)]"
                      style="border-radius: 3px"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </HeroBackground>
        </section>

        <main class="relative z-0 mx-auto max-w-6xl px-4 pt-10 pb-16">
          <Slot />
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
