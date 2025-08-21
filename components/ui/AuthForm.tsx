import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  loading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onSignup, loading }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = () => onLogin(email, password);
  const handleSignup = () => onSignup(email, password, name);
  return (
    <SafeAreaView>
      <View>
        <TextInput
            value={name}
            onChangeText={setName}
            style = {styles.input}
            placeholder="Enter your name"
            editable = {!loading}
        />
        <TextInput
            value={email}
            onChangeText={setEmail}
            style = {styles.input}
            placeholder="Enter you email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable = {!loading}
        />
        <TextInput
            value={password}
            onChangeText={setPassword}
            style = {styles.input}
            placeholder="Enter you password"
            secureTextEntry
            editable = {!loading}
        />
        <Button
            onPress={handleSignup}
            title={loading?"Loading ..." : "Sign Up"}
            disabled = {loading}
        />
        <Button
            onPress={handleLogin}
            title={loading?"Loading ..." : "Login"}
            disabled = {loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#8d4b4bff',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
});

export default AuthForm;
