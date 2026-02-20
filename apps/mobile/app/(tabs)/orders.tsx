import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export default function Orders() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) return;
    setError(null);
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, order_number, status, total_tzs, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (err) setError(err.message ?? 'Failed to load orders.');
    else setOrders(data ?? []);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
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
          <Text style={styles.title}>My orders</Text>
          <Text style={styles.subtitle}>Your order history</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); void loadOrders().then(() => setLoading(false)); }} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Ionicons name="receipt" size={24} color={colors.primary} />
        <View>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>Your order history</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = item.status === 'delivered' ? colors.success : 
                             item.status === 'cancelled' ? colors.error :
                             item.status === 'processing' || item.status === 'shipped' ? colors.primary : colors.textMuted;
          return (
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/orders/${item.id}`)}
            >
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.orderInfo}>
                    <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                    <Text style={styles.orderNum}>{item.order_number}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel[item.status] ?? item.status}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.amountRow}>
                    <Ionicons name="cash-outline" size={18} color={colors.primary} />
                    <Text style={styles.amount}>TZS {Number(item.total_tzs).toLocaleString()}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('sw-TZ')}</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  orderNum: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  cardDetails: {
    gap: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amount: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  retryText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
