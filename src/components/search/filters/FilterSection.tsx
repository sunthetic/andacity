import { component$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { FilterSectionConfig } from "./types";

export const FilterSection = component$((props: FilterSectionProps) => {
  const value = props.value;

  return (
    <section class="grid gap-2">
      <h4 class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
        {props.section.title}
      </h4>

      {props.section.type === "checkbox" ? (
        <div class="grid gap-2">
          {props.section.options.map((option) => {
            const checked = Array.isArray(value)
              ? value.includes(option.value)
              : false;

            return (
              <label
                key={option.value}
                class="flex items-center gap-2 text-sm text-[color:var(--color-text)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={props.disabled}
                  onChange$={() =>
                    props.onCheckboxToggle$(props.section.id, option.value)
                  }
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <select
          class="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          disabled={props.disabled}
          value={typeof value === "string" ? value : ""}
          onChange$={(_, el) =>
            props.onSelectChange$(props.section.id, el.value)
          }
        >
          <option value="">
            {props.section.placeholder ?? "Select an option"}
          </option>
          {props.section.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </section>
  );
});

type FilterSectionProps = {
  section: FilterSectionConfig;
  value: string[] | string | undefined;
  onCheckboxToggle$: QRL<(sectionId: string, optionValue: string) => void>;
  onSelectChange$: QRL<(sectionId: string, value: string) => void>;
  disabled?: boolean;
};
