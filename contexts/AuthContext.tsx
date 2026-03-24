import { auth } from "@/services/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEYS = {
  USER: "@auth_user",
  PROFILE_DATA: "@profile_data",
  // Keep the key if you want, but we will NOT use it as source of truth
  IS_AUTHENTICATED: "@is_authenticated",
} as const;

interface ProfileData {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
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

  // ✅ Only load cached PROFILE data (do not set isAuthenticated from storage)
  const loadPersistedProfileOnly = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
      if (storedProfile) {
        setProfileDataState(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Error loading persisted profile:", error);
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

  useEffect(() => {
    // load cached profile while Firebase resolves auth session
    loadPersistedProfileOnly();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase auth state changed:", firebaseUser?.email || "No user");

      setUser(firebaseUser);

      if (firebaseUser) {
        setIsAuthenticated(true);
        await persistUserData(firebaseUser);

        // If profileData missing, try to restore cached profile or create minimal one
        if (!profileData) {
          const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
          if (!storedProfile) {
            const autoProfileData: ProfileData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              displayName: firebaseUser.displayName || "",
            };
            await setProfileData(autoProfileData);
          } else {
            setProfileDataState(JSON.parse(storedProfile));
          }
        }
      } else {
        // ✅ ALWAYS clear state on logout (no isLoading condition)
        setIsAuthenticated(false);
        setProfileDataState(null);
        await persistUserData(null);

        // Optional: also remove profile cache on sign-out to avoid showing old data
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }

      setIsLoading(false);
    });

    return unsubscribe;
    // IMPORTANT: do not include profileData in deps, otherwise effect can re-run unexpectedly
    // eslint-disable-next-line react-hooks/exhaustive-deps
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