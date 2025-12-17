import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/services/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BloodRequestData {
  bloodType: string;
  description: string;
  location: string;
  contactPhone: string;
}

export const useBloodRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user, profileData } = useAuth();

  const validateRequest = (data: BloodRequestData): string | null => {
    if (!data.bloodType) {
      return "Please select a blood type";
    }
    if (!data.description.trim()) {
      return "Please enter a description";
    }
    if (!data.location.trim()) {
      return "Please enter a location";
    }
    if (!data.contactPhone.trim()) {
      return "Please enter a contact phone number";
    }
    if (!user) {
      return "You must be logged in to create a request";
    }
    return null;
  };

  const createBloodRequest = async (
    data: BloodRequestData
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate
    const validationError = validateRequest(data);
    if (validationError) {
      return { success: false, error: validationError };
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        bloodType: data.bloodType,
        description: data.description.trim(),
        location: data.location.trim(),
        contactPhone: data.contactPhone.trim(),
        userId: user!.uid,
        userName: profileData?.name || profileData?.displayName || "Anonymous",
        userEmail: user!.email,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bloodRequests"), requestData);

      return { success: true };
    } catch (error: any) {
      console.error("Error creating request:", error);
      return {
        success: false,
        error: error.message || "Failed to create request. Please try again.",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultPhone = (): string => {
    return profileData?.phone || "";
  };

  return {
    createBloodRequest,
    isSubmitting,
    getDefaultPhone,
  };
};