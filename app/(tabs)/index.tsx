import Cards from "@/components/ui/Cards";
import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useCallback, useRef, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from "react-native";

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const [selectedBloodType, setSelectedBloodType] = useState<string>("");

  // Enable/disable Firestore subscriptions based on auth state
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated && !!user?.uid;

  // Pull-to-refresh control comes from the hook
  const { refreshing, refresh } = useBloodRequests(enabled);

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

  const handleBloodTypeSelect = (bloodType: string) => {
    if (selectedBloodType === bloodType) {
      setSelectedBloodType("");
    } else {
      setSelectedBloodType(bloodType);
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
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
        <HorizontalScroll
          selectedBloodType={selectedBloodType}
          onSelectBloodType={handleBloodTypeSelect}
        />

        <Cards filterBloodType={selectedBloodType} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;