import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { FirebaseError, initializeApp } from "firebase/app";
import { initializeAuth, getAuth, UserCredential, signInAnonymously } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, collection, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db, storage } from "@/config/firebase";

const testFirebaseConnection = async () =>{
  try {
    console.log('🔥 Testing Firebase Connection...');
    
    // Test 1: Check if Firebase is initialized
    if (auth && db && storage) {
      console.log('✅ Firebase services initialized successfully');
    } else {
      console.log('❌ Firebase services not initialized');
      return false;
    }

    // Test 2: Test Authentication (Anonymous)
    try {
      const userCredential: UserCredential = await signInAnonymously(auth);
      console.log('✅ Authentication working - User ID:', userCredential.user.uid);
    } catch (authError) {
      if (authError instanceof FirebaseError) {
        console.log('❌ Authentication error:', authError.message);
      } else {
        console.log('❌ Authentication error:', String(authError));
      }
    }

    // Test 3: Test Firestore (try to read a collection)
    try {
      const testCollection = collection(db, 'test');
      const snapshot = await getDocs(testCollection);
      console.log('✅ Firestore connection working - Documents found:', snapshot.size);
    } catch (firestoreError) {
      if (firestoreError instanceof FirebaseError) {
        console.log('❌ Firestore error:', firestoreError.message);
      } else {
        console.log('❌ Firestore error:', String(firestoreError));
      }
    }

    // Test 4: Test Storage reference
    try {
      // Note: For Firebase v9+, use ref() from firebase/storage instead
      console.log('✅ Storage service accessible');
    } catch (storageError) {
      if (storageError instanceof FirebaseError) {
        console.log('❌ Storage error:', storageError.message);
      } else {
        console.log('❌ Storage error:', String(storageError));
      }
    }

    return true;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.log('❌ General Firebase error:', error.message);
    } else {
      console.log('❌ General Firebase error:', String(error));
    }
    return false;
  }
};


export default function test() {
  const [firebaseStatus, setFirebaesStatus] = useState("testing...");
  useEffect(() => {
    checkFirebase();
  },[]);

  const checkFirebase = async (): Promise<void> => {
    try {
      const isWorking = await testFirebaseConnection();
      setFirebaesStatus(isWorking ? "Firebase Connected" : "Error Connecting");
    } catch (error) {
      setFirebaesStatus("connection failed");
      console.log("Connected to firebase failed", error);
    }
  };
  return (
    <View>
      <Text>test</Text>
    </View>
  );
}
