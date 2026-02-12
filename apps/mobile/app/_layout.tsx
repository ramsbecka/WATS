import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const { setUser, setProfile, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setLoading(false);
    };
    // Timeout: if getSession hangs (e.g. placeholder URL / no network), show login after 2.5s
    const t = setTimeout(finish, 2500);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      finish();
    }).catch(() => finish()).finally(() => clearTimeout(t));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background, flex: 1 } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkout/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout/payment" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="products/index" />
        <Stack.Screen name="products/[id]" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="notifications" />
          </Stack>
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh', height: '100vh' } : {}),
  },
});
