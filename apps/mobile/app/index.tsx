import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
