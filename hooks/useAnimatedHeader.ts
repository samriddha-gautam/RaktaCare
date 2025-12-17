// hooks/useAnimatedHeader.ts
import { useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseAnimatedHeaderOptions {
  headerHeight?: number;
  hideThreshold?: number;
  showThreshold?: number;
  animationDuration?: number;
  minScrollY?: number;
}

export const useAnimatedHeader = (options: UseAnimatedHeaderOptions = {}) => {
  const {
    headerHeight = 150,
    hideThreshold = 10,
    showThreshold = 10,
    animationDuration = 200,
    minScrollY = 50,
  } = options;

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

  // Reset header visibility (useful for navigation or manual control)
  const resetHeader = useCallback(() => {
    setIsHeaderVisible(true);
    headerTranslateY.setValue(0);
    lastScrollY.current = 0;
    scrollY.setValue(0);
  }, [headerTranslateY, scrollY]);

  // Manual control functions
  const toggleHeader = useCallback(() => {
    if (isHeaderVisible) {
      hideHeader();
    } else {
      showHeader();
    }
  }, [isHeaderVisible, hideHeader, showHeader]);

  return {
    // Animation values
    scrollY,
    headerTranslateY,
    isHeaderVisible,
    
    // Scroll handler for ScrollView
    handleScroll,
    
    // Manual control functions
    hideHeader,
    showHeader,
    toggleHeader,
    resetHeader,
    
    // Utility values
    headerHeight,
  };
};

