import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/client';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getNotifications(user.id).then(setList).finally(() => setLoading(false));
  }, [user]);

  const handlePress = async (item: any) => {
    if (!item.read_at) {
      await markNotificationRead(item.id);
      setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
    }
    const orderId = item.data?.order_id;
    if (orderId) router.push(`/orders/${orderId}`);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id);
      setList((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch (_) {}
  };

  const unreadCount = list.filter((n) => !n.read_at).length;

  if (!user) {
    return (
      <Screen>
        <View style={styles.centered}><Text style={styles.emptyText}>Sign in to see notifications</Text></View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <View>
              <Text style={styles.title}>Arifa</Text>
              <Text style={styles.subtitle}>Order and payment updates</Text>
            </View>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.markAllText}>Soma Zote</Text>
            </Pressable>
          )}
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-outline" size={64} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
            <Card style={[styles.card, !item.read_at && styles.cardUnread]}>
              <View style={styles.cardHeader}>
                {!item.read_at && <View style={styles.unreadDot} />}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.body ? <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text> : null}
                  <View style={styles.cardFooter}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('sw-TZ')}</Text>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '15',
    borderRadius: radius.md,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
});
