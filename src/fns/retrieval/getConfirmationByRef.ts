import { getBookingConfirmationByPublicRef } from "~/lib/confirmation/getBookingConfirmationByPublicRef";
import {
  isConfirmationRef,
  normalizeConfirmationRef,
} from "~/types/confirmation";

export const getConfirmationByRef = async (confirmationRef: string) => {
  const normalizedRef = normalizeConfirmationRef(confirmationRef);

  if (!isConfirmationRef(normalizedRef)) {
    return null;
  }

  return getBookingConfirmationByPublicRef(normalizedRef);
};
