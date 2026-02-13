import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getWishlist, removeFromWishlist } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

export default function Wishlist() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user) { setLoading(false); return; }
    setError(null);
    getWishlist(user.id)
      .then(setItems)
      .catch((e: any) => setError(e?.message ?? 'Failed to load wishlist.'))
      .finally(() => setLoading(false));
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const handleRemove = async (productId: string) => {
    if (!user) return;
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    try {
      await removeFromWishlist(user.id, productId);
    } catch (_) {}
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to see your wishlist</Text>
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
          <Text style={styles.title}>Wishlist</Text>
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
          <Text style={styles.title}>Wishlist</Text>
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

  if (items.length === 0) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={56} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No items in your wishlist</Text>
          <Text style={styles.emptySubtitle}>Tap the heart on a product to add it</Text>
          <Pressable style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]} onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.emptyBtnText}>Browse products</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Wishlist</Text>
        <Text style={styles.count}>{items.length} items</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const p = item.products;
          const img = p?.product_images?.[0]?.url;
          return (
            <Pressable style={({ pressed }) => [pressed && { opacity: 0.9 }]} onPress={() => router.push(`/products/${p?.id ?? item.product_id}`)}>
              <Card style={styles.row}>
                {img ? <Image source={{ uri: img }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbPlaceholder]} />}
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={2}>{p?.name_en ?? ''}</Text>
                  <Text style={styles.price}>TZS {p ? Number(p.price_tzs).toLocaleString() : ''}</Text>
                </View>
                <Pressable onPress={() => handleRemove(item.product_id)} style={styles.removeBtn}>
                  <Ionicons name="heart" size={24} color={colors.error} />
                </Pressable>
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
  count: { ...typography.bodySmall, color: colors.textSecondary },
  list: { padding: spacing.lg, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: 12 },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.borderLight },
  thumbPlaceholder: {},
  rowBody: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.body, color: colors.textPrimary },
  price: { ...typography.subheading, color: colors.primary, marginTop: 4 },
  removeBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyIcon: { marginBottom: spacing.lg },
  emptyTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xl },
  emptyBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
  emptyBtnText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
