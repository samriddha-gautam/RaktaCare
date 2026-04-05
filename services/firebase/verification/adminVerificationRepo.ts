import { db } from "@/services/firebase/config";
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import type { VerificationRequest } from "./verificationRepo";

export async function listPendingVerificationRequests() {
  const q = query(
    collection(db, "verificationRequests"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as VerificationRequest);
}

export async function approveVerificationRequest(uid: string, adminUid: string) {
  // 1) Mark request approved
  await setDoc(
    doc(db, "verificationRequests", uid),
    {
      status: "approved",
      reviewedBy: adminUid,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reviewReason: null,
    },
    { merge: true }
  );

  // 2) Mark user verified
  await setDoc(
    doc(db, "users", uid),
    {
      verified: true,
      verifiedAt: new Date().toISOString(),
      verificationMethod: "manual_admin",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function rejectVerificationRequest(
  uid: string,
  adminUid: string,
  reason: string
) {
  await setDoc(
    doc(db, "verificationRequests", uid),
    {
      status: "rejected",
      reviewedBy: adminUid,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reviewReason: reason || "Rejected by admin",
    },
    { merge: true }
  );

  // Ensure user is not verified
  await setDoc(
    doc(db, "users", uid),
    {
      verified: false,
      verifiedAt: null,
      verificationMethod: "manual_admin",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}