import Cards from "@/components/ui/Cards";
import DemandAnalyticsCard from "@/components/ui/DemandAnalyticsCard";
import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import RequestsFilterPanel, { DateRange, StatusFilter } from "@/components/ui/RequestsFilterPanel";
import RequestsSearchBar from "@/components/ui/RequestsSearchBar";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import { useAuthStore } from "@/stores/authStore";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const [selectedBloodType, setSelectedBloodType] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("3d");

  const { isAuthenticated, isLoading: authLoading, profileData } = useAuthStore();

  // Always fetch requests — guests can browse, just can't act
  const enabled = !authLoading;

  // determine admin from profileData.role
  const isAdmin = profileData?.role === "admin";

  const {
    displayRequests,
    activeRequests,
    error,
    refreshing,
    refresh,
    toggleRequestStatus,
  } = useBloodRequests(enabled);

  const errorRequests = useMemo(() => {
    if (!error) return null;
    if (error.includes("permissions") || error.includes("permission-denied")) {
      return "Guest mode limited. Please login to view real-time requests or update Firestore rules to allow public reads.";
    }
    return error;
  }, [error]);

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

  const handleBloodTypeSelect = (bloodType: string) => {
    setSelectedBloodType((prev) => (prev === bloodType ? "" : bloodType));
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedBloodType("");
    setStatusFilter("all");
    setDateRange("3d");
  };

  const filteredRequests = useMemo(() => {
    let list = [...displayRequests];

    if (dateRange !== "all") {
      const now = new Date();
      let cutoff = new Date();
      if (dateRange === "24h") cutoff.setDate(now.getDate() - 1);
      if (dateRange === "3d") cutoff.setDate(now.getDate() - 3);
      if (dateRange === "7d") cutoff.setDate(now.getDate() - 7);
      list = list.filter((r: any) => {
        const t = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
        return t >= cutoff;
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (selectedBloodType) {
      list = list.filter((r) => r.bloodType === selectedBloodType);
    }

    if (searchText && searchText.trim().length > 0) {
      const q = searchText.trim().toLowerCase();
      list = list.filter((r) => {
        const loc = (r.location || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const name = (r.userName || "").toLowerCase();
        return loc.includes(q) || desc.includes(q) || name.includes(q);
      });
    }

    return list;
  }, [displayRequests, dateRange, statusFilter, selectedBloodType, searchText]);

  const filteredActiveRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === "active"),
    [filteredRequests]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header ref={headerRef} headerHeight={DEFAULT_HEADER_HEIGHT} />

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: DEFAULT_HEADER_HEIGHT }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={{ paddingBottom: 12 }}>
          <RequestsSearchBar value={searchText} onChange={setSearchText} />
          <RequestsFilterPanel
            status={statusFilter}
            setStatus={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            reset={resetFilters}
          />
        </View>

        {/* Analytics Chart (admin only) */}
        {isAdmin && filteredRequests?.length > 0 && (
          <DemandAnalyticsCard requests={filteredRequests} />
        )}

        <HorizontalScroll
          selectedBloodType={selectedBloodType}
          onSelectBloodType={handleBloodTypeSelect}
        />

        <Cards
          filterBloodType={selectedBloodType}
          displayRequests={filteredRequests}
          activeRequests={filteredActiveRequests}
          isLoadingRequests={refreshing}
          errorRequests={errorRequests}
          toggleRequestStatus={toggleRequestStatus}
          enabled={enabled}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;