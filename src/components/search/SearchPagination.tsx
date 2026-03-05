import { component$ } from '@builder.io/qwik'

export const SearchPagination = component$((props: SearchPaginationProps) => {
  if (props.totalPages <= 1) return null

  return (
    <nav class="mt-6 flex flex-wrap items-center gap-2">
      <a
        class="t-badge hover:bg-white"
        href={props.pageHref(Math.max(1, props.page - 1))}
        aria-disabled={props.page <= 1}
      >
        ← Prev
      </a>

      {props.pages.map((p) => (
        <a
          key={p}
          class={p === props.page ? 't-badge t-badge--deal' : 't-badge hover:bg-white'}
          href={props.pageHref(p)}
        >
          {p}
        </a>
      ))}

      <a
        class="t-badge hover:bg-white"
        href={props.pageHref(Math.min(props.totalPages, props.page + 1))}
        aria-disabled={props.page >= props.totalPages}
      >
        Next →
      </a>
    </nav>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchPaginationProps = {
  page: number
  totalPages: number
  pages: number[]
  pageHref: (page: number) => string
}
