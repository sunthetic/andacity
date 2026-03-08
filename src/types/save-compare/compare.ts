import type { SavedItem, SavedVertical } from "~/types/save-compare/saved-item";

export type CompareSelection = {
  vertical: SavedVertical;
  items: SavedItem[];
};

export type CompareState = {
  isOpen: boolean;
  selection: CompareSelection | null;
};
