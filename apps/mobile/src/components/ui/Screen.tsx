import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

const DEFAULT_EDGES: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

export function Screen({
  children,
  style,
  edges = DEFAULT_EDGES,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
});
