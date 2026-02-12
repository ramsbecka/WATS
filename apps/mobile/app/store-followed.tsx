import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getFollowedStores, unfollowStore } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function StoreFollowed() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) { setLoading(false); return; }
    getFollowedStores(user.id)
      .then(setStores)
      .catch((e: any) => console.error('Failed to load followed stores:', e))
      .finally(() => setLoading(false));
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const handleUnfollow = async (vendorId: string) => {
    if (!user) return;
    try {
      await unfollowStore(user.id, vendorId);
      setStores((prev) => prev.filter((s) => s.vendors?.id !== vendorId));
    } catch (e: any) {
      console.error('Failed to unfollow store:', e);
    }
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Store Followed</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to see your followed stores</Text>
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
          <Text style={styles.title}>Store Followed</Text>
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
        <Text style={styles.title}>Store Followed</Text>
      </View>

      {stores.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No stores followed</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const vendor = item.vendor;
            if (!vendor) return null;
            return (
              <Card style={styles.storeCard}>
                <Pressable
                  style={styles.storeContent}
                  onPress={() => router.push(`/stores/${vendor.id}`)}
                >
                  {vendor.thumbnail ? (
                    <Image
                      source={{ uri: vendor.thumbnail }}
                      style={styles.storeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.storeImage, styles.storeImagePlaceholder]}>
                      <Ionicons name="storefront-outline" size={32} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{vendor.business_name}</Text>
                    <Text style={styles.storePhone}>{vendor.contact_phone}</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleUnfollow(vendor.id)}
                  style={styles.unfollowBtn}
                >
                  <Ionicons name="heart" size={20} color={colors.error} />
                </Pressable>
              </Card>
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
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  storeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    marginRight: spacing.md,
  },
  storeImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  storePhone: {
    ...typography.body,
    color: colors.textMuted,
  },
  unfollowBtn: {
    padding: spacing.sm,
  },
});
