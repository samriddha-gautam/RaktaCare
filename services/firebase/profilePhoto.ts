import { auth, db } from "@/services/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

export async function uploadProfilePhotoAsync(params: {
  uri: string;
  mimeType: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  if (!ALLOWED_MIME.has(params.mimeType)) {
    throw new Error("Only JPG / JPEG / PNG images are allowed.");
  }

  // Convert file URI → Blob
  const res = await fetch(params.uri);
  const blob = await res.blob();

  const storage = getStorage();
  const ext = params.mimeType === "image/png" ? "png" : "jpg";
  const objectPath = `profilePhotos/${user.uid}/avatar.${ext}`;

  const storageRef = ref(storage, objectPath);
  await uploadBytes(storageRef, blob, { contentType: params.mimeType });

  const downloadURL = await getDownloadURL(storageRef);

  // Update Firebase Auth
  await updateProfile(user, { photoURL: downloadURL });

  // Update Firestore user doc
  await setDoc(
    doc(db, "users", user.uid),
    { photoURL: downloadURL, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { downloadURL };
}