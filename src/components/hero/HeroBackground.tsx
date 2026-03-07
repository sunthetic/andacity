import { Slot, component$ } from '@builder.io/qwik'

export const HeroBackground = component$((props: HeroBackgroundProps) => {
  const overlayClass = `t-hero-overlay-${props.overlay ?? 'base'}`

  return (
    <div class="relative isolate overflow-hidden">
      <div
        class="absolute inset-0 -z-20 bg-[color:var(--color-neutral-900)] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${props.imageUrl})` }}
        aria-hidden="true"
      />
      <div class={`absolute inset-0 -z-10 ${overlayClass}`} aria-hidden="true" />
      <div class="relative z-10">
        <Slot />
      </div>
    </div>
  )
})

type HeroBackgroundProps = {
  imageUrl: string
  overlay?: 'soft' | 'base' | 'strong'
}
