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
    // Timeout: if getSession hangs (e.g. placeholder URL / no network), show login faster on web
    const timeout = Platform.OS === 'web' ? 1000 : 2500;
    const t = setTimeout(finish, timeout);
    
    // Try to get session with race condition protection
    Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), timeout - 100))
    ]).then((result: any) => {
      const { data: { session } } = result || { data: { session: null } };
      setUser(session?.user ?? null);
      if (session?.user) {
        // Don't await - let it load in background
        fetchProfile(session.user.id).catch(() => {
          // Silently handle profile fetch errors
        });
      } else {
        setProfile(null);
      }
      finish();
    }).catch(() => {
      // On error, assume no session
      setUser(null);
      setProfile(null);
      finish();
    }).finally(() => clearTimeout(t));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Don't await - let it load in background
        fetchProfile(session.user.id).catch(() => {
          // Silently handle profile fetch errors
        });
      } else {
        setProfile(null);
      }
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
    ...(Platform.OS === 'web' ? { 
      minHeight: '100vh', 
      height: '100vh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    } : {}),
  },
});
