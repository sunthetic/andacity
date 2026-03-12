import { component$ } from "@builder.io/qwik";

export const ResultsPagination = component$((props: ResultsPaginationProps) => {
  if (props.totalPages <= 1) return null;

  return (
    <nav
      class="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="Results pages"
    >
      <div class="text-sm text-[color:var(--color-text-muted)]">
        Page {props.page} of {props.totalPages}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        {props.prevHref ? (
          <a
            class={[
              "rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-white",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            href={props.prevHref}
            rel="prev"
            aria-disabled={props.disabled || undefined}
            tabIndex={props.disabled ? -1 : undefined}
          >
            Previous
          </a>
        ) : null}

        {props.pageLinks.map((link) => (
          <a
            key={link.label}
            class={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              link.active
                ? "border-[color:var(--color-action)] bg-[color:var(--color-primary-50)] text-[color:var(--color-action)]"
                : "border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text)] hover:bg-white",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            aria-disabled={props.disabled || undefined}
            tabIndex={props.disabled ? -1 : undefined}
          >
            {link.label}
          </a>
        ))}

        {props.nextHref ? (
          <a
            class={[
              "rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] transition hover:bg-white",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            href={props.nextHref}
            rel="next"
            aria-disabled={props.disabled || undefined}
            tabIndex={props.disabled ? -1 : undefined}
          >
            Next
          </a>
        ) : null}
      </div>
    </nav>
  );
});

export type ResultsPaginationLink = {
  label: string;
  href: string;
  active?: boolean;
};

type ResultsPaginationProps = {
  page: number;
  totalPages: number;
  prevHref?: string;
  nextHref?: string;
  pageLinks: ResultsPaginationLink[];
  disabled?: boolean;
};
