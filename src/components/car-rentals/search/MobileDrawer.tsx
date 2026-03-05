import { component$, Slot } from '@builder.io/qwik'

export const MobileDrawer = component$(({ title, onClose$ }: MobileDrawerProps) => (
  <div class="fixed inset-0 z-[60] lg:hidden">
    <button type="button" aria-label="Close" class="absolute inset-0 bg-black/30" onClick$={onClose$} />

    <div class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl border border-[color:var(--color-border)] bg-white shadow-[var(--shadow-e3)]">
      <div class="flex items-center justify-between gap-3 border-b border-[color:var(--color-divider)] px-4 py-4">
        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{title}</div>
        <button type="button" class="t-badge hover:bg-white" onClick$={onClose$}>
          Close
        </button>
      </div>

      <div class="max-h-[calc(85vh-64px)] overflow-auto px-4 py-4">
        <Slot />
      </div>
    </div>
  </div>
))

/* -----------------------------
   Types
----------------------------- */

type MobileDrawerProps = {
  title: string
  onClose$: import('@builder.io/qwik').QRL<() => void>
}
