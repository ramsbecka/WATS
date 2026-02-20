import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, FlatList, Dimensions, useWindowDimensions, Platform, AppState, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { getCategories, getProducts, getBanners, subscribeToCategories, subscribeToProducts } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import { useAuthStore } from '@/store/auth';
import { useWebLayout } from '@/hooks/useIsWeb';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import type { Category, Product } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { width: winWidth } = useWindowDimensions();
  const { isWeb, contentWidth, numColumns } = useWebLayout();
  const SCREEN_WIDTH = Platform.OS === 'web' ? winWidth : Dimensions.get('window').width;
  const contentMaxWidth = isWeb ? Math.min(contentWidth, 1000) : SCREEN_WIDTH;
  const cardSize = (contentMaxWidth - spacing.lg * 2 - spacing.md * (numColumns - 1)) / numColumns;
  const bannerWidth = contentMaxWidth - spacing.lg * 2;
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const bannerFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();

    // Subscribe to real-time changes
    const unsubscribeCategories = subscribeToCategories((categories) => {
      setCategories(categories);
    });

    const unsubscribeProducts = subscribeToProducts(() => {
      loadData(); // Reload all data when products change
    });

    // Refresh data when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadData();
      }
    });

    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    // Auto-rotate banners
    if (banners.length > 1 && bannerFlatListRef.current) {
      const interval = setInterval(() => {
        const nextIndex = (currentBannerIndex + 1) % banners.length;
        setCurrentBannerIndex(nextIndex);
        bannerFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, 5000); // Change banner every 5 seconds
      return () => clearInterval(interval);
    }
  }, [banners.length, currentBannerIndex]);

  const loadData = async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    try {
      const [cats, products, bannerData] = await Promise.all([
        getCategories(false), // Disable cache to get fresh data
        getProducts({ limit: 20 }),
        getBanners(),
      ]);
      setCategories(cats);
      // Filter products with compare_at_price (on sale) for flash sale
      const onSaleProducts = products.data.filter((p: any) => p.compare_at_price_tzs && Number(p.compare_at_price_tzs) > Number(p.price_tzs));
      setFlashSaleProducts(onSaleProducts.slice(0, 10));
      setFeaturedProducts(products.data.slice(0, 20));
      setBanners(bannerData || []);
    } catch (error) {
      console.error('Failed to load home data:', error);
      // Set empty arrays on error to prevent crashes
      setBanners([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };


  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <Pressable
          style={styles.searchInput}
          onPress={() => router.push('/(tabs)/products')}
        >
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.chatIcon}
        onPress={() => user ? router.push('/chatbot') : router.push('/auth/login')}
      >
        <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );

  const renderFlashSale = () => {
    if (flashSaleProducts.length === 0) return null;
    
    return (
      <View style={styles.flashSaleSection}>
        <View style={styles.flashSaleHeader}>
          <Text style={styles.flashSaleTitle}>Flash Sale</Text>
        </View>
      <FlatList
        horizontal
        data={flashSaleProducts}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flashSaleList}
        renderItem={({ item }) => {
          const imageUrl = item.product_images?.[0]?.url;
          const price = Number(item.price_tzs);
          const comparePrice = item.compare_at_price_tzs ? Number(item.compare_at_price_tzs) : null;
          const discount = comparePrice && comparePrice > price
            ? Math.round(((comparePrice - price) / comparePrice) * 100)
            : null;
          
          return (
            <Pressable
              style={styles.flashSaleCard}
              onPress={() => router.push(`/products/${item.id}`)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.flashSaleImage} />
              ) : (
                <View style={[styles.flashSaleImage, styles.placeholderImage]} />
              )}
              {discount && discount > 0 && (
                <View style={styles.flashSaleDiscount}>
                  <Text style={styles.flashSaleDiscountText}>-{discount}%</Text>
                </View>
              )}
              <Text style={styles.flashSalePrice}>
                {price.toLocaleString()} TSh
              </Text>
            </Pressable>
          );
        }}
      />
      </View>
    );
  };

  const renderCategoryIcons = () => {
    const quickCategories = [
      { id: 'wishlist', name: 'Wish List', icon: 'heart-outline', color: '#FF4444' },
      { id: 'wholesale', name: 'Wholesale', icon: 'layers-outline', color: '#4A90E2' },
      { id: 'bargain', name: 'Bargain Zone', icon: 'pricetag-outline', color: '#FF6B9D' },
      { id: 'new', name: 'New Arrival', icon: 'sparkles-outline', color: '#FF9500' },
    ];

    const categoryItems = categories.slice(0, 4).map((cat, idx) => ({
      id: cat.id,
      name: cat.name_en || 'Category',
      image: cat.image_url,
      isImage: true,
    }));

    return (
      <View style={styles.categoryIconsSection}>
        <FlatList
          horizontal
          data={[...quickCategories, ...categoryItems]}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryIconsList}
          renderItem={({ item }: any) => (
            <Pressable
              style={styles.categoryIconCard}
              onPress={() => {
                if (item.id === 'wishlist') {
                  router.push('/wishlist');
                } else if (item.id === 'wholesale' || item.id === 'bargain' || item.id === 'new') {
                  router.push('/(tabs)/products');
                } else {
                  router.push(`/(tabs)/products?category=${item.id}`);
                }
              }}
            >
              {item.isImage && item.image ? (
                <Image source={{ uri: item.image }} style={styles.categoryIconImage} />
              ) : (
                <View style={[styles.categoryIconCircle, { backgroundColor: item.color || colors.primary }]}>
                  <Ionicons name={item.icon} size={24} color={colors.onPrimary} />
                </View>
              )}
              <Text style={styles.categoryIconLabel} numberOfLines={1}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const handleBannerPress = (banner: any) => {
    if (!banner.button_link) return;
    if (banner.link_type === 'category') {
      router.push(`/(tabs)/products?category=${banner.button_link}`);
    } else if (banner.link_type === 'product') {
      router.push(`/products/${banner.button_link}`);
    } else if (banner.link_type === 'url') {
      // Handle external URL if needed
      // External URL handling - can be implemented later
    }
  };

  const renderBannerItem = ({ item: banner }: { item: any }) => {
    return (
      <Pressable 
        onPress={() => handleBannerPress(banner)} 
        style={[styles.bannerPressable, { width: bannerWidth }]}
      >
        <View style={styles.bannerItemContainer}>
          {banner.image_url ? (
            <Image 
              source={{ uri: banner.image_url }} 
              style={styles.bannerImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('Banner image failed to load:', banner.image_url, e.nativeEvent.error);
              }}
            />
          ) : (
            <View style={styles.bannerImagePlaceholder} />
          )}
          {banner.title_en && (
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>
                {banner.title_en}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const onBannerScroll = (event: any) => {
    const itemWidth = bannerWidth + spacing.md;
    const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    if (index !== currentBannerIndex && index >= 0 && index < banners.length) {
      setCurrentBannerIndex(index);
    }
  };

  const renderBanner = () => {
    if (banners.length === 0) return null;

    return (
      <View style={styles.bannerContainer}>
        <FlatList
          ref={bannerFlatListRef}
          data={banners}
          renderItem={renderBannerItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          snapToInterval={bannerWidth + spacing.md}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onBannerScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.bannerListContent}
          getItemLayout={(data, index) => ({
            length: bannerWidth + spacing.md,
            offset: (bannerWidth + spacing.md) * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            // Fallback if scroll fails
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              bannerFlatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
        />
        {banners.length > 1 && (
          <View style={styles.bannerPagination}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerDot,
                  index === currentBannerIndex && styles.bannerDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWATSPicks = () => {
    if (loading && categories.length === 0) {
      return (
        <View style={styles.watsPicksSection}>
          <Text style={styles.sectionTitle}>WATS Picks</Text>
          <View style={styles.categoryGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.categoryCard, { width: cardSize }]}>
                <View style={[styles.categoryCardImage, styles.placeholderImage]} />
                <View style={styles.categoryCardNamePlaceholder} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (categories.length === 0) return null;

    return (
      <View style={styles.watsPicksSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>WATS Picks</Text>
          <Pressable onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.sectionLink}>See All</Text>
          </Pressable>
        </View>
        <View style={styles.categoryGrid}>
          {categories.slice(0, numColumns * 2).map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryCard, { width: cardSize }]}
              onPress={() => router.push(`/(tabs)/products?category=${cat.id}`)}
            >
              {cat.image_url ? (
                <Image 
                  source={{ uri: cat.image_url }} 
                  style={styles.categoryCardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.categoryCardImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <Text style={styles.categoryCardName} numberOfLines={2}>
                {cat.name_en || 'Category'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderProductGrid = () => {
    if (featuredProducts.length === 0) return null;
    
    return (
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <View style={styles.productGrid}>
          {featuredProducts.map((product) => {
            const imageUrl = product.product_images?.[0]?.url;
            const price = Number(product.price_tzs);
            const comparePrice = product.compare_at_price_tzs ? Number(product.compare_at_price_tzs) : null;
            const discount = comparePrice && comparePrice > price
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : null;
            
            return (
              <Pressable
                key={product.id}
                style={[styles.productCard, { width: cardSize }]}
                onPress={() => router.push(`/products/${product.id}`)}
              >
                <View style={styles.productImageContainer}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={[styles.productImage, styles.placeholderImage]} />
                  )}
                  {discount && discount > 0 && (
                    <View style={styles.productDiscountBadge}>
                      <Text style={styles.productDiscountText}>-{discount}%</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name_en || 'Product'}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>{price.toLocaleString()} TSh</Text>
                  {comparePrice && comparePrice > price && (
                    <Text style={styles.productOriginalPrice}>{comparePrice.toLocaleString()} TSh</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };


  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  const webContentStyle = isWeb ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' } : null;

  return (
    <Screen edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={webContentStyle}>
          {renderSearchBar()}
          {renderBanner()}
          {renderCategoryIcons()}
          {renderFlashSale()}
          {renderWATSPicks()}
          {user && <ProductRecommendations limit={8} title="AI Recommended for You" />}
          {renderProductGrid()}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      width: '100%',
      height: '100%',
    } : {}),
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentWeb: {
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      minHeight: '100%',
      width: '100%',
    } : {}),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    justifyContent: 'center',
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  chatIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  // Banner
  bannerContainer: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  bannerListContent: {
    paddingLeft: spacing.lg,
    paddingRight: 0,
  },
  bannerPressable: {
    marginRight: spacing.md,
  },
  bannerItemContainer: {
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.borderLight,
  },
  bannerImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.borderLight,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.md,
  },
  bannerTitle: {
    ...typography.hero,
    fontSize: 20,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  bannerPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  bannerDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  // Category Icons
  categoryIconsSection: {
    marginBottom: spacing.lg,
  },
  categoryIconsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryIconCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryIconImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.xs,
  },
  categoryIconLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 11,
  },
  // Flash Sale
  flashSaleSection: {
    marginBottom: spacing.xl,
  },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  flashSaleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flashSaleTitle: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  discountBadge: {
    backgroundColor: '#FF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  discountBadgeText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
  flashSaleList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  flashSaleCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  flashSaleImage: {
    width: '100%',
    height: 140,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.xs,
  },
  flashSaleDiscount: {
    position: 'absolute',
    top: spacing.sm + 4,
    left: spacing.sm + 4,
    backgroundColor: '#FF4444',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  flashSaleDiscountText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  flashSalePrice: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  // WATS Picks
  watsPicksSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.body,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  hotBadgeText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4A90E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  newBadgeText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  categoryCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.borderLight,
  },
  categoryCardName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    padding: spacing.sm,
    textAlign: 'center',
    fontSize: 13,
  },
  categoryCardNamePlaceholder: {
    height: 16,
    backgroundColor: colors.borderLight,
    margin: spacing.sm,
    borderRadius: 4,
  },
  // Products Section
  productsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  productImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
  },
  productDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  productDiscountText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  productPrice: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  productOriginalPrice: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  placeholderImage: {
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
