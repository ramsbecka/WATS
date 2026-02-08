import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const { setUser, setProfile, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkout/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout/payment" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="products/index" />
        <Stack.Screen name="products/[id]" />
        <Stack.Screen name="login" />
        <Stack.Screen name="notifications" />
      </Stack>
    </SafeAreaProvider>
  );
}
