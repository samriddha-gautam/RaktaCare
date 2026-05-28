  import { db } from "@/services/firebase/config";
import { getCompatibleDonorGroups } from "@/utils/bloodCompatibility";
import { scoreDonor } from "@/utils/donorScoring";
import {
  arrayUnion,
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  startAt,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { distanceBetween, geohashQueryBounds } from "geofire-common";

/**
 * Service to handle complex matching algorithms (Algos 4, 5, 6)
 */
export const BloodAlgorithmService = {
  
  /**
   * Algorithm 6: Notification Trigger Logic
   * Finds top 10 compatible donors within a radius and prepares them for notification.
   */
  findDonorsForRequest: async (requestId: string, center: [number, number], radiusKm: number, bloodType: string, urgency: 'critical' | 'urgent' | 'standard') => {
    const compatibleGroups = getCompatibleDonorGroups(bloodType);
    const bounds = geohashQueryBounds(center, radiusKm * 1000);
    const promises = [];

    for (const b of bounds) {
      const q = query(
        collection(db, "users"),
        where("role", "==", "donor"),
        where("isVerified", "==", true),
        where("isAvailableToDonate", "==", true),
        orderBy("homeLocation.geohash"),
        startAt(b[0]),
        endAt(b[1])
      );
      promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);
    const donors: any[] = [];

    snapshots.forEach((snap) => {
      snap.docs.forEach((d) => {
        const data = d.data();
        const loc = data.homeLocation;
        if (!loc) return;

        // Filter exact distance
        const distance = distanceBetween([loc.lat, loc.lng], center);
        if (distance > radiusKm) return;

        // Filter blood compatibility
        if (!compatibleGroups.includes(data.bloodGroup)) return;

        // Score donor
        const score = scoreDonor(data as any, center[0], center[1], urgency);
        if (score !== null) {
          donors.push({ id: d.id, ...data, score, distance });
        }
      });
    });

    // Sort by score descending
    donors.sort((a, b) => b.score - a.score);

    // Take top 10
    const topDonors = donors.slice(0, 10);

    // Update request with notified donors
    const requestRef = doc(db, "bloodRequests", requestId);
    await updateDoc(requestRef, {
      notifiedDonors: arrayUnion(...topDonors.map(d => d.id))
    });

    return topDonors;
  },

  /**
   * Algorithm 4: Escalating Radius Geofencing
   * Logic to expand search radius if request is still pending.
   */
escalateRequestRadius: async (requestId: string) => {
  const requestRef = doc(db, "bloodRequests", requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) return;
  const request = requestSnap.data();
    if (request.status !== "pending") return;

    const currentRadius = request.currentRadius || 5;
    let nextRadius = 5;

    if (currentRadius === 5) nextRadius = 15;
    else if (currentRadius === 15) nextRadius = 30;
    else if (currentRadius === 30) nextRadius = 100; // Citywide approximation

    if (nextRadius === currentRadius) return;

    // Trigger new search at next radius
    if (request.coords) {
        await BloodAlgorithmService.findDonorsForRequest(
            requestId, 
            [request.coords.lat, request.coords.lng], 
            nextRadius, 
            request.bloodType, 
            request.urgency || 'standard'
        );
    }

    await updateDoc(requestRef, {
      currentRadius: nextRadius,
      lastEscalatedAt: serverTimestamp()
    });
  },

  /**
   * Algorithm 5: Priority Queue Logic
   * Calculates priority for simultaneous requests.
   */
  calculateRequestPriority: (request: any) => {
    const urgencyWeight = {
      critical: 1.0,
      urgent: 0.6,
      standard: 0.2
    }[request.urgency as 'critical' | 'urgent' | 'standard'] || 0.2;

    const createdAt = request.createdAt instanceof Timestamp ? request.createdAt.toMillis() : Date.now();
    const waitTimeMinutes = (Date.now() - createdAt) / (1000 * 60);
    const waitTimeBonus = Math.min(0.5, waitTimeMinutes / 60); // Max 0.5 bonus after 1 hour

    const unitsNeeded = request.unitsNeeded || 1;
    const unitsBonus = Math.min(0.2, (unitsNeeded - 1) * 0.05);

    return (urgencyWeight * 0.5) + (waitTimeBonus * 0.3) + (unitsBonus * 0.2);
  }
};
