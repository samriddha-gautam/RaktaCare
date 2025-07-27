
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC4zx3y2VwNxCGL9SIh5jfH6GW5GTnUEzU",
  authDomain: "raktacare-e96ee.firebaseapp.com",
  projectId: "raktacare-e96ee",
  storageBucket: "raktacare-e96ee.firebasestorage.app",
  messagingSenderId: "1043181616295",
  appId: "1:1043181616295:web:39e0b8855ff02db3e6af82"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;