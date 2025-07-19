import Cards from "@/components/Cards";
import HorizontalScroll from "@/components/HorizontalScroll";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { ScrollView, StyleSheet, SafeAreaView } from "react-native";

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screenPadding}
      >
        <ThemeToggle />
        <HorizontalScroll />
        <Cards />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default HomePage;
