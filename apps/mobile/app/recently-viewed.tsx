import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { getRecentlyViewed, clearRecentlyViewed } from '@/api/client';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export default function RecentlyViewed() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) { setLoading(false); return; }
    getRecentlyViewed(user.id)
      .then(setItems)
      .catch((e: any) => console.error('Failed to load recently viewed:', e))
      .finally(() => setLoading(false));
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const handleClear = async () => {
    if (!user) return;
    try {
      await clearRecentlyViewed(user.id);
      setItems([]);
    } catch (e: any) {
      console.error('Failed to clear recently viewed:', e);
    }
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Recently Viewed</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to see your recently viewed products</Text>
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
          <Text style={styles.title}>Recently Viewed</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Ionicons name="time" size={24} color={colors.primary} />
          <Text style={styles.title}>Recently Viewed</Text>
        </View>
        {items.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No recently viewed products</Text>
          <Text style={styles.emptySubtitle}>Browse products to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const product = item.product;
            if (!product) return null;
            return (
              <Pressable
                style={styles.productCard}
                onPress={() => router.push(`/products/${product.id}`)}
              >
                <Card style={styles.card}>
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name_en}
                    </Text>
                    <Text style={styles.productPrice}>
                      TZS {Number(product.price_tzs).toLocaleString()}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
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
  clearBtn: {
    padding: spacing.xs,
  },
  centered: {
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
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    ...shadows.md,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.borderLight,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    minHeight: 40,
    fontWeight: '500',
  },
  productPrice: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
  },
});
