import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { colors, typography } from '@/theme/tokens';

export default function Index() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    
    // Redirect based on auth state
    if (user) {
      // Check if already on tabs route
      if (pathname?.startsWith('/(tabs)')) return;
      
      // Use push instead of replace for web compatibility
      if (Platform.OS === 'web') {
        router.push('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      // Check if already on auth route
      if (pathname?.startsWith('/auth')) return;
      
      // Use push instead of replace for web compatibility
      if (Platform.OS === 'web') {
        router.push('/auth');
      } else {
        router.replace('/auth');
      }
    }
  }, [loading, user, router, pathname]);

  // Loading: show spinner (use View + minHeight so it's visible on web too)
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // Not logged in: redirect to auth (handled by useEffect above)
  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Inafungua…</Text>
      </View>
    );
  }

  // Logged in: redirect to tabs; show short "Opening…" while navigating
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Opening…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
  },
});
