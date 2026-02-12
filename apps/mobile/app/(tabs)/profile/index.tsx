import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getLoyaltyBalance, getWishlist, getOrders, getAvailableVouchers, getRecentlyViewed, getFollowedStores, getUserAddresses } from '@/api/client';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export default function Profile() {
  const router = useRouter();
  const { user, profile, signOut, fetchProfile } = useAuthStore();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [voucherCount, setVoucherCount] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [followedStores, setFollowedStores] = useState<any[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [orderCounts, setOrderCounts] = useState({
    pendingPayment: 0,
    inTransit: 0,
    pendingFeedback: 0,
    returnRefund: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  const loadData = useCallback(async (force = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    // Don't reload if data was loaded recently (within 30 seconds) unless forced
    const now = Date.now();
    if (!force && now - lastLoadTime < 30000) {
      return;
    }
    
    setLoading(true);
    try {
      const [points, wishlistData, ordersData, vouchersData, recentlyViewedData, followedStoresData, addressesData] = await Promise.all([
        getLoyaltyBalance(user.id).catch(() => 0),
        getWishlist(user.id).catch(() => []),
        getOrders(user.id, 50).catch(() => []), // Limit to 50 orders
        getAvailableVouchers(user.id).catch(() => []),
        getRecentlyViewed(user.id, 3).catch(() => []), // First 3 for thumbnails
        getFollowedStores(user.id).catch(() => []),
        getUserAddresses(user.id).catch(() => []),
      ]);
      setLoyaltyPoints(points);
      setWishlist(wishlistData.slice(0, 3)); // First 3 for thumbnails
      setOrders(ordersData);
      setVoucherCount(vouchersData.length);
      setRecentlyViewed(recentlyViewedData.slice(0, 3)); // First 3 for thumbnails
      setFollowedStores(followedStoresData.slice(0, 3)); // First 3 for thumbnails
      setAddressCount(addressesData.length);

      // Count orders by status
      const pendingPayment = ordersData.filter(
        (o: any) => o.status === 'pending' || o.status === 'confirmed'
      ).length;
      const inTransit = ordersData.filter(
        (o: any) => o.status === 'shipped' || o.status === 'processing'
      ).length;
      const pendingFeedback = ordersData.filter((o: any) => o.status === 'delivered').length;
      const returnRefund = ordersData.filter((o: any) => o.status === 'returned').length;

      setOrderCounts({
        pendingPayment,
        inTransit,
        pendingFeedback,
        returnRefund,
      });
      
      setLastLoadTime(now);
    } catch (e: any) {
      // Silently handle errors - don't log repeatedly if JWT expired
      if (e?.code !== 'PGRST303') {
        console.error('Failed to load profile data:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, lastLoadTime]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Only fetch if we have a valid session
        const checkSession = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Only fetch profile if we don't have it
              if (!profile) {
                fetchProfile(user.id).catch(() => {
                  // Silently handle auth errors
                });
              }
              // Load data (will skip if loaded recently)
              loadData(false);
            }
          } catch {
            // Silently handle session check errors
          }
        };
        checkSession();
      }
    }, [user?.id, profile, fetchProfile, loadData])
  );

  const handleSignOut = () => {
    signOut().then(() => router.replace('/auth/login'));
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.title}>My account</Text>
          <Text style={styles.subtitle}>Sign in to view your profile</Text>
          <Button title="Sign in" onPress={() => router.push('/auth/login')} style={styles.signInBtn} />
        </View>
      </Screen>
    );
  }

  const displayName = profile?.display_name || 'User';
  const avatarUrl = profile?.avatar_url;

  // Check if profile is verified (all critical fields filled)
  const isVerified = profile && 
    profile.display_name && profile.display_name.trim() !== '' &&
    profile.phone && profile.phone.trim() !== '' &&
    profile.email && profile.email.trim() !== '' &&
    profile.date_of_birth &&
    profile.gender &&
    profile.national_id && profile.national_id.trim() !== '' &&
    profile.region && profile.region.trim() !== '' &&
    profile.district && profile.district.trim() !== '' &&
    profile.street_address && profile.street_address.trim() !== '';

  return (
    <Screen edges={['top']} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={styles.gradientHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerRight}>
              <Text style={styles.headerLanguage}>English</Text>
              <Pressable onPress={() => router.push('/notifications')} style={styles.headerIconBtn}>
                <Ionicons name="chatbubble-outline" size={22} color={colors.surface} />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/profile/edit')} style={styles.headerIconBtn}>
                <Ionicons name="settings-outline" size={22} color={colors.surface} />
              </Pressable>
            </View>
          </View>

          {/* Profile Card */}
          <Card style={styles.profileCard}>
            <Pressable onPress={() => router.push('/(tabs)/profile/edit')} style={styles.profileCardContent}>
              <View style={styles.profileLeft}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color={colors.primary} />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                  </View>
                  {isVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.unverifiedBadge}>
                      <Text style={styles.unverifiedText}>Complete profile to verify</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Card>
        </View>

        {/* My Order Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Order</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.orderStatusRow}>
            <Pressable
              style={styles.orderStatusItem}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={styles.orderStatusIcon}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.orderStatusLabel}>Pending Payment</Text>
              {orderCounts.pendingPayment > 0 && (
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>{orderCounts.pendingPayment}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.orderStatusItem}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={styles.orderStatusIcon}>
                <Ionicons name="car-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.orderStatusLabel}>In Transit</Text>
              {orderCounts.inTransit > 0 && (
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>{orderCounts.inTransit}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.orderStatusItem}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={styles.orderStatusIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.orderStatusLabel}>Pending Feedback</Text>
              {orderCounts.pendingFeedback > 0 && (
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>{orderCounts.pendingFeedback}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.orderStatusItem}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={styles.orderStatusIcon}>
                <Ionicons name="return-up-back-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.orderStatusLabel}>Return & Refund</Text>
              {orderCounts.returnRefund > 0 && (
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>{orderCounts.returnRefund}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {/* Wish List */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/wishlist')}
          >
            <Ionicons name="heart" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Wish List</Text>
            <View style={styles.menuItemRight}>
              {wishlist.length > 0 ? (
                <View style={styles.thumbnailsRow}>
                  {wishlist.slice(0, 3).map((item, idx) => {
                    const img = item.products?.product_images?.[0]?.url;
                    return img ? (
                      <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />
                    ) : (
                      <View key={idx} style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                        <Ionicons name="image-outline" size={12} color={colors.textMuted} />
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Store Followed */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/store-followed')}
          >
            <Ionicons name="storefront-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Store Followed</Text>
            <View style={styles.menuItemRight}>
              {followedStores.length > 0 ? (
                <View style={styles.thumbnailsRow}>
                  {followedStores.slice(0, 3).map((item: any, idx: number) => {
                    const img = item.vendor?.thumbnail;
                    return img ? (
                      <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />
                    ) : (
                      <View key={idx} style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                        <Ionicons name="storefront-outline" size={12} color={colors.textMuted} />
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Recently Viewed */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/recently-viewed')}
          >
            <Ionicons name="time-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Recently Viewed</Text>
            <View style={styles.menuItemRight}>
              {recentlyViewed.length > 0 ? (
                <View style={styles.thumbnailsRow}>
                  {recentlyViewed.slice(0, 3).map((item: any, idx: number) => {
                    const img = item.product?.image;
                    return img ? (
                      <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />
                    ) : (
                      <View key={idx} style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                        <Ionicons name="image-outline" size={12} color={colors.textMuted} />
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* My Vouchers */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/vouchers')}
          >
            <Ionicons name="ticket-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>My Vouchers</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>Available: {voucherCount}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Address Management */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/addresses')}
          >
            <Ionicons name="home-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Address Management</Text>
            <View style={styles.menuItemRight}>
              {addressCount > 0 && (
                <Text style={styles.menuItemValue}>{addressCount}</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Service Center / Chatbot */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/chatbot')}
          >
            <Ionicons name="headset-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Service Center</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Invite Friend */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/invite-friend')}
          >
            <Ionicons name="person-add-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Invite Friend</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Friend's code */}
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/friend-code')}
          >
            <Ionicons name="mail-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.menuItemText}>Friend's code</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutBtn}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLanguage: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '500',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.borderLight,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  profileName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  unverifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unverifiedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  section: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  viewAllText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  orderStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderStatusItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  orderStatusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  orderStatusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  orderBadgeText: {
    ...typography.small,
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderLight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  signOutSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  signOutBtn: {
    borderColor: colors.error,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  signInBtn: {
    minWidth: 200,
  },
});
