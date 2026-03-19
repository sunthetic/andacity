const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const createRandomToken = (length: number) => {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join(
      "",
    );
  }

  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * ALPHABET.length);
    return ALPHABET[index] || "A";
  }).join("");
};

export const createBookingConfirmationPublicRef = () => {
  return `CNF-${createRandomToken(5)}-${createRandomToken(5)}`;
};
