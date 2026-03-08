const FNV_PRIME = 0x01000193;

export const hashString = (input) => {
  let hash = 0x811c9dc5;
  const value = String(input || "");

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
};

export const joinSeedParts = (...parts) => {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("|");
};

export const hashParts = (...parts) => hashString(joinSeedParts(...parts));

export const createDeterministicRandom = (seedInput) => {
  let state = hashString(seedInput);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const deterministicHex = (seedInput, length = 10) => {
  const hash = hashString(seedInput).toString(16).padStart(8, "0");
  if (length <= hash.length) return hash.slice(0, length);

  const extra = hashString(`${seedInput}:extra`).toString(16).padStart(8, "0");
  return `${hash}${extra}`.slice(0, length);
};

export const deterministicId = (prefix, ...parts) => {
  const key = joinSeedParts(prefix, ...parts);
  return `${prefix}-${deterministicHex(key, 12)}`;
};
