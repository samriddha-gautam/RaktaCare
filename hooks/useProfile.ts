import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/services/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert } from "react-native";

export const useProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>();

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const docSnapshot = await getDoc(doc(db, "users", user.uid));
      if (docSnapshot.exists()) {
        setProfileData(docSnapshot.data());
      } else {
        alert("Profile Data not found");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { profileData, loading };
};
