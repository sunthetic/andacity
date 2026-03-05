import { component$ } from '@builder.io/qwik'

export const SearchMobileDrawerActions = component$((props: SearchMobileDrawerActionsProps) => {
  return (
    <>
      <div class="grid grid-cols-2 gap-2">
        <a class="t-badge flex items-center justify-center hover:bg-white" href={props.resetHref}>
          {props.resetLabel || 'Reset'}
        </a>
        <button class="t-btn-primary" type="submit">
          {props.applyLabel || 'Apply'}
        </button>
      </div>

      <div class="text-xs text-[color:var(--color-text-muted)]">
        {props.helperText || 'Applies to page 1 to avoid empty pages.'}
      </div>
    </>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchMobileDrawerActionsProps = {
  resetHref: string
  resetLabel?: string
  applyLabel?: string
  helperText?: string
}
