import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductRecommendations, AIRecommendation } from '@/services/ai';
import { getProduct } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography, radius } from '@/theme/tokens';

interface ProductRecommendationsProps {
  categoryId?: string;
  limit?: number;
  title?: string;
}

export default function ProductRecommendations({
  categoryId,
  limit = 10,
  title = 'Recommended for You',
}: ProductRecommendationsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user?.id, categoryId]);

  const loadRecommendations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const recs = await getProductRecommendations(user.id, {
        limit,
        categoryId,
      });

      setRecommendations(recs);

      // Load product details
      const productPromises = recs.map((rec) => getProduct(rec.productId).catch(() => null));
      const productResults = await Promise.all(productPromises);
      setProducts(productResults.filter(Boolean));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name="sparkles" size={20} color={colors.primary} />
      </View>

      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const rec = recommendations.find((r) => r.productId === item.id);
          const image = item.product_images?.[0]?.url;

          return (
            <Pressable
              style={styles.productCard}
              onPress={() => router.push(`/products/${item.id}`)}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name_en}
                </Text>
                <Text style={styles.productPrice}>
                  TZS {Number(item.price_tzs).toLocaleString()}
                </Text>
                {rec?.reason && (
                  <Text style={styles.reasonText}>{rec.reason}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  productCard: {
    width: 160,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.borderLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    minHeight: 36,
  },
  productPrice: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reasonText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
});
