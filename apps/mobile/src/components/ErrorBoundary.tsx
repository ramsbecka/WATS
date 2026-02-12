import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
  title: {
    ...typography.title,
    color: colors.error,
    marginBottom: spacing.md,
  },
  scroll: { maxHeight: 200 },
  message: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
