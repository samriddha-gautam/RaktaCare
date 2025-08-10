import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/services/firebase/config";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";

const profile = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profileData, setProfileData] = useState<any>(null);

  //SIGN_IN code
  const signup = async () => {
    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredentials.user.uid), { name, email });
      alert("Account Created");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged In");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      alert("logged out");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getProfileFromDatabase = async () => {
    if (!user) return;
    try {
      const docSnapShot = await getDoc(doc(db, "users", user.uid));
      if (docSnapShot.exists()) {
        setProfileData(docSnapShot.data);
      } else {
        alert("Profile Data Not found");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };
  return (
    <SafeAreaView>
      <View>
        {user ? (
          <>
            <Text>Hello user</Text>
            <Button onPress={getProfileFromDatabase} title="Load Your Profile"/>
            {profileData && (
              <View>
                <Text>Email: {profileData.email}</Text>
              </View>
            )}
            <Button title="Logout" onPress={logout} />
          </>
        ) : (
          <>
          <TextInput
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor:"#8d4b4bff"
              }}
              placeholder="Input Name"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={{
                backgroundColor:"#8d4b4bff"
              }}
              placeholder="Input Email"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={{
                backgroundColor:"#8d4b4bff"
              }}
              placeholder="Input Password"
            />
            <Button onPress={login} title="login"/>
            <Button onPress={signup} title="signup"></Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({});
