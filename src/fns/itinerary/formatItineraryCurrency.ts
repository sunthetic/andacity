import { formatMoneyFromCents } from "~/lib/pricing/price-display";

export const formatItineraryCurrency = (
  amountCents: number | null | undefined,
  currency: string | null | undefined,
  options: {
    emptyLabel?: string | null;
  } = {},
) => {
  if (amountCents == null || !Number.isFinite(Number(amountCents))) {
    return options.emptyLabel ?? null;
  }

  return formatMoneyFromCents(amountCents, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
