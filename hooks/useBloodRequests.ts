import { db } from "@/services/firebase/config";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

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

export const useBloodRequests = (enabled: boolean) => {
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [allActiveRequests, setAllActiveRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    // This forces both listeners to restart
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // give UI a moment; snapshots will set loading states
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const getThreeDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    return Timestamp.fromDate(date);
  };

  useEffect(() => {
    if (!enabled) {
      setRecentRequests([]);
      setAllActiveRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

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
        const requests: BloodRequest[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
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
  }, [enabled, refreshKey]);

  useEffect(() => {
    if (!enabled) return;
    if (recentRequests.length !== 0) return;
    if (isLoading) return;

    const q = query(collection(db, "bloodRequests"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: BloodRequest[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setAllActiveRequests(requests);
      },
      (err) => {
        console.error("Error fetching all requests:", err);
      }
    );

    return () => unsubscribe();
  }, [enabled, recentRequests.length, isLoading, refreshKey]);

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
      return { success: false, error: error.message || "Failed to update status" };
    }
  };

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
      return { success: false, error: error.message || "Failed to delete request" };
    }
  };

  const displayRequests = recentRequests.length > 0 ? recentRequests : allActiveRequests;
  const activeRequests = displayRequests.filter((req) => req.status === "active");
  const completedRequests = displayRequests.filter((req) => req.status === "completed");

  return {
    recentRequests,
    allActiveRequests,
    displayRequests,
    activeRequests,
    completedRequests,
    isLoading,
    error,
    refreshing,
    refresh,
    toggleRequestStatus,
    deleteRequest,
  };
};