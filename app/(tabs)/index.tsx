// app/(tabs)/index.tsx
import Cards from "@/components/Cards";
import HorizontalScroll from "@/components/HorizontalScroll";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useAnimatedHeader } from "@/hooks/useAnimatedHeader";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";

const HEADER_HEIGHT = 150;

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  
  // Use the hook directly in the page
  const headerAnimation = useAnimatedHeader({
    headerHeight: HEADER_HEIGHT,
    hideThreshold: 10,
    showThreshold: 10,
    animationDuration: 200,
  });

  const navigateToProfile = () => {
    router.push("/profile");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        style={[
          headerStyles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border || "#e0e0e0",
            height: HEADER_HEIGHT,
            transform: [{ translateY: headerAnimation.headerTranslateY }],
          },
        ]}
      >
        <View style={headerStyles.headerContent}>
          {/* Profile Button */}
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
            onPress={navigateToProfile}
          >
            <Image 
              source={{ uri: 'https://via.placeholder.com/55x55/007AFF/FFFFFF?text=U' }}
              style={headerStyles.profileImage} 
            />
            <Text 
              style={[
                { fontSize: 16, fontWeight: "bold" }, 
                { color: theme.colors.text }
              ]}
            >
              UserName
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <ScrollView
        onScroll={headerAnimation.handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16 }}
      >
        <HorizontalScroll />
        <Cards />
      </ScrollView>
      
    </SafeAreaView>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default HomePage;