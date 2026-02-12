import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getVouchers } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function Vouchers() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user) { setLoading(false); return; }
    setError(null);
    getVouchers(user.id)
      .then(setVouchers)
      .catch((e: any) => setError(e?.message ?? 'Failed to load vouchers.'))
      .finally(() => setLoading(false));
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const copyCode = (code: string) => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Voucher Code', code, [{ text: 'OK' }]);
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isUsed = (voucher: any) => {
    return voucher.is_used || voucher.usage_count >= voucher.max_usage;
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>My Vouchers</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to see your vouchers</Text>
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>My Vouchers</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>My Vouchers</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable onPress={load} style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.emptyBtnText}>Retry</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const availableVouchers = vouchers.filter((v) => !isUsed(v) && !isExpired(v.valid_until));
  const usedVouchers = vouchers.filter((v) => isUsed(v) || isExpired(v.valid_until));

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Vouchers</Text>
      </View>
      <FlatList
        data={[...availableVouchers, ...usedVouchers]}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No vouchers yet</Text>
            <Text style={styles.emptySubtitle}>Complete orders to receive vouchers</Text>
          </View>
        }
        renderItem={({ item: voucher }) => {
          const expired = isExpired(voucher.valid_until);
          const used = isUsed(voucher);
          const status = used ? 'Used' : expired ? 'Expired' : 'Available';
          const statusColor = used || expired ? colors.textMuted : colors.success;

          return (
            <Card style={[styles.voucherCard, (used || expired) && styles.voucherCardDisabled]}>
              <View style={styles.voucherHeader}>
                <View style={styles.voucherInfo}>
                  <Text style={styles.voucherCode}>{voucher.code}</Text>
                  <Text style={styles.voucherDiscount}>
                    {voucher.discount_percentage}% OFF
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                </View>
              </View>
              {voucher.products && (
                <Text style={styles.productName} numberOfLines={1}>
                  For: {voucher.products.name_sw || voucher.products.name_en || 'Any Product'}
                </Text>
              )}
              {voucher.min_order_amount_tzs > 0 && (
                <Text style={styles.minOrder}>
                  Min order: TZS {Number(voucher.min_order_amount_tzs).toLocaleString()}
                </Text>
              )}
              <Text style={styles.validUntil}>
                Valid until: {new Date(voucher.valid_until).toLocaleDateString('sw-TZ')}
              </Text>
              {!used && !expired && (
                <Pressable
                  onPress={() => copyCode(voucher.code)}
                  style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  <Text style={styles.copyText}>Copy Code</Text>
                </Pressable>
              )}
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: { ...typography.title, color: colors.textPrimary, flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  voucherCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  voucherCardDisabled: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  voucherDiscount: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  productName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  minOrder: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  validUntil: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  copyText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  emptyBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
  emptyBtnText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
});
