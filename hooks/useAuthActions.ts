import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/services/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const { clearAllData, setProfileData } = useAuth();

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      const initialProfileData = {
        id: user.uid,
        email: user.email || email,
        name: displayName || "",
        displayName: displayName || "",
        phone: "",
        role: "donor",
        verified: false,
        verifiedAt: null,
        verificationMethod: null,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), initialProfileData);
      await setProfileData(initialProfileData);

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED LOGIN (auto-migrate missing fields)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      let profileData: any;

      const userRef = doc(db, "users", user.uid);

      try {
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          profileData = userDoc.data();

          // ✅ Migration: add missing fields for old accounts
          const needsRole = profileData.role === undefined;
          const needsVerified = profileData.verified === undefined;

          if (needsRole || needsVerified) {
            const patch: any = {};
            if (needsRole) patch.role = "donor";
            if (needsVerified) patch.verified = false;
            if (profileData.verifiedAt === undefined) patch.verifiedAt = null;
            if (profileData.verificationMethod === undefined)
              patch.verificationMethod = null;

            await setDoc(userRef, patch, { merge: true });
            profileData = { ...profileData, ...patch };
          }
        } else {
          profileData = {
            id: user.uid,
            email: user.email || email,
            name: user.displayName || "",
            displayName: user.displayName || "",
            phone: "",
            role: "donor",
            verified: false,
            verifiedAt: null,
            verificationMethod: null,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, profileData, { merge: true });
        }
      } catch {
        profileData = {
          id: user.uid,
          email: user.email || email,
          name: user.displayName || "",
          displayName: user.displayName || "",
          phone: "",
          role: "donor",
          verified: false,
          verifiedAt: null,
          verificationMethod: null,
        };
      }

      await setProfileData(profileData);

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await clearAllData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: {
    displayName?: string;
    phone?: string;
    photoURL?: string;
  }) => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error("No user is currently logged in");
      }

      const authUpdates: { displayName?: string; phone?: string } = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      if (updates.phone) authUpdates.phone = updates.phone;

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
      }

      const currentProfileData = await getStoredProfileData();
      const updatedProfileData = {
        ...currentProfileData,
        name: updates.displayName || currentProfileData?.name || "",
        displayName:
          updates.displayName || currentProfileData?.displayName || "",
        phone:
          updates.phone !== undefined
            ? updates.phone
            : currentProfileData?.phone || "",
        updatedAt: new Date().toISOString(),
      };

      if (auth.currentUser.uid) {
        await setDoc(doc(db, "users", auth.currentUser.uid), updatedProfileData, {
          merge: true,
        });
      }

      await setProfileData(updatedProfileData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    login,
    logout,
    updateUserProfile,
    loading,
  };
};

const getErrorMessage = (error: any): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return error.message || "An unexpected error occurred.";
  }
};

const getStoredProfileData = async () => {
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    const storedProfile = await AsyncStorage.getItem("@profile_data");
    return storedProfile ? JSON.parse(storedProfile) : null;
  } catch (error) {
    console.error("Error getting stored profile data:", error);
    return null;
  }
};