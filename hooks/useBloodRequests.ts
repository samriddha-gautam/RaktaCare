import { useState, useEffect } from "react";
import { db } from "@/services/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";

export interface BloodRequest {
  id: string;
  bloodType: string;
  description: string;
  location: string;
  contactPhone: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  status: "active" | "completed";
  createdAt: Timestamp;
}

export const useBloodRequests = () => {
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [allActiveRequests, setAllActiveRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date 3 days ago
  const getThreeDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    return Timestamp.fromDate(date);
  };

  // Fetch recent requests (within 3 days)
  useEffect(() => {
    setIsLoading(true);
    const threeDaysAgo = getThreeDaysAgo();

    const q = query(
      collection(db, "bloodRequests"),
      where("createdAt", ">=", threeDaysAgo),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: BloodRequest[] = [];
        snapshot.forEach((doc) => {
          requests.push({
            id: doc.id,
            ...doc.data(),
          } as BloodRequest);
        });
        setRecentRequests(requests);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching recent requests:", err);
        setError("Failed to load recent requests");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch all active/completed requests if no recent ones
  useEffect(() => {
    if (recentRequests.length === 0 && !isLoading) {
      const q = query(
        collection(db, "bloodRequests"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const requests: BloodRequest[] = [];
          snapshot.forEach((doc) => {
            requests.push({
              id: doc.id,
              ...doc.data(),
            } as BloodRequest);
          });
          setAllActiveRequests(requests);
        },
        (err) => {
          console.error("Error fetching all requests:", err);
        }
      );

      return () => unsubscribe();
    }
  }, [recentRequests.length, isLoading]);

  // Toggle request status
  const toggleRequestStatus = async (
    requestId: string,
    currentStatus: "active" | "completed"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newStatus = currentStatus === "active" ? "completed" : "active";
      const requestRef = doc(db, "bloodRequests", requestId);
      
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error toggling status:", error);
      return {
        success: false,
        error: error.message || "Failed to update status",
      };
    }
  };

  // Delete request (optional - for user's own requests)
  const deleteRequest = async (
    requestId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const requestRef = doc(db, "bloodRequests", requestId);
      await updateDoc(requestRef, {
        status: "deleted",
        deletedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting request:", error);
      return {
        success: false,
        error: error.message || "Failed to delete request",
      };
    }
  };

  // Get requests to display (recent if available, otherwise all)
  const displayRequests = recentRequests.length > 0 
    ? recentRequests 
    : allActiveRequests;

  // Filter by status
  const activeRequests = displayRequests.filter(req => req.status === "active");
  const completedRequests = displayRequests.filter(req => req.status === "completed");

  return {
    recentRequests,
    allActiveRequests,
    displayRequests,
    activeRequests,
    completedRequests,
    isLoading,
    error,
    toggleRequestStatus,
    deleteRequest,
  };
};