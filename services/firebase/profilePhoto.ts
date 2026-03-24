import { auth, db, storage } from "@/services/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function getAvatarPath(uid: string) {
  return `profilePhotos/${uid}/avatar.jpg`;
}

// ✅ More reliable in Expo/React Native for file:// URIs
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError("uriToBlob failed"));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    } catch (e) {
      reject(e);
    }
  });
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

  // Convert local image URI -> Blob
  const blob = await uriToBlob(params.uri);

  const storageRef = ref(storage, getAvatarPath(user.uid));

  try {
    // We compress to JPEG in ProfileView, so contentType should be image/jpeg
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  } catch (e: any) {
    console.log("UPLOAD ERROR code:", e?.code);
    console.log("UPLOAD ERROR message:", e?.message);
    console.log("UPLOAD ERROR serverResponse:", e?.serverResponse);
    throw e;
  }

  const downloadURL = await getDownloadURL(storageRef);

  // Update Firebase Auth profile
  await updateProfile(user, { photoURL: downloadURL });

  // Update Firestore user doc
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

  const storageRef = ref(storage, getAvatarPath(user.uid));

  try {
    await deleteObject(storageRef);
  } catch (e) {
    // ignore if not found or already deleted
  }

  await updateProfile(user, { photoURL: null });

  await setDoc(
    doc(db, "users", user.uid),
    { photoURL: null, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { success: true };
}