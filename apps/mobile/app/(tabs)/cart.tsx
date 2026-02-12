import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { getOrCreateCart, getCartItems, removeCartItem } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function Cart() {
  const { user } = useAuthStore();
  const { items, total, count, removeItem, setItems } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = () => {
    if (!user) { setLoading(false); return; }
    setError(null);
    setLoading(true);
    getOrCreateCart(user.id)
      .then((cartId) =>
        getCartItems(cartId).then((rows) => {
          setItems(
            rows.map((r: any) => ({
              id: r.id,
              product_id: r.product_id,
              variant_id: r.variant_id,
              quantity: r.quantity,
              product: {
                ...r.products,
                price_tzs: r.product_variants?.price_tzs ?? r.products?.price_tzs ?? 0,
              },
            })
          ));
        })
      )
      .catch((e: any) => setError(e?.message ?? 'Failed to load cart.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const handleRemove = async (item: any) => {
    if (!user) return;
    removeItem(item.product_id, item.variant_id);
    try {
      const cartId = await getOrCreateCart(user.id);
      await removeCartItem(cartId, item.product_id, item.variant_id);
    } catch (_) {}
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
          <Text style={styles.title}>Cart</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button title="Retry" onPress={loadCart} style={styles.emptyBtn} />
        </View>
      </Screen>
    );
  }
  if (items.length === 0) {
    return (
      <Screen edges={['top']}>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={56} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from the store</Text>
          <Button title="Browse products" onPress={() => router.push('/(tabs)/products')} variant="outline" style={styles.emptyBtn} />
        </View>
      </Screen>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Cart</Text>
      <Text style={styles.count}>{count()} items</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>TZS {total().toLocaleString()}</Text>
      </Card>
      <Button title="Pay now (M-Pesa)" onPress={() => router.push('/checkout')} style={styles.checkoutBtn} />
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product?.name_sw ?? item.product_id}</Text>
              <Text style={styles.itemMeta}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>TZS {((item.product?.price_tzs ?? 0) * item.quantity).toLocaleString()}</Text>
            </View>
            <Pressable
              onPress={() => handleRemove(item)}
              style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.textPrimary },
  count: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  list: { padding: spacing.lg, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: 12 },
  rowContent: { flex: 1 },
  itemName: { ...typography.body, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { ...typography.subheading, color: colors.primary, marginTop: 4 },
  removeBtn: { padding: 8 },
  footer: { padding: spacing.lg, paddingBottom: 100, gap: 12 },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  totalLabel: { ...typography.subheading, color: colors.textSecondary },
  totalValue: { ...typography.title, color: colors.primary },
  checkoutBtn: {},
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyIcon: { marginBottom: spacing.lg },
  emptyTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xl },
  emptyBtn: {},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
