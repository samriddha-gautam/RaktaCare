import { db } from "@/services/firebase/config";
import { 
  addDoc, 
  collection, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  serverTimestamp, 
  updateDoc, 
  where,
  Timestamp
} from "firebase/firestore";

export interface DonationResponse {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodType: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
}

/**
 * Submit a donation offer
 */
export async function submitDonationOffer(data: {
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodType: string;
}) {
  const responsesRef = collection(db, "donationResponses");
  
  // Check if already submitted
  try {
    const q = query(
      responsesRef, 
      where("requestId", "==", data.requestId), 
      where("donorId", "==", data.donorId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("You have already sent a donation offer for this request.");
    }
  } catch(e: any) {
    if (e.message && e.message.includes("You have already sent")) {
      throw e;
    }
    // Ignore permissions errors from Firebase restricting bulk reads.
    console.warn("Ignoring getDocs permissions error:", e);
  }

  return await addDoc(responsesRef, {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/**
 * Get responses for a specific request
 */
export function subscribeToRequestResponses(requestId: string, callback: (responses: DonationResponse[]) => void) {
  const q = query(
    collection(db, "donationResponses"),
    where("requestId", "==", requestId)
  );

  return onSnapshot(q, (snap) => {
    const responses = snap.docs.map(d => ({ id: d.id, ...d.data() } as DonationResponse));
    callback(responses);
  });
}

/**
 * Update response status
 */
export async function updateDonationStatus(responseId: string, status: "accepted" | "rejected") {
  const ref = doc(db, "donationResponses", responseId);
  return await updateDoc(ref, { status });
}
