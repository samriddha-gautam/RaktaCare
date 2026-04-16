import Cards from "@/components/ui/Cards";
import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import RequestsFilterPanel, { DateRange, StatusFilter } from "@/components/ui/RequestsFilterPanel";
import RequestsSearchBar from "@/components/ui/RequestsSearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, View } from "react-native";

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const [selectedBloodType, setSelectedBloodType] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("3d");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated && !!user?.uid;

  const {
    displayRequests,
    activeRequests,
    error, // ✅ your hook uses `error`
    refreshing,
    refresh,
    toggleRequestStatus,
  } = useBloodRequests(enabled);

  const errorRequests = error ?? null;

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

    // date filter: dateRange -> cutoff
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

    // status filter
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // blood type filter from horizontal chips
    if (selectedBloodType) {
      list = list.filter((r) => r.bloodType === selectedBloodType);
    }

    // search text (location, description, userName)
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
        {/* Search + Filters */}
        <View style={{ paddingVertical: 12 }}>
          <RequestsSearchBar value={searchText} onChange={setSearchText} />
          <RequestsFilterPanel
            status={statusFilter}
            setStatus={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            reset={resetFilters}
          />
        </View>

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