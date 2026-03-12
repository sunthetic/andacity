import { component$, type QRL } from '@builder.io/qwik'

export const UndoSnackbar = component$((props: UndoSnackbarProps) => {
  if (!props.message) return null

  return (
    <div class="fixed inset-x-0 bottom-4 z-[95] flex justify-center px-4">
      <div class="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:rgba(17,24,39,0.96)] px-4 py-3 text-white shadow-[var(--shadow-e3)]">
        <p class="text-sm">{props.message}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick$={props.onUndo$}
            class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:#111827]"
          >
            Undo
          </button>
          <button
            type="button"
            onClick$={props.onDismiss$}
            class="text-xs font-medium text-white/80 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
})

type UndoSnackbarProps = {
  message?: string | null
  onUndo$: QRL<() => void>
  onDismiss$: QRL<() => void>
}
