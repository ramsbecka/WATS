import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { getUserAddresses, deleteUserAddress } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function Addresses() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) { setLoading(false); return; }
    getUserAddresses(user.id)
      .then(setAddresses)
      .catch((e: any) => console.error('Failed to load addresses:', e))
      .finally(() => setLoading(false));
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const handleDelete = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAddress(addressId);
              setAddresses((prev) => prev.filter((a) => a.id !== addressId));
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (addressId: string) => {
    router.push({ pathname: '/addresses/edit', params: { id: addressId } });
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Address Management</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to manage your addresses</Text>
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
          <Text style={styles.title}>Address Management</Text>
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
        <Text style={styles.title}>Address Management</Text>
        <Pressable onPress={() => router.push('/addresses/add')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No addresses saved</Text>
          <Button
            title="Add Address"
            onPress={() => router.push('/addresses/add')}
            style={styles.addFirstBtn}
          />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabelRow}>
                  <Text style={styles.addressLabel}>{item.label}</Text>
                  {item.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressActions}>
                  <Pressable onPress={() => handleEdit(item.id)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.addressName}>{item.recipient_name}</Text>
              <Text style={styles.addressPhone}>{item.recipient_phone}</Text>
              <Text style={styles.addressText}>
                {[item.street_address, item.ward, item.district, item.region]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </Card>
          )}
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
  addBtn: {
    padding: spacing.xs,
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
  addFirstBtn: {
    marginTop: spacing.lg,
  },
  list: {
    padding: spacing.lg,
  },
  addressCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addressLabel: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  defaultBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  addressName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  addressPhone: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  addressText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
