import { db } from "@/services/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}