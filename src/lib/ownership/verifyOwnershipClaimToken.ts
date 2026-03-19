import { timingSafeEqual } from "node:crypto";
import { hashOwnershipClaimToken } from "~/lib/ownership/hashOwnershipClaimToken";

export const verifyOwnershipClaimToken = (
  claimToken: string | null | undefined,
  expectedHash: string | null | undefined,
) => {
  const normalizedToken = String(claimToken || "").trim();
  const normalizedHash = String(expectedHash || "").trim();

  if (!normalizedToken || !/^[a-f0-9]{64}$/i.test(normalizedHash)) {
    return false;
  }

  const actualHash = hashOwnershipClaimToken(normalizedToken);

  try {
    return timingSafeEqual(
      Buffer.from(actualHash, "hex"),
      Buffer.from(normalizedHash, "hex"),
    );
  } catch {
    return false;
  }
};
