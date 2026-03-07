import { component$ } from '@builder.io/qwik'
import type { QRL } from '@builder.io/qwik'
import { FilterSection } from './FilterSection'
import type { FilterSectionConfig, FilterValues } from './types'

export const FiltersPanel = component$((props: FiltersPanelProps) => {
  return (
    <aside class={['t-panel p-4 md:p-5', props.class].filter(Boolean).join(' ')}>
      <div class="mb-4 flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title ?? 'Filters'}</h3>
        <button type="button" class="text-xs font-medium text-[color:var(--color-action)] hover:underline" onClick$={props.onReset$}>
          Clear
        </button>
      </div>

      <div class="grid gap-4">
        {props.sections.map((section) => (
          <FilterSection
            key={section.id}
            section={section}
            value={props.values[section.id]}
            onCheckboxToggle$={props.onCheckboxToggle$}
            onSelectChange$={props.onSelectChange$}
          />
        ))}
      </div>
    </aside>
  )
})

type FiltersPanelProps = {
  title?: string
  class?: string
  sections: FilterSectionConfig[]
  values: FilterValues
  onCheckboxToggle$: QRL<(sectionId: string, optionValue: string) => void>
  onSelectChange$: QRL<(sectionId: string, value: string) => void>
  onReset$: QRL<() => void>
}
