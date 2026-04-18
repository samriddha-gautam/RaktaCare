import { auth, db } from "@/services/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { create } from "zustand";

const STORAGE_KEYS = {
  USER: "@auth_user",
  PROFILE_DATA: "@profile_data",
  IS_AUTHENTICATED: "@is_authenticated",
} as const;

export type UserRole = "requester" | "donor" | "admin";

export interface ProfileData {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  isVerified?: boolean;
  isAvailableToDonate?: boolean;
  lastDonationDate?: any;
  responseRate?: number;
  currentAssignment?: string | null;
  fcmToken?: string;
  homeLocation?: {
    lat: number;
    lng: number;
    geohash: string;
    label: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    geohash: string;
    updatedAt: any;
  };
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  profileData: ProfileData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;

  setProfileData: (data: ProfileData | null) => Promise<void>;
  clearAllData: () => Promise<void>;
  initialize: () => () => void;
  refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profileData: null,
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  setProfileData: async (data: ProfileData | null) => {
    try {
      if (data) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(data));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }
      set({ profileData: data });
    } catch (error) {
      console.error("Error persisting profile data:", error);
    }
  },

  clearAllData: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PROFILE_DATA,
        STORAGE_KEYS.IS_AUTHENTICATED,
      ]);
      set({ profileData: null, isAuthenticated: false, user: null });
      console.log("Cleared all persisted auth data");
    } catch (error) {
      console.error("Error clearing persisted data:", error);
    }
  },

  refreshUserData: async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      set({ user: currentUser });
    }
  },

  initialize: () => {
    if (get().initialized) return () => {};

    // Initial load from storage to prevent flicker
    const loadPersisted = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
        if (storedProfile) {
          set({ profileData: JSON.parse(storedProfile) });
        }
        const cachedAuth = await AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
        if (cachedAuth === "true") {
          set({ isAuthenticated: true });
        }
      } catch (e) {
        console.error("Error loading persisted data:", e);
      }
    };

    loadPersisted();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 AuthStore: Firebase auth state changed:", firebaseUser?.email || "No user");

      set({ user: firebaseUser, isLoading: false, initialized: true });

      if (firebaseUser) {
        set({ isAuthenticated: true });
        await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "true");

        try {
          const profile = await ensureAndLoadFirestoreProfile(firebaseUser);
          await get().setProfileData(profile);
        } catch (e) {
          console.log("Failed to load Firestore profile, falling back to cache:", e);
          const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
          if (storedProfile) {
            set({ profileData: JSON.parse(storedProfile) });
          } else {
            // Last fallback: minimal profile
            const minimalProfile: ProfileData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              displayName: firebaseUser.displayName || "",
            };
            set({ profileData: minimalProfile });
          }
        }
      } else {
        set({ isAuthenticated: false, profileData: null });
        await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "false");
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      }
    });

    return unsubscribe;
  },
}));

async function ensureAndLoadFirestoreProfile(firebaseUser: User): Promise<ProfileData> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const created: ProfileData = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || "",
      displayName: firebaseUser.displayName || "",
      role: "requester",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, created, { merge: true });
    return created;
  }

  const data = snap.data() as ProfileData;
  if (!data.role) {
    await setDoc(ref, { role: "requester", updatedAt: serverTimestamp() }, { merge: true });
    data.role = "requester";
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || data.email || "",
    name: data.name || firebaseUser.displayName || "",
    displayName: data.displayName || firebaseUser.displayName || "",
    ...data,
  };
}
