import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileViewProps {
  profileData: any;
//   onLoadProfile: () => void;
  onLogout: () => Promise<void>;
  loading?: boolean;
}
const ProfileView: React.FC<ProfileViewProps> = ({
  profileData,
//   onLoadProfile,
  onLogout,
  loading,
}) => {
  return (
    <SafeAreaView>
      <View>
        <Text>Hello {profileData.name}</Text>
        <Text>Your Pofile:</Text>
        <View>
          <Text>Display Name :{profileData.name}</Text>
          <Text>Email : {profileData.email}</Text>
        </View>
        <Button title="Logout" onPress={onLogout} disabled={loading} />
      </View>
    </SafeAreaView>
  );
};

export default ProfileView;