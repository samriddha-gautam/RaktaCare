import Cards from "@/components/ui/Cards";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useRef, useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
} from "react-native";

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);
  
  const [selectedBloodType, setSelectedBloodType] = useState<string>("");

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
      <Header 
        ref={headerRef}
        headerHeight={DEFAULT_HEADER_HEIGHT}
      />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: DEFAULT_HEADER_HEIGHT }}
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