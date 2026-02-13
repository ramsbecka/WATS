import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Pressable, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { getReturnsForOrder, requestReturn, uploadReturnImage } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const returnStatusLabel: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  received: 'Received',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [returnImages, setReturnImages] = useState<Array<{ uri: string; base64?: string }>>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    loadOrder();
  }, [id, user]);

  const loadOrder = async () => {
    if (!id || !user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal_tzs, shipping_tzs, tax_tzs, total_tzs,
          shipping_address, created_at,
          order_items(
            id, quantity, unit_price_tzs, total_tzs,
            products(id, name_en, product_images(url))
          ),
          shipments(
            id, status, tracking_number, carrier, estimated_delivery_date,
            fulfilled_at, delivered_at, created_at,
            shipment_tracking_events(
              id, status, location, description, notes, created_at
            )
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (err) throw err;
      setOrder(data);
      const rets = await getReturnsForOrder(id);
      setReturns(rets);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to upload return images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets) {
      const newImages = await Promise.all(
        result.assets.map(async (asset) => {
          const base64 = asset.base64 || (await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          }));
          return { uri: asset.uri, base64 };
        })
      );
      setReturnImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async () => {
    if (!order || !returnReason.trim()) {
      Alert.alert('Required', 'Tafadhali andika sababu ya kurudisha bidhaa.');
      return;
    }
    setSubmittingReturn(true);
    try {
      const { data: returnData, error: retError } = await supabase
        .from('returns')
        .insert({
          order_id: order.id,
          reason: returnReason,
          comment: returnComment || null,
        })
        .select('id')
        .single();
      if (retError) throw retError;
      // Upload images
      for (let i = 0; i < returnImages.length; i++) {
        const img = returnImages[i];
        if (img.base64) {
          await uploadReturnImage(returnData.id, img.base64, 'image/jpeg');
        }
      }
      Alert.alert('Success', 'Return request imewasilishwa. Tutakupigia simu hivi karibuni.');
      setShowReturnForm(false);
      setReturnReason('');
      setReturnComment('');
      setReturnImages([]);
      loadOrder();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

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
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <Button title="Back" onPress={() => router.back()} variant="outline" style={styles.retryBtn} />
        </View>
      </Screen>
    );
  }

  const canReturn = order.status === 'delivered' && returns.length === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.orderNum}>{order.order_number}</Text>
            <View style={[styles.badge, order.status === 'delivered' && styles.badgeSuccess]}>
              <Text style={styles.badgeText}>{statusLabel[order.status] ?? order.status}</Text>
            </View>
          </View>
          <Text style={styles.date}>Date: {new Date(order.created_at).toLocaleDateString('sw-TZ')}</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>TZS {Number(order.total_tzs).toLocaleString()}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.order_items?.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.products?.name_en ?? 'Product'}</Text>
              <Text style={styles.itemMeta}>x{item.quantity} - TZS {Number(item.total_tzs).toLocaleString()}</Text>
            </View>
          ))}
        </Card>

        {/* Tracking Section */}
        {order.shipments && order.shipments.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking Information</Text>
            {order.shipments.map((shipment: any) => {
              const events = shipment.shipment_tracking_events || [];
              const sortedEvents = [...events].sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const statusSteps = ['pending', 'picked', 'packed', 'in_transit', 'delivered'];
              const currentStepIndex = statusSteps.indexOf(shipment.status);
              
              return (
                <View key={shipment.id} style={styles.trackingContainer}>
                  {shipment.tracking_number && (
                    <View style={styles.trackingNumberRow}>
                      <Text style={styles.trackingLabel}>Tracking Number:</Text>
                      <Text style={styles.trackingNumber}>{shipment.tracking_number}</Text>
                    </View>
                  )}
                  {shipment.carrier && (
                    <Text style={styles.carrier}>Carrier: {shipment.carrier}</Text>
                  )}
                  {shipment.estimated_delivery_date && (
                    <Text style={styles.estimatedDelivery}>
                      Estimated Delivery: {new Date(shipment.estimated_delivery_date).toLocaleDateString('sw-TZ')}
                    </Text>
                  )}
                  
                  {/* Status Timeline */}
                  <View style={styles.timeline}>
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const stepLabel: Record<string, string> = {
                        pending: 'Order Received',
                        picked: 'Picked Up',
                        packed: 'Packed',
                        in_transit: 'In Transit',
                        delivered: 'Delivered',
                      };
                      
                      return (
                        <View key={step} style={styles.timelineStep}>
                          <View style={styles.timelineLine}>
                            {index < statusSteps.length - 1 && (
                              <View style={[styles.timelineLineInner, isCompleted && styles.timelineLineCompleted]} />
                            )}
                          </View>
                          <View style={[
                            styles.timelineDot,
                            isCompleted && styles.timelineDotCompleted,
                            isCurrent && styles.timelineDotCurrent,
                          ]}>
                            <Ionicons
                              name={isCompleted ? 'checkmark' : 'ellipse-outline'}
                              size={16}
                              color={isCompleted ? colors.surface : colors.textMuted}
                            />
                          </View>
                          <Text style={[
                            styles.timelineLabel,
                            isCompleted && styles.timelineLabelCompleted,
                            isCurrent && styles.timelineLabelCurrent,
                          ]}>
                            {stepLabel[step]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Tracking Events Timeline */}
                  {sortedEvents.length > 0 && (
                    <View style={styles.eventsContainer}>
                      <Text style={styles.eventsTitle}>Tracking History</Text>
                      {sortedEvents.map((event: any, idx: number) => (
                        <View key={event.id} style={styles.eventItem}>
                          <View style={styles.eventDot} />
                          <View style={styles.eventContent}>
                            <Text style={styles.eventStatus}>
                              {statusLabel[event.status] || event.status}
                            </Text>
                            {event.description && (
                              <Text style={styles.eventDescription}>{event.description}</Text>
                            )}
                            {event.location && (
                              <Text style={styles.eventLocation}>
                                <Ionicons name="location-outline" size={12} color={colors.textMuted} /> {event.location}
                              </Text>
                            )}
                            {event.notes && (
                              <Text style={styles.eventNotes}>{event.notes}</Text>
                            )}
                            <Text style={styles.eventDate}>
                              {new Date(event.created_at).toLocaleString('sw-TZ')}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {canReturn && !showReturnForm && (
          <Button
            title="Request Return"
            onPress={() => setShowReturnForm(true)}
            variant="outline"
            style={styles.returnBtn}
          />
        )}

        {showReturnForm && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Request Return</Text>
            <Text style={styles.label}>Sababu ya kurudisha *</Text>
            <View style={styles.input}>
              <Text
                style={styles.inputText}
                onPress={() => {
                  Alert.alert(
                    'Chagua sababu',
                    '',
                    [
                      { text: 'Bidhaa imeharibika', onPress: () => setReturnReason('Bidhaa imeharibika') },
                      { text: 'Bidhaa si sahihi', onPress: () => setReturnReason('Bidhaa si sahihi') },
                      { text: 'Bidhaa haifanani na maelezo', onPress: () => setReturnReason('Bidhaa haifanani na maelezo') },
                      { text: 'Ningependa kubadilisha', onPress: () => setReturnReason('Ningependa kubadilisha') },
                      { text: 'Ningine', onPress: () => setReturnReason('') },
                    ]
                  );
                }}
              >
                {returnReason || 'Chagua sababu'}
              </Text>
            </View>
            <Text style={styles.label}>Maelezo (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={returnComment}
              onChangeText={setReturnComment}
              placeholder="Andika maelezo zaidi..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.label}>Picha za mzigo uliopokea</Text>
            <Pressable onPress={pickImage} style={styles.imagePickerBtn}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.imagePickerText}>Add photos</Text>
            </Pressable>
            {returnImages.length > 0 && (
              <View style={styles.imageGrid}>
                {returnImages.map((img, idx) => (
                  <View key={idx} style={styles.imageWrap}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <Pressable onPress={() => removeImage(idx)} style={styles.removeImageBtn}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowReturnForm(false);
                  setReturnReason('');
                  setReturnComment('');
                  setReturnImages([]);
                }}
                variant="outline"
                style={styles.cancelBtn}
              />
              <Button
                title="Submit"
                onPress={handleSubmitReturn}
                loading={submittingReturn}
                style={styles.submitBtn}
              />
            </View>
          </Card>
        )}

        {returns.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Return Status</Text>
            {returns.map((ret) => (
              <View key={ret.id} style={styles.returnItem}>
                <Text style={styles.returnStatus}>{returnStatusLabel[ret.status] ?? ret.status}</Text>
                <Text style={styles.returnReason}>{ret.reason}</Text>
                {ret.comment && <Text style={styles.returnComment}>{ret.comment}</Text>}
                {ret.return_images && ret.return_images.length > 0 && (
                  <View style={styles.returnImages}>
                    {ret.return_images.map((img: any, idx: number) => (
                      <Image key={idx} source={{ uri: img.url }} style={styles.returnImage} />
                    ))}
                  </View>
                )}
                <Text style={styles.returnDate}>{new Date(ret.created_at).toLocaleDateString('sw-TZ')}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { marginTop: 8 },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderNum: { ...typography.title, color: colors.textPrimary },
  badge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: `${colors.success}20` },
  badgeText: { ...typography.small, color: colors.textSecondary },
  date: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.title, color: colors.primary },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  itemMeta: { ...typography.caption, color: colors.textSecondary },
  returnBtn: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  inputText: { ...typography.body, color: colors.textPrimary },
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    backgroundColor: colors.background,
    ...typography.body,
    color: colors.textPrimary,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: `${colors.primary}10`,
  },
  imagePickerText: { ...typography.body, color: colors.primary },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  imageWrap: { position: 'relative', width: 80, height: 80 },
  imagePreview: { width: 80, height: 80, borderRadius: radius.md },
  removeImageBtn: { position: 'absolute', top: -8, right: -8 },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1 },
  returnItem: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  returnStatus: { ...typography.subheading, color: colors.primary, marginBottom: 4 },
  returnReason: { ...typography.body, color: colors.textPrimary, marginBottom: 4 },
  returnComment: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  returnImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  returnImage: { width: 60, height: 60, borderRadius: radius.sm },
  returnDate: { ...typography.caption, color: colors.textMuted },
  trackingContainer: { marginTop: spacing.md },
  trackingNumberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  trackingLabel: { ...typography.caption, color: colors.textSecondary },
  trackingNumber: { ...typography.subheading, color: colors.primary, fontWeight: '600' },
  carrier: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  estimatedDelivery: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  timeline: { marginTop: spacing.md, marginBottom: spacing.lg },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  timelineLine: { width: 2, marginLeft: 7, marginRight: spacing.sm, position: 'relative' },
  timelineLineInner: { flex: 1, width: 2, backgroundColor: colors.borderLight, minHeight: 40 },
  timelineLineCompleted: { backgroundColor: colors.primary },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  timelineDotCompleted: { backgroundColor: colors.primary },
  timelineDotCurrent: { backgroundColor: colors.primary, borderWidth: 3, borderColor: `${colors.primary}40` },
  timelineLabel: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginLeft: spacing.xs },
  timelineLabelCompleted: { color: colors.textPrimary, fontWeight: '600' },
  timelineLabelCurrent: { color: colors.primary },
  eventsContainer: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  eventsTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  eventItem: { flexDirection: 'row', marginBottom: spacing.lg },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.md },
  eventContent: { flex: 1 },
  eventStatus: { ...typography.subheading, color: colors.textPrimary, marginBottom: 2 },
  eventDescription: { ...typography.body, color: colors.textSecondary, marginBottom: 4 },
  eventLocation: { ...typography.caption, color: colors.textMuted, marginBottom: 2, flexDirection: 'row', alignItems: 'center' },
  eventNotes: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  eventDate: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
});
