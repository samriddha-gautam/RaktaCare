import { db } from "@/services/firebase/config";
import { useAuthStore } from "@/stores/authStore";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { useState } from "react";

export interface BloodRequestData {
  bloodType: string;
  description: string;
  location: string;
  contactPhone: string;
  urgency?: "critical" | "urgent" | "standard";
  unitsNeeded?: number;
}

export const useBloodRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user, profileData } = useAuthStore();

  const validateRequest = (data: BloodRequestData): string | null => {
    if (!data.bloodType) {
      return "Please select a blood type";
    }
    if (!data.description.trim()) {
      return "Please enter a description for the request";
    }
    if (!data.location.trim()) {
      return "Please enter a location(within city or area)";
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
      // Pin location based on the typed address using Nominatim
      let coords = null;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location.trim())}&format=json&limit=1`);
        const json = await res.json();
        if (json && json.length > 0) {
            const lat = parseFloat(json[0].lat);
            const lng = parseFloat(json[0].lon);
            coords = {
                lat,
                lng,
                geohash: geohashForLocation([lat, lng]),
            };
        }
      } catch (locError) {
        console.log("Could not reverse geocode typed location", locError);
      }

      // Detect urgency from description if not provided
      let finalUrgency = data.urgency || "standard";
      const descLower = data.description.toLowerCase();
      if (descLower.includes("icu") || descLower.includes("critical") || descLower.includes("accident")) {
        finalUrgency = "critical";
      } else if (descLower.includes("urgent") || descLower.includes("emergency") || descLower.includes("surgery")) {
        finalUrgency = "urgent";
      }

      const requestData = {
        bloodType: data.bloodType,
        description: data.description.trim(),
        location: data.location.trim(), // string description
        coords, // GPS location
        contactPhone: data.contactPhone.trim(),
        userId: user!.uid,
        userName: profileData?.name || profileData?.displayName || "Anonymous",
        userEmail: user!.email,
        status: "active",
        urgency: finalUrgency,
        unitsNeeded: data.unitsNeeded || 1,
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