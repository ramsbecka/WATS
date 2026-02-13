import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { getProducts, getSubCategories } from '@/api/client';
import { useCartStore } from '@/store/cart';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductsList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartCount = useCartStore((s) => s.count());
  const categoryId = params.category as string | undefined;
  const subCategoryId = params.subCategory as string | undefined;
  const searchQuery = params.search as string | undefined;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [subCategoryName, setSubCategoryName] = useState<string>('');

  useEffect(() => {
    loadProducts();
    if (subCategoryId) {
      loadSubCategoryName();
    }
  }, [categoryId, subCategoryId, searchQuery]);

  const loadSubCategoryName = async () => {
    if (!subCategoryId) return;
    // If no categoryId, fetch sub-category directly from categories table
    if (!categoryId) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name_en')
          .eq('id', subCategoryId)
          .single();
        if (!error && data) {
          setSubCategoryName(data.name_en ?? '');
        }
      } catch (error) {
        console.error('Error loading sub-category name:', error);
      }
      return;
    }
    try {
      const subs = await getSubCategories(categoryId);
      const sub = subs.find(s => s.id === subCategoryId);
      if (sub) {
        setSubCategoryName(sub.name_en ?? '');
      }
    } catch (error) {
      console.error('Error loading sub-category name:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filterCategoryId = subCategoryId || categoryId;
      const result = await getProducts({ 
        categoryId: filterCategoryId, 
        search: searchQuery,
        limit: 100 
      });
      setProducts(result.data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const img = product.product_images?.[0]?.url;
    const price = Number(product.price_tzs);
    const comparePrice = product.compare_at_price_tzs ? Number(product.compare_at_price_tzs) : null;
    const discountPercent = comparePrice && comparePrice > price 
      ? Math.round(((comparePrice - price) / comparePrice) * 100) 
      : null;
    const rating = product.average_rating || 0;
    const totalReviews = product.total_reviews || 0;
    const orderCount = product.order_count || 0;
    
    return (
      <Pressable
        key={product.id}
        style={styles.productListItem}
        onPress={() => router.push(`/products/${product.id}`)}
      >
        <View style={styles.productListImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.productListImage} />
          ) : (
            <View style={[styles.productListImage, styles.productImagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            </View>
          )}
          {discountPercent && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.productListDetails}>
          <Text style={styles.productListName} numberOfLines={2}>
            {product.name_en ?? 'Product'}
          </Text>
          {comparePrice && comparePrice > price && (
            <Text style={styles.productListOriginalPrice}>
              {comparePrice.toLocaleString()} TSh
            </Text>
          )}
          <View style={styles.productListPriceRow}>
            <Text style={styles.productListPrice}>
              {price.toLocaleString()} TSh
            </Text>
            <Text style={styles.productListShipping}> By Sea</Text>
          </View>
          {rating > 0 && (
            <View style={styles.productListRatingRow}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                    size={12}
                    color={star <= Math.round(rating) ? '#FFD700' : colors.borderLight}
                  />
                ))}
              </View>
              <Text style={styles.productListRatingText}>{rating.toFixed(1)}</Text>
              {orderCount > 0 && (
                <Text style={styles.productListOrders}>{orderCount} orders</Text>
              )}
            </View>
          )}
        </View>
        <Pressable
          style={styles.productListMoreButton}
          onPress={(e) => {
            e.stopPropagation();
            // Handle more options
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerSearchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.headerSearchText}>
            {searchQuery || subCategoryName || 'Products'}
          </Text>
        </View>
        <Pressable style={styles.cartButton} onPress={() => router.push('/(tabs)/cart')}>
          <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Sort and Filter Bar */}
      <View style={styles.sortFilterBar}>
        <Pressable style={styles.sortButton}>
          <Text style={styles.sortButtonText}>Best Match</Text>
          <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.viewToggleButton}>
          <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </Pressable>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : products.length > 0 ? (
        <ScrollView
          style={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsListContent}
        >
          {products.map((product) => renderProductCard(product))}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  headerSearchText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  cartButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sortFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  viewToggleButton: {
    padding: spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  productsContainer: {
    flex: 1,
  },
  productsListContent: {
    paddingVertical: spacing.sm,
  },
  productListItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productListImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  productListImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.borderLight,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  productListDetails: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  productListName: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
  },
  productListOriginalPrice: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  productListPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  productListPrice: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productListShipping: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  productListRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  productListRatingText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  productListOrders: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  productListMoreButton: {
    padding: spacing.xs,
    alignSelf: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
