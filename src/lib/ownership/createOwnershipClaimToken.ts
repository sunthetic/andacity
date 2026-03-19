const CLAIM_TOKEN_BYTES = 32;

export const createOwnershipClaimToken = () => {
  const bytes = new Uint8Array(CLAIM_TOKEN_BYTES);

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // Keep the client-facing token opaque and decoupled from itinerary refs.
  return Buffer.from(bytes).toString("base64url");
};
