import { db } from "@/services/firebase/config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VerificationRequest = {
  uid: string;
  status: VerificationStatus;
  phone: string;
  bloodGroup: string;
  age: number;
  lastDonationDate: string; // YYYY-MM-DD
  city: string;
  notes: string;
  createdAt?: any;
  updatedAt?: any;
  reviewedBy?: string | null;
  reviewedAt?: any;
  reviewReason?: string | null;
};

export async function getMyVerificationRequest(uid: string) {
  const ref = doc(db, "verificationRequests", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as VerificationRequest) : null;
}

export async function submitVerificationRequest(
  uid: string,
  data: Omit<
    VerificationRequest,
    | "uid"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "reviewedBy"
    | "reviewedAt"
    | "reviewReason"
  >
) {
  const ref = doc(db, "verificationRequests", uid);
  const existing = await getDoc(ref);

  const payload: Partial<VerificationRequest> = {
    uid,
    status: "pending",
    ...data,
    updatedAt: serverTimestamp(),

    reviewedBy: null,
    reviewedAt: null,
    reviewReason: null,
  };

  if (!existing.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
}