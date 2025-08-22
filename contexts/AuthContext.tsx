import { auth } from "@/services/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@auth_user",
  PROFILE_DATA: "@profile_data",
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
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(userToStore)
        );
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
        await AsyncStorage.setItem(
          STORAGE_KEYS.PROFILE_DATA,
          JSON.stringify(data)
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }
      setProfileDataState(data);
    } catch (error) {
      console.error("Error persisting profile data:", error);
    }
  };

  const loadPersistedData = async () => {
    try {
      setIsLoading(true);

      const authStatus = await AsyncStorage.getItem(
        STORAGE_KEYS.IS_AUTHENTICATED
      );
      const wasAuthenticated = authStatus === "true";

      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let persistedUser = null;
      if (storedUser) {
        persistedUser = JSON.parse(storedUser);
      }

      const storedProfile = await AsyncStorage.getItem(
        STORAGE_KEYS.PROFILE_DATA
      );
      let persistedProfile = null;
      if (storedProfile) {
        persistedProfile = JSON.parse(storedProfile);
        setProfileDataState(persistedProfile);
      }

      if (wasAuthenticated && persistedUser) {
        setIsAuthenticated(true);
        console.log("Restored authentication state from storage");
      }

      return { wasAuthenticated, persistedUser, persistedProfile };
    } catch (error) {
      console.error("Error loading persisted data:", error);
      return {
        wasAuthenticated: false,
        persistedUser: null,
        persistedProfile: null,
      };
    } finally {
      setIsLoading(false);
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
    loadPersistedData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Firebase auth state changed:",
        firebaseUser?.email || "No user"
      );

      setUser(firebaseUser);

      if (firebaseUser) {
        setIsAuthenticated(true);
        await persistUserData(firebaseUser);

        if (!profileData) {
          const autoProfileData: ProfileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            displayName: firebaseUser.displayName || "",
          };
          await setProfileData(autoProfileData);
        }
      } else {
        setIsAuthenticated(false);
        await persistUserData(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, [profileData]);

  const contextValue: AuthContextType = {
    user,
    profileData,
    isAuthenticated,
    isLoading,
    setProfileData,
    clearAllData,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
