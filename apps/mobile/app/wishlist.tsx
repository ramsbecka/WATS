import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getWishlist, removeFromWishlist } from '@/api/client';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

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
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on a product to add it</Text>
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
        <View style={styles.headerContent}>
          <Ionicons name="heart" size={24} color={colors.primary} />
          <Text style={styles.title}>Wishlist</Text>
        </View>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.count}>{items.length}</Text>
          </View>
        )}
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
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={2}>{p?.name_en ?? ''}</Text>
                  <Text style={styles.price}>TZS {p ? Number(p.price_tzs).toLocaleString() : ''}</Text>
                </View>
                <Pressable onPress={() => handleRemove(item.product_id)} style={styles.removeBtn}>
                  <Ionicons name="heart" size={26} color={colors.error} />
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
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
  },
  removeBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  emptyBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  emptyBtnText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
