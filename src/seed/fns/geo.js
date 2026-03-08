const EARTH_RADIUS_KM = 6371;

const toRadians = (deg) => (deg * Math.PI) / 180;

export const haversineKm = (a, b) => {
  if (!a || !b) return 1500;

  const lat1 = toRadians(Number(a.lat) || 0);
  const lon1 = toRadians(Number(a.lng) || 0);
  const lat2 = toRadians(Number(b.lat) || 0);
  const lon2 = toRadians(Number(b.lng) || 0);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const x = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return EARTH_RADIUS_KM * c;
};
