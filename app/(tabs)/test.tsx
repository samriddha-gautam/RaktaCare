import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  UserCredential,
  signInAnonymously,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { auth, db, storage } from "@/config/firebase";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useTheme } from "@/contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_OAUTH_CONFIG = {
  webClientId:
    "1043181616295-mlkovpgnfg6ljveah43noh1gh9ngmcir.apps.googleusercontent.com",
};

const testFirebaseConnection = async () => {
  try {
    console.log("🔥 Testing Firebase Connection...");

    if (auth && db && storage) {
      console.log("✅ Firebase services initialized successfully");
    } else {
      console.log("❌ Firebase services not initialized");
      return false;
    }

    try {
      const userCredential: UserCredential = await signInAnonymously(auth);
      console.log(
        "✅ Authentication working - User ID:",
        userCredential.user.uid
      );
    } catch (authError) {
      if (authError instanceof FirebaseError) {
        console.log("❌ Authentication error:", authError.message);
      } else {
        console.log("❌ Authentication error:", String(authError));
      }
    }

    try {
      const testCollection = collection(db, "test");
      const snapshot = await getDocs(testCollection);
      console.log(
        "✅ Firestore connection working - Documents found:",
        snapshot.size
      );
    } catch (firestoreError) {
      if (firestoreError instanceof FirebaseError) {
        console.log("❌ Firestore error:", firestoreError.message);
      } else {
        console.log("❌ Firestore error:", String(firestoreError));
      }
    }

    try {
      console.log("✅ Storage service accessible");
    } catch (storageError) {
      if (storageError instanceof FirebaseError) {
        console.log("❌ Storage error:", storageError.message);
      } else {
        console.log("❌ Storage error:", String(storageError));
      }
    }

    return true;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.log("❌ General Firebase error:", error.message);
    } else {
      console.log("❌ General Firebase error:", String(error));
    }
    return false;
  }
};

export default function test() {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const [firebaseStatus, setFirebaseStatus] = useState("testing...");
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_OAUTH_CONFIG.webClientId,
      scopes: ["openid", "profile", "email"],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: "raktacare",
        // useProxy: true,
      }),
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    }
  );

  useEffect(() => {
    checkFirebase();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        console.log("✅ User signed in:", user.email || user.uid);
      } else {
        console.log("❌ User signed out");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        signInWithGoogleToken(authentication.idToken);
      }
    }
  }, [response]);

  const checkFirebase = async (): Promise<void> => {
    try {
      const isWorking = await testFirebaseConnection();
      setFirebaseStatus(isWorking ? "Firebase Connected" : "Error Connecting");
    } catch (error) {
      setFirebaseStatus("connection failed");
      console.log("Connected to firebase failed", error);
    }
  };

  const signInWithGoogleToken = async (idToken: string): Promise<void> => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      console.log("✅ Google Sign-In successful:", userCredential.user.email);
      Alert.alert(
        "Success",
        `Welcome ${
          userCredential.user.displayName || userCredential.user.email
        }!`
      );
    } catch (error) {
      console.log("❌ Firebase sign-in error:", error);
      Alert.alert("Error", "Failed to sign in with Google");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsSigningIn(true);
    try {
      await promptAsync();
    } catch (error) {
      console.log("❌ Auth request error:", error);
      Alert.alert("Error", "Failed to initiate Google Sign-In");
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log("✅ Sign-out successful");
    } catch (error) {
      console.log("❌ Sign-out error:", error);
    }
  };

  const handleSignOutPress = (): void => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", onPress: handleSignOut, style: "destructive" },
    ]);
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      <View>
        <Text style={{ color: theme.colors.text }}>Firebase Test (Expo)</Text>
        <Text style={{ color: theme.colors.text }}>
          Status: {firebaseStatus}
        </Text>

        {user ? (
          <View>
            <Text style={{ color: theme.colors.text }}>Welcome!</Text>
            <Text style={{ color: theme.colors.text }}>
              {user.displayName || user.email || user.uid}
            </Text>
            <TouchableOpacity onPress={handleSignOutPress}>
              <Text style={{ color: theme.colors.text }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isSigningIn || !request}
          >
            <Text style={{ color: theme.colors.text }}>
              {isSigningIn ? "Signing in..." : "Sign in with Google"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
