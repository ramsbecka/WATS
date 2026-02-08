import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function Home() {
  const router = useRouter();

  return (
    <Screen edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>WATS</Text>
          <Text style={styles.heroSubtitle}>Shop with ease. Great products, pay with mobile money.</Text>
        </View>
        <View style={styles.ctaRow}>
          <Button
            title="Browse products"
            onPress={() => router.push('/(tabs)/products')}
            style={styles.ctaPrimary}
          />
          <Pressable
            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart-outline" size={22} color={colors.primary} />
            <Text style={styles.ctaSecondaryText}>Cart</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.quickLinks}>
        <Card style={styles.quickCard}>
          <Pressable
            style={({ pressed }) => [styles.quickPress, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/products')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="grid-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>All products</Text>
          </Pressable>
        </Card>
        <Card style={styles.quickCard}>
          <Pressable
            style={({ pressed }) => [styles.quickPress, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="receipt-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>My orders</Text>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroContent: { marginBottom: spacing.xl },
  heroTitle: {
    ...typography.hero,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  ctaRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ctaPrimary: { flex: 1 },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ctaPressed: { opacity: 0.8 },
  ctaSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.lg,
  },
  quickCard: { flex: 1 },
  quickPress: { padding: spacing.lg, alignItems: 'center' },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: { ...typography.subheading, color: colors.textPrimary },
});
