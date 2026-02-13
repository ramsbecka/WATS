import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { colors, typography } from '@/theme/tokens';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading || !user) return;
    router.replace('/(tabs)');
  }, [loading, user]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [loading, user]);

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
