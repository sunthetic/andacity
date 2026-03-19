import { getCheckoutItemTravelerRequirements } from "~/fns/travelers/getCheckoutItemTravelerRequirements";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import type { RequiredTravelerGroup } from "~/types/travelers";

export const getCheckoutTravelerRequirements = (
  checkoutItems: CheckoutItemSnapshot[],
): RequiredTravelerGroup[] => {
  const byItem = checkoutItems.flatMap((item) =>
    getCheckoutItemTravelerRequirements(item),
  );

  const hasTravelItems = checkoutItems.length > 0;
  const hasContactRequiredItem = checkoutItems.some(
    (item) =>
      item.vertical === "flight" ||
      item.vertical === "hotel" ||
      item.vertical === "car",
  );

  const globalGroups: RequiredTravelerGroup[] =
    hasTravelItems && hasContactRequiredItem
      ? [
          {
            id: "checkout:primary-contact",
            checkoutItemKey: null,
            vertical: null,
            role: "primary_contact",
            travelerType: null,
            requiredCount: 1,
            requiresPrimary: true,
            requiredFields: ["firstName", "lastName", "email", "phone"],
            optional: false,
            title: "Primary checkout contact",
            description:
              "At least one primary contact is required for provider notifications and operational follow-up.",
            metadata: null,
          },
        ]
      : [];

  return [...globalGroups, ...byItem];
};
