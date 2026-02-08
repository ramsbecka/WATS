import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { initiateCheckout } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

export default function Checkout() {
  const router = useRouter();
  const { total, setItems } = useCartStore();
  const { user, profile, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: profile?.display_name ?? '',
    phone: profile?.phone ?? '',
    region: '',
    district: '',
    ward: '',
    street: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  if (authLoading || !user) {
    return null;
  }

  const handleCheckout = async () => {
    if (!address.region || !address.street) {
      Alert.alert('Error', 'Please fill in full shipping details.');
      return;
    }
    setLoading(true);
    try {
      const result = await initiateCheckout({
        shipping_address: address,
        idempotency_key: `ck-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        payment_provider: 'mpesa',
      });
      setLoading(false);
      setItems([]); // Clear cart after order created
      router.replace({ pathname: '/checkout/payment', params: { orderId: result.order_id, orderNumber: result.order_number } });
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to start payment.');
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
          <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Enter shipping address and pay</Text>
        </View>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>TZS {total().toLocaleString()}</Text>
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
  header: { marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  summaryCard: { padding: spacing.lg, marginBottom: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.subheading, color: colors.textSecondary },
  summaryValue: { ...typography.title, color: colors.primary },
  form: { marginBottom: spacing.lg },
  submitBtn: { marginTop: 8 },
});
