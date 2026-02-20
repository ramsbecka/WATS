import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput, Dimensions, ActivityIndicator, Modal, Animated, AppState, RefreshControl, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { getCategories, getSubCategories, subscribeToCategories } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import type { Category, SubCategory } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductsTab() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [recommendedSubCategories, setRecommendedSubCategories] = useState<SubCategory[]>([]);
  const [hotSubCategories, setHotSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    loadNotifications();

    // Subscribe to real-time category changes
    const unsubscribe = subscribeToCategories((categories) => {
      setMainCategories(categories);
      // Refresh sub-categories if a category is selected
      if (selectedCategoryId) {
        loadSubCategories(selectedCategoryId);
      }
    });

    // Refresh data when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadData();
        if (selectedCategoryId) {
          loadSubCategories(selectedCategoryId);
        }
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (params.category) {
      const categoryId = params.category as string;
      // Check if it's a main category or sub-category
      const isMainCategory = mainCategories.some(c => c.id === categoryId);
      if (isMainCategory) {
        setSelectedCategoryId(categoryId);
      } else {
        // It's a sub-category, navigate to products list
        router.push(`/products/list?subCategory=${categoryId}`);
      }
    }
  }, [params.category, mainCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubCategories(selectedCategoryId);
    } else {
      loadRecommendedAndHot();
    }
  }, [selectedCategoryId, mainCategories.length]);

  const loadData = async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    try {
      const categories = await getCategories(false); // Disable cache to get fresh data
      setMainCategories(categories);
      
      // "All" is selected by default (selectedCategoryId remains null)
      // User can select a category from the menu if they want
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    if (selectedCategoryId) {
      await loadSubCategories(selectedCategoryId);
    } else {
      await loadRecommendedAndHot();
    }
  };

  const loadSubCategories = async (parentId: string) => {
    try {
      const subs = await getSubCategories(parentId);
      setSubCategories(subs);
    } catch (error) {
      console.error('Error loading sub-categories:', error);
      setSubCategories([]);
    }
  };

  const loadRecommendedAndHot = async () => {
    try {
      // Get all sub-categories and split into recommended and hot
      // For now, we'll get sub-categories from first few main categories
      const allSubs: SubCategory[] = [];
      for (const cat of mainCategories.slice(0, 3)) {
        const subs = await getSubCategories(cat.id);
        allSubs.push(...subs);
      }
      
      // Split into recommended and hot (first half recommended, second half hot)
      const mid = Math.floor(allSubs.length / 2);
      setRecommendedSubCategories(allSubs.slice(0, mid));
      setHotSubCategories(allSubs.slice(mid));
    } catch (error) {
      console.error('Error loading recommended/hot:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSubCategoryPress = (subCategoryId: string) => {
    // Navigate to products list page
    router.push(`/products/list?subCategory=${subCategoryId}${selectedCategoryId ? `&category=${selectedCategoryId}` : ''}`);
  };

  useEffect(() => {
    if (showCategoryMenu) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCategoryMenu]);


  const handleSearchPress = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const renderSearchHeader = () => {
    return (
      <View style={styles.searchHeader}>
        <Pressable style={styles.menuButton} onPress={() => setShowCategoryMenu(true)}>
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchPress}
            returnKeyType="search"
          />
        </View>
        <Pressable style={styles.notificationIcon} onPress={() => router.push('/notifications')}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  const renderCategoryChips = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Pressable
          style={[styles.chip, selectedCategoryId === null && styles.chipActive]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text style={[styles.chipText, selectedCategoryId === null && styles.chipTextActive]}>All</Text>
        </Pressable>
        {mainCategories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {cat.name_en ?? 'Category'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const renderCategoryMenu = () => {
    if (!showCategoryMenu) return null;

    return (
      <Modal
        visible={showCategoryMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowCategoryMenu(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setShowCategoryMenu(false)}
        >
          <Animated.View 
            style={[
              styles.menuOverlayAnimated,
              { opacity: overlayOpacity }
            ]}
          />
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Categories</Text>
              <Pressable onPress={() => setShowCategoryMenu(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              {/* All Categories Option */}
              <Pressable
                style={[
                  styles.menuItem,
                  selectedCategoryId === null && styles.menuItemActive
                ]}
                onPress={() => {
                  setSelectedCategoryId(null);
                  setShowCategoryMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    selectedCategoryId === null && styles.menuItemTextActive
                  ]}
                >
                  All
                </Text>
                {selectedCategoryId === null && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
              {mainCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.menuItem,
                    selectedCategoryId === category.id && styles.menuItemActive
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setShowCategoryMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      selectedCategoryId === category.id && styles.menuItemTextActive
                    ]}
                  >
                    {category.name_en ?? 'Category'}
                  </Text>
                  {selectedCategoryId === category.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  const renderCategoryCard = (category: Category) => {
    const displayName = category.name_en ?? 'Category';
    
    return (
      <Pressable
        key={category.id}
        style={styles.categoryCard}
        onPress={() => {
          setSelectedCategoryId(category.id);
          setShowCategoryMenu(false);
        }}
      >
        {category.image_url ? (
          <Image source={{ uri: category.image_url }} style={styles.categoryImage} />
        ) : (
          <View style={[styles.categoryImage, styles.categoryImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        <Text style={styles.categoryName} numberOfLines={2}>
          {displayName}
        </Text>
      </Pressable>
    );
  };

  const renderSubCategoryCard = (subCategory: SubCategory) => {
    const displayName = subCategory.name_en ?? 'Sub-category';
    
    return (
      <Pressable
        key={subCategory.id}
        style={styles.subCategoryCard}
        onPress={() => handleSubCategoryPress(subCategory.id)}
      >
        {subCategory.image_url ? (
          <Image source={{ uri: subCategory.image_url }} style={styles.subCategoryImage} />
        ) : (
          <View style={[styles.subCategoryImage, styles.subCategoryImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        <Text style={styles.subCategoryName} numberOfLines={2}>
          {displayName}
        </Text>
      </Pressable>
    );
  };

  const renderProductGrid = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }


    // Show categories or sub-categories
    return (
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* All Categories Section - Show main categories with images */}
        {selectedCategoryId === null && mainCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Categories</Text>
            </View>
            <View style={styles.categoryGrid}>
              {mainCategories.map((category) => renderCategoryCard(category))}
            </View>
          </View>
        )}

        {/* Recommended Section */}
        {selectedCategoryId === null && recommendedSubCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommend</Text>
            </View>
            <View style={styles.subCategoryGrid}>
              {recommendedSubCategories.map((subCat) => renderSubCategoryCard(subCat))}
            </View>
          </View>
        )}

        {/* Hot Section */}
        {selectedCategoryId === null && hotSubCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hot</Text>
            </View>
            <View style={styles.subCategoryGrid}>
              {hotSubCategories.map((subCat) => renderSubCategoryCard(subCat))}
            </View>
          </View>
        )}

        {/* Sub-categories for selected main category */}
        {selectedCategoryId && subCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {mainCategories.find(c => c.id === selectedCategoryId)?.name_en ?? 'Products'}
              </Text>
            </View>
            <View style={styles.subCategoryGrid}>
              {subCategories.map((subCat) => renderSubCategoryCard(subCat))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {selectedCategoryId && subCategories.length === 0 && !loading && (
          <View style={styles.centered}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No sub-categories found</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Screen edges={['top']}>
      {renderSearchHeader()}
      {mainCategories.length > 0 && renderCategoryChips()}
      <View style={styles.container}>
        {renderProductGrid()}
      </View>
      {renderCategoryMenu()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  menuButton: {
    padding: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  chipsScroll: {
    backgroundColor: colors.background,
    maxHeight: 40,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    height: 28,
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  chipTextActive: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
  productsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuOverlayAnimated: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.surface,
    ...(Platform.OS === 'web'
      ? { boxShadow: '2px 0px 4px rgba(0, 0, 0, 0.25)' }
      : { shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 4 }),
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuContent: {
    maxHeight: SCREEN_WIDTH * 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemActive: {
    backgroundColor: colors.primary + '10',
  },
  menuItemText: {
    ...typography.body,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-start',
  },
  categoryCard: {
    width: (SCREEN_WIDTH - spacing.sm * 2 - spacing.xs * 3) / 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: colors.borderLight,
  },
  categoryImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    ...typography.body,
    fontSize: 11,
    color: colors.textPrimary,
    padding: spacing.xs,
    textAlign: 'center',
  },
  subCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-start',
  },
  subCategoryCard: {
    width: (SCREEN_WIDTH - spacing.sm * 2 - spacing.xs * 3) / 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  subCategoryImage: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: colors.borderLight,
  },
  subCategoryImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCategoryName: {
    ...typography.body,
    fontSize: 11,
    color: colors.textPrimary,
    padding: spacing.xs,
    textAlign: 'center',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.borderLight,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    ...typography.body,
    fontSize: 12,
    color: colors.textPrimary,
    padding: spacing.xs,
    textAlign: 'center',
  },
  productOriginalPrice: {
    ...typography.body,
    fontSize: 10,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
  },
  productPrice: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    textAlign: 'center',
  },
});
