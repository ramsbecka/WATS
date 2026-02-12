import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import Chatbot from '@/components/ai/Chatbot';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/tokens';

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <Screen edges={['top']} style={styles.screen}>
      <Chatbot userId={user?.id} onClose={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
