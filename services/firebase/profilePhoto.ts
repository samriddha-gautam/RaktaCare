import { auth, db, storage } from "@/services/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function getAvatarPath(uid: string) {
  return `profilePhotos/${uid}/avatar.jpg`;
}

// ✅ Robust version using fetch() which is recommended in modern Expo/React Native
// for handling local file:// URIs.
async function uriToBlob(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch (error) {
    console.error("fetch uriToBlob failed:", error);
    throw new Error("Could not convert image to blob for upload.");
  }
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
    const metadata = {
      contentType: "image/jpeg",
    };

    // uploadBytesResumable is more reliable than uploadBytes in React Native
    // because it handles the Blob→network boundary via a streaming approach.
    await new Promise<void>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
      uploadTask.on(
        "state_changed",
        () => {}, // progress – not needed here
        (error) => {
          console.error("UPLOAD ERROR code:", error?.code);
          console.error("UPLOAD ERROR message:", error?.message);
          reject(error);
        },
        () => resolve()
      );
    });
  } catch (e: any) {
    console.error("UPLOAD ERROR code:", e?.code);
    console.error("UPLOAD ERROR message:", e?.message);
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