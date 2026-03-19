import type { CheckoutItemSnapshot } from "~/types/checkout";
import type {
  RequiredTravelerGroup,
  TravelerRequiredFieldKey,
} from "~/types/travelers";
import { checkoutItemKeyFromSnapshot, isRecord } from "~/fns/travelers/shared";

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

const hasInternationalHint = (providerMetadata: Record<string, unknown>) => {
  const internationalFlags = [
    providerMetadata.isInternational,
    providerMetadata.international,
    providerMetadata.requiresPassport,
  ];
  if (internationalFlags.some((value) => value === true)) return true;

  const originCountry = String(providerMetadata.originCountryCode || "")
    .trim()
    .toUpperCase();
  const destinationCountry = String(
    providerMetadata.destinationCountryCode || "",
  )
    .trim()
    .toUpperCase();
  return Boolean(
    originCountry &&
      destinationCountry &&
      originCountry !== destinationCountry,
  );
};

const resolveHotelOccupancy = (item: CheckoutItemSnapshot) => {
  const providerMetadata = isRecord(item.inventory.providerMetadata)
    ? item.inventory.providerMetadata
    : {};
  const byProviderMetadata =
    toPositiveInteger(providerMetadata.occupancy) ||
    toPositiveInteger(providerMetadata.guests) ||
    toPositiveInteger(providerMetadata.guestCount);
  if (byProviderMetadata) return byProviderMetadata;

  const bookableEntity = item.inventory.bookableEntity;
  if (
    bookableEntity?.vertical === "hotel" &&
    toPositiveInteger(bookableEntity.bookingContext.occupancy)
  ) {
    return Math.max(
      1,
      toPositiveInteger(bookableEntity.bookingContext.occupancy) || 1,
    );
  }

  return 1;
};

const resolveFlightPassengerCount = (item: CheckoutItemSnapshot) => {
  const providerMetadata = isRecord(item.inventory.providerMetadata)
    ? item.inventory.providerMetadata
    : {};
  return Math.max(
    1,
    toPositiveInteger(providerMetadata.passengers) ||
      toPositiveInteger(providerMetadata.passengerCount) ||
      toPositiveInteger(providerMetadata.adults) ||
      1,
  );
};

const resolveCarDriverAgeFloor = (item: CheckoutItemSnapshot) => {
  const providerMetadata = isRecord(item.inventory.providerMetadata)
    ? item.inventory.providerMetadata
    : {};
  return toPositiveInteger(providerMetadata.minDriverAge) || 21;
};

const withKey = (
  item: CheckoutItemSnapshot,
  suffix: string,
  config: Omit<RequiredTravelerGroup, "id" | "checkoutItemKey" | "vertical">,
): RequiredTravelerGroup => {
  const checkoutItemKey = checkoutItemKeyFromSnapshot({
    tripItemId: item.tripItemId,
    inventoryId: item.inventory.inventoryId,
  });

  return {
    id: `${checkoutItemKey}:${suffix}`,
    checkoutItemKey,
    vertical: item.vertical,
    ...config,
  };
};

export const getCheckoutItemTravelerRequirements = (
  item: CheckoutItemSnapshot,
): RequiredTravelerGroup[] => {
  if (item.vertical === "flight") {
    const providerMetadata = isRecord(item.inventory.providerMetadata)
      ? item.inventory.providerMetadata
      : {};
    const requiresPassport = hasInternationalHint(providerMetadata);
    const requiredFields: TravelerRequiredFieldKey[] = requiresPassport
      ? [
          "firstName",
          "lastName",
          "dateOfBirth",
          "nationality",
          "documentType",
          "documentNumber",
          "documentExpiryDate",
          "issuingCountry",
        ]
      : ["firstName", "lastName", "dateOfBirth"];

    return [
      withKey(item, "passengers", {
        role: "passenger",
        travelerType: null,
        requiredCount: resolveFlightPassengerCount(item),
        requiresPrimary: false,
        requiredFields,
        optional: false,
        title: "Flight passengers",
        description:
          "Assign one traveler profile per passenger for this itinerary.",
        metadata: {
          requiresPassport,
        },
      }),
    ];
  }

  if (item.vertical === "hotel") {
    const occupancy = resolveHotelOccupancy(item);
    const additionalOccupants = Math.max(0, occupancy - 1);
    const groups: RequiredTravelerGroup[] = [
      withKey(item, "primary-guest", {
        role: "guest",
        travelerType: null,
        requiredCount: 1,
        requiresPrimary: true,
        requiredFields: ["firstName", "lastName", "email", "phone"],
        optional: false,
        title: "Primary hotel guest",
        description:
          "A primary guest is required for this stay and must include contact details.",
        metadata: {
          occupancy,
        },
      }),
    ];

    if (additionalOccupants > 0) {
      groups.push(
        withKey(item, "occupants", {
          role: "guest",
          travelerType: null,
          requiredCount: additionalOccupants,
          requiresPrimary: false,
          requiredFields: ["firstName", "lastName"],
          optional: true,
          title: "Additional hotel occupants",
          description:
            "Optional first-pass occupancy assignment to reduce booking mismatches.",
          metadata: {
            occupancy,
          },
        }),
      );
    }

    return groups;
  }

  const minimumDriverAge = resolveCarDriverAgeFloor(item);
  return [
    withKey(item, "driver", {
      role: "driver",
      travelerType: null,
      requiredCount: 1,
      requiresPrimary: true,
      requiredFields: [
        "firstName",
        "lastName",
        "dateOfBirth",
        "email",
        "phone",
        "documentType",
        "documentNumber",
        "driverAge",
      ],
      optional: false,
      title: "Primary driver",
      description: "A valid primary driver is required before this rental can be booked.",
      metadata: {
        minimumDriverAge,
      },
    }),
  ];
};
