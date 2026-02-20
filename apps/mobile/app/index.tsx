import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { SplashScreen } from '@/components/ui/SplashScreen';

const SPLASH_MAX_MS = 6000; // Force continue after 6s if splash API is slow

export default function Index() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    safetyTimer.current = setTimeout(() => setSplashDone(true), SPLASH_MAX_MS);
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  const handleSplashFinish = () => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    setSplashDone(true);
  };

  useEffect(() => {
    if (!splashDone || loading) return;

    const path = String(pathname ?? '/');
    const onTabs = path.startsWith('/(tabs)') || path === '/(tabs)';
    const onAuth = path.startsWith('/auth');

    if (user && onTabs) return;
    if (!user && onAuth) return;

    const target = user ? '/(tabs)' : '/auth/login';
    router.replace(target as any);
  }, [splashDone, loading, user, router, pathname]);

  // 1. Show splash first (so user always sees splash, not "Loading…")
  if (!splashDone) {
    return (
      <View style={styles.fullScreen}>
        <SplashScreen
          onFinish={handleSplashFinish}
          autoSkip
          skipDuration={3500}
        />
      </View>
    );
  }

  // 2. After splash, redirect is handled by useEffect; show minimal placeholder while navigating
  return <View style={styles.fullScreen} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100vh', width: '100%' } : {}),
  },
});
