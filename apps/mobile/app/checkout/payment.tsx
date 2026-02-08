import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PaymentStatus() {
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId?: string; orderNumber?: string }>();
  const router = useRouter();
  const hasOrder = Boolean(orderId && orderNumber);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Check your phone for payment</Text>
        {hasOrder && <Text style={styles.order}>Order #{orderNumber}</Text>}
        <Text style={styles.hint}>
          Check your phone for the M-Pesa prompt. When you're done, your order will be confirmed automatically.
        </Text>
        {hasOrder && (
          <Button title="View order" onPress={() => router.replace(`/orders/${orderId}`)} style={styles.btn} />
        )}
        <Button title="Back to home" onPress={() => router.replace('/(tabs)')} variant="outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  order: { ...typography.subheading, color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 24,
  },
  btn: { marginBottom: 12 },
});
