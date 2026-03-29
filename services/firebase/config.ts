import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  // @ts-ignore
  getReactNativePersistence,
  Auth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4zx3y2VwNxCGL9SIh5jfH6GW5GTnUEzU",
  authDomain: "raktacare-e96ee.firebaseapp.com",
  projectId: "raktacare-e96ee",

  storageBucket: "raktacare-e96ee.firebasestorage.app",

  messagingSenderId: "1043181616295",
  appId: "1:1043181616295:web:39e0b8855ff02db3e6af82",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);

// Use React Native persistence for better session management
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Fallback in case it's already initialized (e.g. during HMR)
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

// ✅ Use the storage tied to this app
export const storage = getStorage(app);

export default app;