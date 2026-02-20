import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { initiateCheckout, getAvailableVouchers, verifyVoucherCode } from '@/api/client';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';
import { trackPurchase } from '@/services/ai';

export default function Checkout() {
  const router = useRouter();
  const { total, setItems, items } = useCartStore();
  const { user, profile, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [showVouchers, setShowVouchers] = useState(false);
  const [address, setAddress] = useState({
    name: profile?.display_name ?? '',
    phone: profile?.phone ?? '',
    region: '',
    district: '',
    ward: '',
    street: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (user?.id) {
      getAvailableVouchers(user.id).then(setAvailableVouchers).catch(() => {});
    }
  }, [user?.id]);

  const calculateTotal = () => {
    const subtotal = total();
    if (!appliedVoucher) return subtotal;
    
    const minOrder = Number(appliedVoucher.min_order_amount_tzs || 0);
    if (subtotal < minOrder) return subtotal;
    
    let discount = 0;
    if (appliedVoucher.discount_percentage) {
      discount = (subtotal * Number(appliedVoucher.discount_percentage)) / 100;
      if (appliedVoucher.max_discount_amount_tzs) {
        discount = Math.min(discount, Number(appliedVoucher.max_discount_amount_tzs));
      }
    } else if (appliedVoucher.discount_amount_tzs) {
      discount = Number(appliedVoucher.discount_amount_tzs);
    }
    
    return Math.max(0, subtotal - discount);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter voucher code');
      return;
    }
    setVoucherError('');
    try {
      const voucher = await verifyVoucherCode(voucherCode.trim());
      const subtotal = total();
      if (subtotal < Number(voucher.min_order_amount_tzs || 0)) {
        setVoucherError(`Minimum order amount: ${Number(voucher.min_order_amount_tzs).toLocaleString()} TSh`);
        return;
      }
      setAppliedVoucher(voucher);
      setVoucherCode('');
    } catch (e: any) {
      setVoucherError(e.message || 'Invalid voucher code');
      setAppliedVoucher(null);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  if (authLoading || !user) {
    return null;
  }

  const handleCheckout = async () => {
    if (!address.region || !address.street) {
      Alert.alert('Error', 'Please fill in full shipping details.');
      return;
    }
    if (!address.phone || address.phone.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number for M-Pesa payment.');
      return;
    }
    setLoading(true);
    try {
      const result = await initiateCheckout({
        shipping_address: address,
        idempotency_key: `ck-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        payment_provider: 'mpesa',
        voucher_code: appliedVoucher?.code || undefined,
      });
      setLoading(false);
      
      // Track purchase analytics
      trackPurchase(
        result.order_id,
        calculateTotal(),
        'TZS',
        items.map((item) => ({
          item_id: item.productId,
          item_name: item.name || 'Product',
          quantity: item.quantity,
          price: item.price,
        }))
      );
      
      // Check if STK push failed
      if (result.stk_push_failed) {
        Alert.alert(
          'Payment Request Failed',
          result.message || result.error || 'Failed to send M-Pesa payment request. Please check your phone number and try again.',
          [
            { text: 'OK', onPress: () => setLoading(false) },
            { 
              text: 'Retry', 
              onPress: () => {
                setLoading(false);
                setTimeout(() => handleCheckout(), 500);
              }
            },
          ]
        );
        return;
      }
      
      setItems([]); // Clear cart after order created
      router.replace({ pathname: '/checkout/payment', params: { orderId: result.order_id, orderNumber: result.order_number } });
    } catch (e: any) {
      setLoading(false);
      console.error('[Checkout] Error details:', e);
      const errorMessage = e.message || e.toString() || 'Failed to start payment.';
      
      // Check for specific error types
      let displayMessage = errorMessage;
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        displayMessage = 'Checkout service not available. Please ensure Edge Functions are deployed.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        displayMessage = 'Please log in again to continue.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        displayMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      Alert.alert(
        'Checkout Error',
        displayMessage,
        [
          { text: 'OK' },
          { 
            text: 'Retry', 
            onPress: () => {
              setTimeout(() => handleCheckout(), 500);
            }
          },
        ]
      );
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="cart" size={28} color={colors.primary} />
              <View style={styles.headerText}>
                <Text style={styles.title}>Checkout</Text>
                <Text style={styles.subtitle}>Jaza anwani na malipo</Text>
              </View>
            </View>
          </View>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>TZS {total().toLocaleString()}</Text>
          </View>
          {appliedVoucher && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({appliedVoucher.discount_percentage ? `${appliedVoucher.discount_percentage}%` : 'Fixed'})</Text>
              <Text style={styles.discountValue}>
                -TZS {(total() - calculateTotal()).toLocaleString()}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>TZS {calculateTotal().toLocaleString()}</Text>
          </View>
        </Card>
        
        {/* Voucher Section */}
        <Card style={styles.voucherCard}>
          <View style={styles.voucherHeader}>
            <Text style={styles.voucherTitle}>Voucher Code</Text>
            {availableVouchers.length > 0 && (
              <Pressable onPress={() => setShowVouchers(!showVouchers)}>
                <Text style={styles.voucherLink}>
                  {showVouchers ? 'Hide' : 'View'} Available ({availableVouchers.length})
                </Text>
              </Pressable>
            )}
          </View>
          {appliedVoucher ? (
            <View style={styles.appliedVoucher}>
              <View style={styles.appliedVoucherInfo}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success || colors.primary} />
                <Text style={styles.appliedVoucherText}>{appliedVoucher.code}</Text>
              </View>
              <Pressable onPress={handleRemoveVoucher}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.voucherInputRow}>
              <Input
                value={voucherCode}
                onChangeText={(t) => {
                  setVoucherCode(t.toUpperCase());
                  setVoucherError('');
                }}
                placeholder="Enter voucher code"
                style={styles.voucherInput}
                autoCapitalize="characters"
              />
              <Button
                title="Apply"
                onPress={handleApplyVoucher}
                style={styles.voucherButton}
                variant="outline"
              />
            </View>
          )}
          {voucherError ? (
            <Text style={styles.voucherError}>{voucherError}</Text>
          ) : null}
          {showVouchers && availableVouchers.length > 0 && (
            <View style={styles.vouchersList}>
              {availableVouchers.map((v) => (
                <Pressable
                  key={v.id}
                  style={styles.voucherItem}
                  onPress={() => {
                    setVoucherCode(v.code);
                    handleApplyVoucher();
                  }}
                >
                  <View>
                    <Text style={styles.voucherItemCode}>{v.code}</Text>
                    <Text style={styles.voucherItemDesc}>
                      {v.discount_percentage ? `${v.discount_percentage}% off` : `${Number(v.discount_amount_tzs).toLocaleString()} TSh off`}
                      {v.min_order_amount_tzs > 0 && ` • Min: ${Number(v.min_order_amount_tzs).toLocaleString()} TSh`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>
        <View style={styles.form}>
          <Input label="Full name" value={address.name} onChangeText={(t) => setAddress((a) => ({ ...a, name: t }))} placeholder="Your name" />
          <Input label="Phone (for STK Push)" value={address.phone} onChangeText={(t) => setAddress((a) => ({ ...a, phone: t }))} placeholder="255712345678" keyboardType="phone-pad" />
          <Input label="Region" value={address.region} onChangeText={(t) => setAddress((a) => ({ ...a, region: t }))} placeholder="e.g. Dar es Salaam" />
          <Input label="District" value={address.district} onChangeText={(t) => setAddress((a) => ({ ...a, district: t }))} placeholder="District" />
          <Input label="Ward (optional)" value={address.ward} onChangeText={(t) => setAddress((a) => ({ ...a, ward: t }))} placeholder="Ward" />
          <Input label="Street / address" value={address.street} onChangeText={(t) => setAddress((a) => ({ ...a, street: t }))} placeholder="Full address" />
        </View>
        <Button title="Place order & pay with M-Pesa" onPress={handleCheckout} loading={loading} style={styles.submitBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48 },
  header: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
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
    marginTop: 4,
  },
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.subheading,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  discountValue: {
    ...typography.body,
    color: colors.success || colors.primary,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  totalValue: {
    ...typography.title,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 22,
  },
  voucherCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  voucherTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  voucherLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  voucherInput: { flex: 1 },
  voucherButton: { alignSelf: 'flex-end' },
  voucherError: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: `${colors.success || colors.primary}15`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.success || colors.primary}30`,
  },
  appliedVoucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appliedVoucherText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  vouchersList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  voucherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  voucherItemCode: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  voucherItemDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.md,
    ...shadows.md,
  },
});
