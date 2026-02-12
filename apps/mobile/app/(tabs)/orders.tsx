import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography } from '@/theme/tokens';

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
      <Text style={styles.title}>My orders</Text>
      <Text style={styles.subtitle}>Your order history</Text>
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
            <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            onPress={() => router.push(`/orders/${item.id}`)}
          >
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.orderNum}>{item.order_number}</Text>
                <View style={[styles.badge, item.status === 'delivered' && styles.badgeSuccess]}>
                  <Text style={styles.badgeText}>{statusLabel[item.status] ?? item.status}</Text>
                </View>
              </View>
              <Text style={styles.amount}>TZS {Number(item.total_tzs).toLocaleString()}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('sw-TZ')}</Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: { padding: spacing.lg, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNum: { ...typography.subheading, color: colors.textPrimary },
  badge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: `${colors.success}20` },
  badgeText: { ...typography.small, color: colors.textSecondary },
  amount: { ...typography.body, color: colors.primary, fontWeight: '600' },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 48 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
  retryText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
});
