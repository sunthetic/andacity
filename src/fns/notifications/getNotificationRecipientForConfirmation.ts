import { getCheckoutTravelerAssignments } from "~/fns/travelers/getCheckoutTravelerAssignments";
import { getCheckoutTravelers } from "~/fns/travelers/getCheckoutTravelers";
import { toNullableText } from "~/fns/notifications/shared";
import type { BookingConfirmation } from "~/types/confirmation";
import type { NotificationRecipient } from "~/types/notifications";
import type {
  CheckoutTravelerAssignment,
  CheckoutTravelerProfile,
} from "~/types/travelers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const isValidEmail = (value: unknown) => {
  const normalized = String(value || "").trim();
  return EMAIL_RE.test(normalized);
};

const getDisplayName = (profile: CheckoutTravelerProfile) => {
  const firstName = toNullableText(profile.firstName);
  const lastName = toNullableText(profile.lastName);
  const fullName = [firstName, lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return fullName || null;
};

const findProfileByAssignment = (
  assignments: CheckoutTravelerAssignment[],
  profiles: CheckoutTravelerProfile[],
): CheckoutTravelerProfile | null => {
  const ordered = [
    ...assignments.filter(
      (assignment) =>
        assignment.role === "primary_contact" &&
        assignment.checkoutItemKey == null &&
        assignment.isPrimary,
    ),
    ...assignments.filter(
      (assignment) =>
        assignment.role === "primary_contact" &&
        assignment.checkoutItemKey == null &&
        !assignment.isPrimary,
    ),
  ];

  for (const assignment of ordered) {
    const profile =
      profiles.find((candidate) => candidate.id === assignment.travelerProfileId) ||
      null;
    if (profile?.email && isValidEmail(profile.email)) {
      return profile;
    }
  }

  return null;
};

export const getNotificationRecipientForConfirmation = async (
  confirmation: Pick<BookingConfirmation, "checkoutSessionId">,
): Promise<NotificationRecipient | null> => {
  const checkoutSessionId = String(confirmation.checkoutSessionId || "").trim();
  if (!checkoutSessionId) return null;

  const [profiles, assignments] = await Promise.all([
    getCheckoutTravelers(checkoutSessionId),
    getCheckoutTravelerAssignments(checkoutSessionId),
  ]);

  const assigned = findProfileByAssignment(assignments, profiles);
  const fallbackPrimaryContact = profiles.find(
    (profile) => profile.role === "primary_contact" && isValidEmail(profile.email),
  );
  const fallbackAnyProfile = profiles.find((profile) => isValidEmail(profile.email));
  const recipientProfile =
    assigned || fallbackPrimaryContact || fallbackAnyProfile || null;

  if (!recipientProfile?.email || !isValidEmail(recipientProfile.email)) {
    return null;
  }

  return {
    email: recipientProfile.email,
    name: getDisplayName(recipientProfile),
    ownerUserId: null,
    ownerSessionId: null,
  };
};
