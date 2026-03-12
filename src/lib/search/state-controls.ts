import type { SearchState } from "~/types/search/state";

export const withSearchStateFilters = (
  state: SearchState,
  updater: (filters: Record<string, unknown>) => Record<string, unknown>,
): SearchState => {
  const nextFilters = updater({ ...(state.filters || {}) });

  return {
    ...state,
    page: 1,
    filters: Object.keys(nextFilters).length ? nextFilters : undefined,
  };
};

export const withSearchStateArrayToggle = (
  state: SearchState,
  key: string,
  value: string,
  normalizeValue: (value: string) => string = (entry) => entry,
): SearchState => {
  return withSearchStateFilters(state, (filters) => {
    const currentRaw = filters[key];
    const current = Array.isArray(currentRaw)
      ? currentRaw
          .map((item) => normalizeValue(String(item || "")))
          .filter(Boolean)
      : String(currentRaw || "")
          .split(",")
          .map((item) => normalizeValue(item))
          .filter(Boolean);

    const normalizedValue = normalizeValue(value);
    const has = current.includes(normalizedValue);
    const next = has
      ? current.filter((item) => item !== normalizedValue)
      : [...current, normalizedValue];

    if (next.length) {
      filters[key] = next;
    } else {
      delete filters[key];
    }

    return filters;
  });
};

export const withSearchStateSingleToggle = (
  state: SearchState,
  key: string,
  value: string,
  normalizeValue: (value: string) => string = (entry) => entry,
): SearchState => {
  return withSearchStateFilters(state, (filters) => {
    const current = normalizeValue(String(filters[key] || ""));
    const nextValue = normalizeValue(value);

    if (current === nextValue) {
      delete filters[key];
    } else {
      filters[key] = value;
    }

    return filters;
  });
};

export const withSearchStateSort = (
  state: SearchState,
  sort: string,
): SearchState => ({
  ...state,
  sort,
  page: 1,
});

export const withSearchStatePage = (
  state: SearchState,
  page: number,
): SearchState => ({
  ...state,
  page,
});

export const clearSearchStateFilters = (
  state: SearchState,
  preserveKeys: string[] = [],
): SearchState => {
  const preserved = preserveKeys.reduce<Record<string, unknown>>(
    (acc, key) => {
      const value = state.filters?.[key];
      if (value == null) return acc;

      if (Array.isArray(value) && !value.length) {
        return acc;
      }

      if (!Array.isArray(value) && !String(value).trim()) {
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {},
  );

  return {
    ...state,
    page: 1,
    filters: Object.keys(preserved).length ? preserved : undefined,
  };
};
