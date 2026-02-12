import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: 'My account', headerShown: false }} />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
