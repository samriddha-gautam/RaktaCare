// components/ui/Header.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";

export const DEFAULT_HEADER_HEIGHT = 150;

interface HeaderProps {
  headerHeight?: number;
  hideThreshold?: number;
  showThreshold?: number;
  animationDuration?: number;
  minScrollY?: number;
  userName?: string;
  userImageUri?: string;
  onProfilePress?: () => void;
}

export interface HeaderRef {
  handleScroll: (event: any) => void;
  hideHeader: () => void;
  showHeader: () => void;
  resetHeader: () => void;
}

const Header = forwardRef<HeaderRef, HeaderProps>(({
  headerHeight = DEFAULT_HEADER_HEIGHT,
  hideThreshold = 15,
  showThreshold = 10,
  animationDuration = 200,
  minScrollY = 20,
  userName = "UserName",
  userImageUri = "https://via.placeholder.com/55x55/007AFF/FFFFFF?text=U",
  onProfilePress,
}, ref) => {
  const { theme } = useTheme();

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const hideHeader = useCallback(() => {
    if (!isHeaderVisible) return;
    
    setIsHeaderVisible(false);
    Animated.timing(headerTranslateY, {
      toValue: -headerHeight,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [isHeaderVisible, headerHeight, animationDuration, headerTranslateY]);

  const showHeader = useCallback(() => {
    if (isHeaderVisible) return;
    
    setIsHeaderVisible(true);
    Animated.timing(headerTranslateY, {
      toValue: 0,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [isHeaderVisible, animationDuration, headerTranslateY]);

  const resetHeader = useCallback(() => {
    setIsHeaderVisible(true);
    headerTranslateY.setValue(0);
    lastScrollY.current = 0;
    scrollY.setValue(0);
  }, [headerTranslateY, scrollY]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDiff = currentScrollY - lastScrollY.current;

        // Always update lastScrollY to prevent getting stuck
        const shouldUpdateLastScrollY = Math.abs(scrollDiff) > 5;

        if (scrollDiff > hideThreshold && isHeaderVisible && currentScrollY > minScrollY) {
          // Scrolling down significantly - hide header
          hideHeader();
          if (shouldUpdateLastScrollY) {
            lastScrollY.current = currentScrollY;
          }
        } else if (scrollDiff < -showThreshold && !isHeaderVisible) {
          // Scrolling up significantly - show header
          showHeader();
          if (shouldUpdateLastScrollY) {
            lastScrollY.current = currentScrollY;
          }
        } else if (shouldUpdateLastScrollY) {
          // Update lastScrollY for small movements to prevent drift
          lastScrollY.current = currentScrollY;
        }

        // Handle edge cases
        if (currentScrollY <= 0) {
          // At top of scroll - always show header
          showHeader();
          lastScrollY.current = 0;
        }
      },
    }
  );

  const navigateToProfile = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/profile");
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleScroll,
    hideHeader,
    showHeader,
    resetHeader,
  }), [handleScroll, hideHeader, showHeader, resetHeader]);

  return (
    <Animated.View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border || "#e0e0e0",
          height: headerHeight,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={navigateToProfile}
        >
          <Image
            source={{ uri: userImageUri }}
            style={styles.profileImage}
          />
          <Text
            style={[
              styles.userName,
              { color: theme.colors.text }
            ]}
          >
            {userName}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

Header.displayName = 'Header';

const styles = StyleSheet.create({
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
  profileSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Header;