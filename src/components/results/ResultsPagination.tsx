import { component$ } from "@builder.io/qwik";

export const ResultsPagination = component$((props: ResultsPaginationProps) => {
  if (props.totalPages <= 1) return null;

  return (
    <nav
      class="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="Results pages"
    >
      <div class="text-sm" style="color:var(--ui-text-muted)">
        Page {props.page} of {props.totalPages}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        {props.prevHref ? (
          <a
            class={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
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
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            style={
              link.active
                ? "background:var(--ui-accent-soft);border:1px solid var(--ui-primary);color:var(--ui-primary)"
                : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
            }
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
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
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
