import { JSXOutput, Slot, component$ } from "@builder.io/qwik";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { Breadcrumbs } from "~/components/navigation/Breadcrumbs";

export const VerticalHeroSearchLayout = component$(
  (props: VerticalHeroSearchLayoutProps) => {
    return (
      <>
        {props.breadcrumbs?.length ? (
          <div class="border-b border-[color:var(--color-border)]">
            <div class="mx-auto max-w-6xl px-4 py-3.5">
              <Breadcrumbs items={props.breadcrumbs} />
            </div>
          </div>
        ) : null}

        <section class="relative z-20 overflow-visible">
          <HeroBackground
            imageUrl={props.heroImageUrl}
            overlay={props.heroOverlay}
          >
            <div class="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-18">
              <div class="mx-auto max-w-4xl text-center">
                <p class="text-sm font-medium text-[color:var(--color-text-on-hero-muted)]">
                  {props.eyebrow}
                </p>

                <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-on-hero)] md:text-5xl">
                  {props.title}
                </h1>

                <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-on-hero-muted)] md:text-base">
                  {props.description}
                </p>

                <div class="mt-6">{props.searchCard}</div>

                {props.helperLinks?.length ? (
                  <div class="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[color:var(--color-text-on-hero-muted)]">
                    <span>Popular:</span>

                    {props.helperLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        class="transition-colors hover:text-[color:var(--color-text-on-hero)]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </HeroBackground>
        </section>

        <main class="relative z-0 mx-auto max-w-6xl px-4 pt-10 pb-10 md:pb-12.5 lg:pb-16">
          <Slot />
        </main>
      </>
    );
  },
);

type VerticalHeroSearchLayoutProps = {
  breadcrumbs?: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description: string;
  heroImageUrl: string;
  heroOverlay?: "soft" | "base" | "strong";
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
