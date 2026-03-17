import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { readEntitySearchFlow } from "~/lib/entities/search-flow";

export const EntitySearchFlowLinks = component$(
  (props: EntitySearchFlowLinksProps) => {
    const location = useLocation();
    const flow = readEntitySearchFlow(location.url);
    const backHref = flow.returnTo || props.searchHref;
    const modifyHref = flow.modifySearch || props.searchHref;
    const backLabel = flow.returnTo ? "Back to results" : "Back to search";

    return (
      <section class="mt-4 flex flex-wrap items-center gap-3">
        <a
          class="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white/90 px-5 text-sm font-semibold text-[color:var(--color-text-strong)] transition hover:border-[color:var(--color-action)] hover:text-[color:var(--color-action)]"
          href={backHref}
        >
          {backLabel}
        </a>
        <a
          class="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white/70 px-5 text-sm font-semibold text-[color:var(--color-action)] transition hover:border-[color:var(--color-action)]"
          href={modifyHref}
        >
          Modify search
        </a>
      </section>
    );
  },
);

type EntitySearchFlowLinksProps = {
  searchHref: string;
};
