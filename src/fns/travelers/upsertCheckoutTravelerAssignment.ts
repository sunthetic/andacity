import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { checkoutTravelerAssignments } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import type { CheckoutTravelerAssignment } from "~/types/travelers";
import {
  createCheckoutTravelerAssignmentId,
  normalizeTimestamp,
  normalizeTravelerRole,
  toNullableText,
} from "~/fns/travelers/shared";
import { getCheckoutTravelerAssignments } from "~/fns/travelers/getCheckoutTravelerAssignments";

export type UpsertCheckoutTravelerAssignmentInput = {
  id?: string | null;
  checkoutSessionId: string;
  checkoutItemKey?: string | null;
  travelerProfileId: string;
  role?: string | null;
  isPrimary?: boolean | null;
  now?: Date | string | null;
};

const loadAssignment = async (
  checkoutSessionId: string,
  assignmentId: string,
) => {
  const assignments = await getCheckoutTravelerAssignments(checkoutSessionId);
  return assignments.find((assignment) => assignment.id === assignmentId) || null;
};

export const upsertCheckoutTravelerAssignment = async (
  input: UpsertCheckoutTravelerAssignmentInput,
): Promise<CheckoutTravelerAssignment> => {
  const checkoutSessionId = String(input.checkoutSessionId || "").trim();
  const travelerProfileId = String(input.travelerProfileId || "").trim();
  if (!checkoutSessionId || !travelerProfileId) {
    throw new Error(
      "Checkout session id and traveler profile id are required to assign travelers.",
    );
  }

  const now = normalizeTimestamp(input.now);
  const id =
    String(input.id || "").trim() || createCheckoutTravelerAssignmentId();
  const payload = {
    checkoutSessionId,
    checkoutItemKey: toNullableText(input.checkoutItemKey),
    travelerProfileId,
    role: normalizeTravelerRole(input.role),
    isPrimary: Boolean(input.isPrimary),
    updatedAt: new Date(now),
  };

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const explicitId = String(input.id || "").trim();
    if (explicitId) {
      const [existingById] = await db
        .select({ id: checkoutTravelerAssignments.id })
        .from(checkoutTravelerAssignments)
        .where(
          and(
            eq(checkoutTravelerAssignments.id, id),
            eq(
              checkoutTravelerAssignments.checkoutSessionId,
              checkoutSessionId,
            ),
          ),
        )
        .limit(1);

      if (existingById?.id) {
        await db
          .update(checkoutTravelerAssignments)
          .set(payload)
          .where(
            and(
              eq(checkoutTravelerAssignments.id, existingById.id),
              eq(
                checkoutTravelerAssignments.checkoutSessionId,
                checkoutSessionId,
              ),
            ),
          );
        return;
      }
    }

    const checkoutItemKeyMatch =
      payload.checkoutItemKey == null
        ? isNull(checkoutTravelerAssignments.checkoutItemKey)
        : eq(checkoutTravelerAssignments.checkoutItemKey, payload.checkoutItemKey);
    const existingByIdentity = (
      await db
        .select({ id: checkoutTravelerAssignments.id })
        .from(checkoutTravelerAssignments)
        .where(
          and(
            eq(
              checkoutTravelerAssignments.checkoutSessionId,
              checkoutSessionId,
            ),
            eq(checkoutTravelerAssignments.travelerProfileId, travelerProfileId),
            checkoutItemKeyMatch,
            eq(checkoutTravelerAssignments.role, payload.role),
          ),
        )
        .limit(1)
    )[0];

    if (existingByIdentity?.id) {
      await db
        .update(checkoutTravelerAssignments)
        .set(payload)
        .where(eq(checkoutTravelerAssignments.id, existingByIdentity.id));
      return;
    }

    await db.insert(checkoutTravelerAssignments).values({
      id,
      ...payload,
      createdAt: new Date(now),
    });
  });

  const assignment = await loadAssignment(checkoutSessionId, id);
  if (assignment) return assignment;

  const assignments = await getCheckoutTravelerAssignments(checkoutSessionId);
  const fallback =
    assignments.find(
      (entry) =>
        entry.travelerProfileId === travelerProfileId &&
        entry.checkoutItemKey === toNullableText(input.checkoutItemKey) &&
        entry.role === normalizeTravelerRole(input.role),
    ) || null;

  if (!fallback) {
    throw new Error(`Traveler assignment ${id} could not be loaded after save.`);
  }
  return fallback;
};
