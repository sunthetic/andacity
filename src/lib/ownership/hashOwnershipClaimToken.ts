import { createHash } from "node:crypto";

export const hashOwnershipClaimToken = (claimToken: string) => {
  return createHash("sha256")
    .update(String(claimToken || "").trim())
    .digest("hex");
};
