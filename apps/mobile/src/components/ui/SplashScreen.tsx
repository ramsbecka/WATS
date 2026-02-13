import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, Dimensions, ScrollView, Image, StatusBar } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { getSplashImages } from '@/api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashImage {
  id: string;
  image_url: string;
  title_sw?: string;
  title_en?: string;
  description_sw?: string;
  description_en?: string;
  sort_order: number;
}

interface SplashScreenProps {
  onFinish?: () => void;
  autoSkip?: boolean;
  skipDuration?: number;
}

export function SplashScreen({ onFinish, autoSkip = false, skipDuration = 5000 }: SplashScreenProps) {
  const [images, setImages] = useState<SplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Load splash images from database
    getSplashImages()
      .then((data) => {
        if (data && data.length > 0) {
          setImages(data as SplashImage[]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load splash images:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (images.length === 0 && !loading) {
      // No splash images, finish immediately
      const timer = setTimeout(() => {
        if (onFinish) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => onFinish());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [images.length, loading, fadeAnim, onFinish]);

  useEffect(() => {
    if (autoSkip && images.length > 0) {
      const timer = setTimeout(() => {
        if (currentIndex < images.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
        } else if (onFinish) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => onFinish());
        }
      }, skipDuration);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, images.length, autoSkip, skipDuration, fadeAnim, onFinish]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (images.length === 0) {
    // No splash images, show empty screen (will auto-finish via useEffect above)
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.emptyContainer} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar hidden={true} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((img) => (
          <View key={img.id} style={styles.slide}>
            <Image source={{ uri: img.image_url }} style={styles.image} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  } as any,
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: spacing.xl + 20,
    left: 0,
    right: 0,
    gap: spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: colors.onPrimary,
    width: 24,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
