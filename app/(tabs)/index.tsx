
import Cards from "@/components/ui/Cards";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import Header, {DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useRef, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
} from "react-native";


const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

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
        contentContainerStyle={{ paddingTop: DEFAULT_HEADER_HEIGHT}}
      >
        <HorizontalScroll />
        <Cards />
       
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;