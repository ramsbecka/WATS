import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

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
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Orders and payment updates</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.markAllText}>Mark all read</Text>
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
            <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
            <Card style={[styles.card, !item.read_at && styles.cardUnread]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text> : null}
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('sw-TZ')}</Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  markAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: { padding: spacing.lg, marginBottom: 12 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  cardTitle: { ...typography.subheading, color: colors.textPrimary },
  cardBody: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  cardDate: { ...typography.caption, color: colors.textMuted, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: 12 },
});
