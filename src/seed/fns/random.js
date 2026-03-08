export const randomInt = (rand, min, max) => {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi <= lo) return lo;
  return Math.floor(rand() * (hi - lo + 1)) + lo;
};

export const randomFloat = (rand, min, max, precision = 2) => {
  const value = min + rand() * (max - min);
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
};

export const pickOne = (rand, list) => {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  const index = randomInt(rand, 0, list.length - 1);
  return list[index];
};

export const sampleUnique = (rand, list, count) => {
  if (!Array.isArray(list) || list.length === 0 || count <= 0) return [];
  const copy = [...list];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(rand, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, Math.min(count, copy.length));
};

export const weightedPick = (rand, options) => {
  if (!Array.isArray(options) || options.length === 0) return undefined;

  const total = options.reduce(
    (acc, option) => acc + Math.max(0, Number(option.weight) || 0),
    0,
  );
  if (total <= 0) return options[0]?.value;

  const threshold = rand() * total;
  let acc = 0;

  for (const option of options) {
    acc += Math.max(0, Number(option.weight) || 0);
    if (threshold <= acc) return option.value;
  }

  return options[options.length - 1]?.value;
};
