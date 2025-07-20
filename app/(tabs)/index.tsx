import Cards from "@/components/Cards";
import HorizontalScroll from "@/components/HorizontalScroll";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  View,
  TouchableOpacity,
  Text,
} from "react-native";

const HEADER_HEIGHT = 150;
const SCROLL_THRESHOLD = 50;

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDiff = currentScrollY - lastScrollY.current;

        if (Math.abs(scrollDiff) > SCROLL_THRESHOLD) {
          if (
            scrollDiff > 0 &&
            isHeaderVisible &&
            currentScrollY > HEADER_HEIGHT
          ) {
            hideHeader();
          } else if (scrollDiff < 0 && !isHeaderVisible) {
            showHeader();
          }
          lastScrollY.current = currentScrollY;
        }
      },
    }
  );

  const hideHeader = () => {
    setIsHeaderVisible(false);
    Animated.timing(headerTranslateY, {
      toValue: -HEADER_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const showHeader = () => {
    setIsHeaderVisible(true);
    Animated.timing(headerTranslateY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const navigateToProfile = () => {
    router.push("/profile");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Sticky Header */}
      <Animated.View
        style={[
          
          headerStyles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border || "#e0e0e0",
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={headerStyles.headerContent}>
          <Text
            style={[headerStyles.headerTitle, { color: theme.colors.text }]}
          >
            Home
          </Text>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={navigateToProfile}
            style={[
              headerStyles.profileButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={headerStyles.profileButtonText}>Profile</Text>
            {/* You can replace this with an icon component if you have one */}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16 }}// Account for header height + some spacing
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
    height: HEADER_HEIGHT,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  profileButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default HomePage;
