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
    phone: "",  // ← ADD THIS LINE
    createdAt: new Date().toISOString(), 
  };

        await setDoc(doc(db, "users", user.uid), initialProfileData);

        await setProfileData(initialProfileData);

        console.log("User signed up successfully:", user.email);
        return { success: true, user };
      } catch (error: any) {
        console.error("Signup error:", error);
        return {
          success: false,
          error: getErrorMessage(error),
        };
      } finally {
        setLoading(false);
      }
    };

    const login = async (email: string, password: string) => {
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        
        let profileData;
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            profileData = userDoc.data();
          } else {
            profileData = {
              id: user.uid,
              email: user.email || email,
              name: user.displayName || "",
              displayName: user.displayName || "",
            };
          }
        } catch (firestoreError) {
          profileData = {
            id: user.uid,
            email: user.email || email,
            name: user.displayName || "",
            displayName: user.displayName || "",
          };
        }

        await setProfileData(profileData);

        console.log("User logged in successfully:", user.email);
        return { success: true, user };
      } catch (error: any) {
        console.error("Login error:", error);
        return {
          success: false,
          error: getErrorMessage(error),
        };
      } finally {
        setLoading(false);
      }
    };

    const logout = async () => {
      setLoading(true);
      try {
        await signOut(auth);
        await clearAllData();

        console.log("User logged out successfully");
        return { success: true };
      } catch (error: any) {
        console.error("Logout error:", error);
        return {
          success: false,
          error: getErrorMessage(error),
        };
      } finally {
        setLoading(false);
      }
    };

    const updateUserProfile = async (updates: {
      displayName?: string;
      phone?:string;
      photoURL?: string;
    }) => {
      setLoading(true);
      try {
        if (!auth.currentUser) {
          throw new Error("No user is currently logged in");
        }

  const authUpdates: { displayName?: string; photoURL?: string } = {};
  if (updates.displayName) authUpdates.displayName = updates.displayName;
  if (updates.photoURL) authUpdates.photoURL = updates.photoURL;

  if (Object.keys(authUpdates).length > 0) {
    await updateProfile(auth.currentUser, authUpdates);
  }

        const currentProfileData = await getStoredProfileData();
        const updatedProfileData = {
    ...currentProfileData,
    name: updates.displayName || currentProfileData?.name || "",
    displayName: updates.displayName || currentProfileData?.displayName || "",
    phone: updates.phone !== undefined ? updates.phone : currentProfileData?.phone || "",  // ← ADD THIS LINE
    updatedAt: new Date().toISOString(),
  };

        if (auth.currentUser.uid) {
          await setDoc(doc(db, "users", auth.currentUser.uid), updatedProfileData, { merge: true });
        }

        await setProfileData(updatedProfileData);

        console.log("Profile updated successfully");
        return { success: true };
      } catch (error: any) {
        console.error("Profile update error:", error);
        return {
          success: false,
          error: getErrorMessage(error),
        };
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
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
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