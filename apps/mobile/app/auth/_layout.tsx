import { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function AuthLayout() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <SplashScreen 
          onFinish={() => setShowSplash(false)} 
          autoSkip={true}
          skipDuration={4000}
        />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } : {}),
  },
});
