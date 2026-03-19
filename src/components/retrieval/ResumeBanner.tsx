import { component$ } from "@builder.io/qwik";

export const ResumeBanner = component$(
  (props: {
    href: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    refLabel?: string | null;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.title || "Continue your trip"}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.description ||
                "We saved your latest booking progress. Reopen your post-booking details any time."}
            </p>
            {props.refLabel ? (
              <p class="mt-2 text-xs uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                {props.refLabel}
              </p>
            ) : null}
          </div>

          <a
            href={props.href}
            class="rounded-lg bg-[color:var(--color-action)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {props.ctaLabel || "Resume"}
          </a>
        </div>
      </section>
    );
  },
);
