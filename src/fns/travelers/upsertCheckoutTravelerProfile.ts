import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { checkoutTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import type { CheckoutTravelerProfile } from "~/types/travelers";
import {
  createCheckoutTravelerProfileId,
  normalizeTimestamp,
  normalizeTravelerDocumentType,
  normalizeTravelerRole,
  normalizeTravelerType,
  toNullableDate,
  toNullableEmail,
  toNullablePhone,
  toNullablePositiveInteger,
  toNullableText,
} from "~/fns/travelers/shared";
import { getCheckoutTravelers } from "~/fns/travelers/getCheckoutTravelers";

export type UpsertCheckoutTravelerProfileInput = {
  id?: string | null;
  checkoutSessionId: string;
  type?: string | null;
  role?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentExpiryDate?: string | null;
  issuingCountry?: string | null;
  knownTravelerNumber?: string | null;
  redressNumber?: string | null;
  driverAge?: number | string | null;
  now?: Date | string | null;
};

const loadProfile = async (
  checkoutSessionId: string,
  travelerProfileId: string,
) => {
  const profiles = await getCheckoutTravelers(checkoutSessionId);
  return profiles.find((profile) => profile.id === travelerProfileId) || null;
};

export const upsertCheckoutTravelerProfile = async (
  input: UpsertCheckoutTravelerProfileInput,
): Promise<CheckoutTravelerProfile> => {
  const checkoutSessionId = String(input.checkoutSessionId || "").trim();
  if (!checkoutSessionId) {
    throw new Error("Checkout session id is required to save traveler details.");
  }

  const now = normalizeTimestamp(input.now);
  const id = String(input.id || "").trim() || createCheckoutTravelerProfileId();

  const payload = {
    checkoutSessionId,
    type: normalizeTravelerType(input.type),
    role: normalizeTravelerRole(input.role),
    firstName: toNullableText(input.firstName) || "",
    middleName: toNullableText(input.middleName),
    lastName: toNullableText(input.lastName) || "",
    dateOfBirth: toNullableDate(input.dateOfBirth),
    email: toNullableEmail(input.email),
    phone: toNullablePhone(input.phone),
    nationality: toNullableText(input.nationality),
    documentType: normalizeTravelerDocumentType(input.documentType),
    documentNumber: toNullableText(input.documentNumber),
    documentExpiryDate: toNullableDate(input.documentExpiryDate),
    issuingCountry: toNullableText(input.issuingCountry),
    knownTravelerNumber: toNullableText(input.knownTravelerNumber),
    redressNumber: toNullableText(input.redressNumber),
    driverAge: toNullablePositiveInteger(input.driverAge),
    updatedAt: new Date(now),
  };

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const explicitId = String(input.id || "").trim();
    if (explicitId) {
      const [existing] = await db
        .select({ id: checkoutTravelerProfiles.id })
        .from(checkoutTravelerProfiles)
        .where(
          and(
            eq(checkoutTravelerProfiles.id, id),
            eq(checkoutTravelerProfiles.checkoutSessionId, checkoutSessionId),
          ),
        )
        .limit(1);

      if (existing?.id) {
        await db
          .update(checkoutTravelerProfiles)
          .set(payload)
          .where(
            and(
              eq(checkoutTravelerProfiles.id, id),
              eq(checkoutTravelerProfiles.checkoutSessionId, checkoutSessionId),
            ),
          );
        return;
      }
    }

    await db.insert(checkoutTravelerProfiles).values({
      id,
      ...payload,
      createdAt: new Date(now),
    });
  });

  const profile = await loadProfile(checkoutSessionId, id);
  if (!profile) {
    throw new Error(`Traveler profile ${id} could not be loaded after save.`);
  }
  return profile;
};
