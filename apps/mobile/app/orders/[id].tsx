import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getOrder, getReturnsForOrder, requestReturn } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

const statusLabel: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
};

const shipmentStatusLabel: Record<string, string> = {
  pending: 'Pending', picked: 'Picked', packed: 'Packed',
  in_transit: 'In transit', delivered: 'Delivered', failed: 'Failed',
};

const returnStatusLabel: Record<string, string> = {
  requested: 'Requested', approved: 'Approved', received: 'Received',
  refunded: 'Refunded', rejected: 'Rejected',
};

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getOrder(id), getReturnsForOrder(id)])
      .then(([o, r]) => {
        setOrder(o);
        setReturns(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }
  if (error || !order) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <Button title="Back to orders" onPress={() => router.back()} variant="outline" style={styles.errorBtn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusLabel[order.status] ?? order.status}</Text>
          </View>
          <Text style={styles.total}>TZS {Number(order.total_tzs).toLocaleString()}</Text>
          <Text style={styles.date}>{new Date(order.created_at).toLocaleString('sw-TZ')}</Text>
        </Card>
        {(order.shipments?.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Tracking</Text>
            {(order.shipments ?? []).map((s: any) => (
              <Card key={s.id} style={styles.trackingCard}>
                <View style={styles.trackingRow}>
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  <Text style={styles.trackingStatus}>{shipmentStatusLabel[s.status] ?? s.status}</Text>
                </View>
                {s.tracking_number ? <Text style={styles.trackingNumber}>Tracking: {s.tracking_number}</Text> : null}
                {s.carrier ? <Text style={styles.trackingCarrier}>{s.carrier}</Text> : null}
              </Card>
            ))}
          </>
        )}
        <Text style={styles.sectionTitle}>Items</Text>
        {(order.order_items ?? []).map((item: any) => (
          <Card key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName} numberOfLines={2}>{item.products?.name_sw ?? item.products?.name_en ?? item.product_id}</Text>
            <View style={styles.itemRow}>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>TZS {Number(item.total_tzs).toLocaleString()}</Text>
            </View>
          </Card>
        ))}
        {['shipped', 'delivered'].includes(order.status) && (
          <>
            <Text style={styles.sectionTitle}>Returns</Text>
            {returns.length > 0 ? (
              returns.map((r: any) => (
                <Card key={r.id} style={styles.returnCard}>
                  <Text style={styles.returnStatus}>{returnStatusLabel[r.status] ?? r.status}</Text>
                  {r.reason ? <Text style={styles.returnReason}>{r.reason}</Text> : null}
                  <Text style={styles.returnDate}>{new Date(r.created_at).toLocaleString('sw-TZ')}</Text>
                </Card>
              ))
            ) : (
              <Card style={styles.returnCard}>
                <Text style={styles.returnHint}>You can request a return for this order.</Text>
                <Button
                  title={returning ? 'Submitting…' : 'Request return'}
                  onPress={() => {
                    if (returning) return;
                    Alert.alert('Request return', 'Confirm that you want to request a return for this order?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: () => {
                          setReturning(true);
                          requestReturn(order.id)
                            .then(() => getReturnsForOrder(order.id).then(setReturns))
                            .catch((e) => Alert.alert('Error', e.message))
                            .finally(() => setReturning(false));
                        },
                      },
                    ]);
                  }}
                  variant="outline"
                  style={styles.returnButton}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
  errorBtn: {},
  headerCard: { padding: spacing.lg, marginBottom: spacing.lg },
  orderNumber: { ...typography.title, color: colors.textPrimary },
  badge: { alignSelf: 'flex-start', backgroundColor: `${colors.primary}14`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  badgeText: { ...typography.caption, color: colors.primary },
  total: { ...typography.heading, color: colors.primary, marginTop: 12 },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { ...typography.subheading, color: colors.textSecondary, marginBottom: 12 },
  itemCard: { padding: spacing.md, marginBottom: 12 },
  itemName: { ...typography.body, color: colors.textPrimary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  itemQty: { ...typography.caption, color: colors.textSecondary },
  itemPrice: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  trackingCard: { padding: spacing.md, marginBottom: 12 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackingStatus: { ...typography.subheading, color: colors.textPrimary },
  trackingNumber: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  trackingCarrier: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  returnCard: { padding: spacing.md, marginBottom: 12 },
  returnStatus: { ...typography.subheading, color: colors.textPrimary },
  returnReason: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  returnDate: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  returnHint: { ...typography.caption, color: colors.textSecondary, marginBottom: 12 },
  returnButton: { alignSelf: 'flex-start' },
});
