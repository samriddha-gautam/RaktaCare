import { haversineDistance } from "./haversine";

interface Donor {
  lastDonationDate: { toMillis: () => number };
  homeLocation: { lat: number; lng: number };
  responseRate?: number;
}

/**
 * Rank eligible donors using a composite score before notifying them.
 * Higher score = notified first.
 *
 * Score components:
 * - Distance (50%): Closer = higher. Normalized over 30 km.
 * - Reliability (30%): responseRate field (0.0-1.0). Default 0.5.
 * - Urgency bonus (+30%): Added if urgency === "critical".
 *
 * @returns number (score) or null if ineligible (last donation < 90 days ago)
 */
export const scoreDonor = (
  donor: Donor,
  requestLat: number,
  requestLng: number,
  urgency: "critical" | "urgent" | "standard"
): number | null => {
  const daysSinceDonation =
    (Date.now() - donor.lastDonationDate.toMillis()) / (1000 * 60 * 60 * 24);

  if (daysSinceDonation < 90) return null; // ineligible, skip

  const distance = haversineDistance(
    donor.homeLocation.lat,
    donor.homeLocation.lng,
    requestLat,
    requestLng
  );

  const distanceScore = Math.max(0, 1 - distance / 30);
  const reliabilityScore = donor.responseRate ?? 0.5;
  const urgencyBonus = urgency === "critical" ? 0.3 : 0;

  return distanceScore * 0.5 + reliabilityScore * 0.3 + urgencyBonus;
};
