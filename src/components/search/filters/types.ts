export type FilterOption = {
  label: string
  value: string
}

export type CheckboxFilterSection = {
  type: 'checkbox'
  id: string
  title: string
  options: FilterOption[]
}

export type SelectFilterSection = {
  type: 'select'
  id: string
  title: string
  options: FilterOption[]
  placeholder?: string
}

export type FilterSectionConfig = CheckboxFilterSection | SelectFilterSection

export type FilterValues = Record<string, string[] | string>
