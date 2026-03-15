import { auth, db } from "@/services/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function getAvatarPath(uid: string) {
  return `profilePhotos/${uid}/avatar.jpg`;
}

export async function uploadProfilePhotoAsync(params: {
  uri: string;
  mimeType: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  if (!ALLOWED_MIME.has(params.mimeType)) {
    throw new Error("Only JPG / JPEG / PNG images are allowed.");
  }

  const res = await fetch(params.uri);
  const blob = await res.blob();

  const storage = getStorage();
  const storageRef = ref(storage, getAvatarPath(user.uid));

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

  const downloadURL = await getDownloadURL(storageRef);

  await updateProfile(user, { photoURL: downloadURL });

  await setDoc(
    doc(db, "users", user.uid),
    { photoURL: downloadURL, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { downloadURL };
}

export async function deleteProfilePhotoAsync() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const storage = getStorage();
  const storageRef = ref(storage, getAvatarPath(user.uid));

  try {
    await deleteObject(storageRef);
  } catch {
    // ignore if object not found
  }

  await updateProfile(user, { photoURL: null });

  await setDoc(
    doc(db, "users", user.uid),
    { photoURL: null, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { success: true };
}