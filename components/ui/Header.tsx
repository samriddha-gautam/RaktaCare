// components/ui/Header.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const DEFAULT_HEADER_HEIGHT = 120;

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

const Header = forwardRef<HeaderRef, HeaderProps>(
  (
    {
      headerHeight = DEFAULT_HEADER_HEIGHT,
      hideThreshold = 15,
      showThreshold = 10,
      animationDuration = 200,
      minScrollY = 20,
      onProfilePress,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const { profileData } = useAuth();

    const userName = profileData?.displayName || profileData?.name || "Guest";
    const userImageUri = profileData?.photoURL;
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

          const shouldUpdateLastScrollY = Math.abs(scrollDiff) > 5;

          if (
            scrollDiff > hideThreshold &&
            isHeaderVisible &&
            currentScrollY > minScrollY
          ) {
            hideHeader();
            if (shouldUpdateLastScrollY) {
              lastScrollY.current = currentScrollY;
            }
          } else if (scrollDiff < -showThreshold && !isHeaderVisible) {
            showHeader();
            if (shouldUpdateLastScrollY) {
              lastScrollY.current = currentScrollY;
            }
          } else if (shouldUpdateLastScrollY) {
            lastScrollY.current = currentScrollY;
          }

          if (currentScrollY <= 0) {
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

    useImperativeHandle(
      ref,
      () => ({
        handleScroll,
        hideHeader,
        showHeader,
        resetHeader,
      }),
      [handleScroll, hideHeader, showHeader, resetHeader]
    );

    // Derive the initial letter for the fallback avatar
    const initial = (userName?.[0] || "G").toUpperCase();
    const hasPhoto = Boolean(userImageUri);

    return (
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            height: headerHeight,
            transform: [{ translateY: headerTranslateY }],
            ...(theme.shadow.md as any),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.profileSection}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            {/* ✅ FIX: only render <Image> when we have a valid URI */}
            {hasPhoto ? (
              <Image
                source={{ uri: userImageUri! }}
                style={[
                  styles.profileImage,
                  { borderColor: theme.colors.border },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  styles.profileFallback,
                  { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.profileInitial, { color: theme.colors.primary }]}>
                  {initial}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                Welcome back
              </Text>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {userName}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  profileSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  profileFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
  },
});

export default Header;
