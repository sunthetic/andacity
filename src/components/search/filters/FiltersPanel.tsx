import { component$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import { ResultsFilters } from "~/components/results/ResultsFilters";
import { FilterSection } from "./FilterSection";
import type { FilterSectionConfig, FilterValues } from "./types";

export const FiltersPanel = component$((props: FiltersPanelProps) => {
  return (
    <ResultsFilters
      title={props.title ?? "Filters"}
      class={props.class}
      actionLabel="Clear"
      actionDisabled={props.disabled}
      onAction$={props.onReset$}
    >
      <div class="grid gap-4">
        {props.sections.map((section) => (
          <FilterSection
            key={section.id}
            section={section}
            value={props.values[section.id]}
            onCheckboxToggle$={props.onCheckboxToggle$}
            onSelectChange$={props.onSelectChange$}
            disabled={props.disabled}
          />
        ))}
      </div>
    </ResultsFilters>
  );
});

type FiltersPanelProps = {
  title?: string;
  class?: string;
  sections: FilterSectionConfig[];
  values: FilterValues;
  onCheckboxToggle$: QRL<(sectionId: string, optionValue: string) => void>;
  onSelectChange$: QRL<(sectionId: string, value: string) => void>;
  onReset$: QRL<() => void>;
  disabled?: boolean;
};
