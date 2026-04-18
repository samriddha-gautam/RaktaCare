/**
 * Calculate straight-line distance in km between two GPS coordinates,
 * accounting for Earth's curvature.
 *
 * Kathmandu (27.7172, 85.3240) → Lalitpur (27.6683, 85.3206) ≈ 5.4 km
 */
export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export type LatLng = { lat: number; lng: number };

/**
 * Compatibility wrapper for haversineDistance using LatLng objects.
 */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  return haversineDistance(a.lat, a.lng, b.lat, b.lng);
};
