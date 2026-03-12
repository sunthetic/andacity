import type { TripItemCandidate } from '~/types/trips/trip'

export const SAVE_VERTICALS = ["hotels", "cars", "flights"] as const;

export type SavedVertical = (typeof SAVE_VERTICALS)[number];

export type CompareData = Record<string, string>;

export type SavedItem = {
  id: string;
  vertical: SavedVertical;
  title: string;
  subtitle?: string;
  price?: string;
  meta?: string[];
  href: string;
  image?: string;
  compareData?: CompareData;
  tripCandidate?: TripItemCandidate;
};

export type SavedCollections = Record<SavedVertical, SavedItem[]>;
