export const PRICE_DRIFT_STATUSES = [
  "valid",
  "price_changed",
  "unavailable",
] as const;
export type PriceDriftStatus = (typeof PRICE_DRIFT_STATUSES)[number];

export type PriceQuote = {
  currency: string;
  amount: number;
  base?: number;
  daily?: number;
  days?: number;
  nightly?: number;
  nights?: number;
  taxes?: number;
  fees?: number;
};

export type PriceDriftResult = {
  status: PriceDriftStatus;
  oldPrice: PriceQuote | null;
  newPrice: PriceQuote | null;
};
