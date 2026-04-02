import { auth, db } from "@/services/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEYS = {
  USER: "@auth_user",
  PROFILE_DATA: "@profile_data",
  IS_AUTHENTICATED: "@is_authenticated",
} as const;

type UserRole = "requester" | "donor" | "admin";

interface ProfileData {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  photoURL?: string;

  // ✅ important for rules/UI
  role?: UserRole;

  // allow extra fields
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profileData: ProfileData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setProfileData: (data: ProfileData | null) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface AuthContextProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  isAuthenticated: false,
  isLoading: true,
  setProfileData: async () => {},
  clearAllData: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: AuthContextProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileDataState] = useState<ProfileData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const persistUserData = async (userData: User | null) => {
    try {
      if (userData) {
        const userToStore = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          emailVerified: userData.emailVerified,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
        await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "true");
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "false");
      }
    } catch (error) {
      console.error("Error persisting user data:", error);
    }
  };

  const setProfileData = async (data: ProfileData | null) => {
    try {
      if (data) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(data));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }
      setProfileDataState(data);
    } catch (error) {
      console.error("Error persisting profile data:", error);
    }
  };

  // ✅ Optimistically load cached AUTH & PROFILE data (to keep UI looking logged in)
  const loadPersistedAuthAndProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
      if (storedProfile) {
        setProfileDataState(JSON.parse(storedProfile));
      }

      const cachedAuth = await AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
      if (cachedAuth === "true") {
        setIsAuthenticated(true);
        console.log("Found cached session state");
      }
    } catch (error) {
      console.error("Error loading persisted profile/auth:", error);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PROFILE_DATA,
        STORAGE_KEYS.IS_AUTHENTICATED,
      ]);
      setProfileDataState(null);
      setIsAuthenticated(false);
      setUser(null);
      console.log("Cleared all persisted auth data");
    } catch (error) {
      console.error("Error clearing persisted data:", error);
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      await persistUserData(auth.currentUser);
      setUser(auth.currentUser);
    }
  };

  const ensureAndLoadFirestoreProfile = async (firebaseUser: User): Promise<ProfileData> => {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    // Create minimal user doc if it does not exist
    if (!snap.exists()) {
      const created: ProfileData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        role: "requester", // ✅ default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, created, { merge: true });
      return created;
    }

    // Merge Firestore data with auth basics
    const data = snap.data() as any;

    // Backfill role if missing (important for existing users)
    if (!data.role) {
      await setDoc(ref, { role: "requester", updatedAt: serverTimestamp() }, { merge: true });
      data.role = "requester";
    }

    const merged: ProfileData = {
      id: firebaseUser.uid,
      email: firebaseUser.email || data.email || "",
      name: data.name || firebaseUser.displayName || "",
      displayName: data.displayName || firebaseUser.displayName || "",
      photoURL: data.photoURL || firebaseUser.photoURL || "",
      ...data,
    };

    return merged;
  };

  useEffect(() => {
    loadPersistedAuthAndProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase auth state changed:", firebaseUser?.email || "No user");

      setUser(firebaseUser);

      if (firebaseUser) {
        setIsAuthenticated(true);
        await persistUserData(firebaseUser);

        // ✅ Always try to load profile from Firestore (source of truth for role)
        try {
          const firestoreProfile = await ensureAndLoadFirestoreProfile(firebaseUser);
          await setProfileData(firestoreProfile);
        } catch (e) {
          console.log("Failed to load Firestore profile:", e);

          // fallback to cached profile if Firestore fails
          const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
          if (storedProfile) {
            setProfileDataState(JSON.parse(storedProfile));
          } else {
            // as last fallback create minimal local profile (role unknown)
            const autoProfileData: ProfileData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
            };
            await setProfileData(autoProfileData);
          }
        }
      } else {
        setIsAuthenticated(false);
        setProfileDataState(null);
        await persistUserData(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }

      setIsLoading(false);
    });

    return unsubscribe;
    // Note: do not add profileData as dependency; it causes re-subscribe loops
  }, []);

  const contextValue: AuthContextType = {
    user,
    profileData,
    isAuthenticated,
    isLoading,
    setProfileData,
    clearAllData,
    refreshUserData,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};