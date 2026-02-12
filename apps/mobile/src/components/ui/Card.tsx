import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme/tokens';

export function Card({
  children,
  style,
  elevated = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.card, elevated && shadows.md, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
