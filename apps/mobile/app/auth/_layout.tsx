import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

// Splash is shown on index; auth goes straight to login/register
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background, flex: 1 },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
