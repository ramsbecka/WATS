import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PaymentStatus() {
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId?: string; orderNumber?: string }>();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'initiated' | 'completed' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const hasOrder = Boolean(orderId && orderNumber);

  const checkPaymentStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select('status, provider_reference')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (payment) {
        setPaymentStatus(payment.status as any);
        if (payment.status === 'completed') {
          setLoading(false);
          // Redirect after 2 seconds
          setTimeout(() => {
            router.replace(`/orders/${orderId}`);
          }, 2000);
        } else if (payment.status === 'failed') {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Payment check error:', e);
    } finally {
      setChecking(false);
      if (paymentStatus === 'pending') {
        setLoading(false);
      }
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={64} color={colors.success || colors.primary} />;
      case 'failed':
        return <Ionicons name="close-circle" size={64} color={colors.error} />;
      case 'initiated':
        return <Ionicons name="hourglass-outline" size={64} color={colors.warning || colors.primary} />;
      default:
        return <Ionicons name="phone-portrait-outline" size={64} color={colors.primary} />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment successful! Order confirmed.';
      case 'failed':
        return 'Payment failed. Please try again.';
      case 'initiated':
        return 'Payment initiated. Check your phone for M-Pesa prompt.';
      default:
        return 'Check your phone for the M-Pesa prompt.';
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          {loading && paymentStatus === 'pending' ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            getStatusIcon()
          )}
        </View>
        <Text style={styles.title}>{getStatusMessage()}</Text>
        {hasOrder && <Text style={styles.order}>Order #{orderNumber}</Text>}
        {paymentStatus === 'pending' || paymentStatus === 'initiated' ? (
          <>
            <Card style={styles.hintCard}>
              <Text style={styles.hint}>
                1. Check your phone for M-Pesa STK Push prompt{'\n'}
                2. Enter your M-Pesa PIN{'\n'}
                3. Wait for confirmation
              </Text>
            </Card>
            {checking && (
              <View style={styles.checking}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.checkingText}>Checking payment status...</Text>
              </View>
            )}
          </>
        ) : paymentStatus === 'completed' ? (
          <Card style={styles.successCard}>
            <Text style={styles.successText}>Your order has been confirmed!</Text>
            <Text style={styles.successSubtext}>Redirecting to order details...</Text>
          </Card>
        ) : (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>Payment was not successful.</Text>
            <Text style={styles.errorSubtext}>Please try again or contact support.</Text>
          </Card>
        )}
        {hasOrder && paymentStatus !== 'completed' && (
          <Button title="View order" onPress={() => router.replace(`/orders/${orderId}`)} style={styles.btn} />
        )}
        <Button title="Back to home" onPress={() => router.replace('/(tabs)')} variant="outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  order: { ...typography.subheading, color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  hintCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.background },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 24,
  },
  checking: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  checkingText: { ...typography.caption, color: colors.textSecondary },
  successCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: `${colors.success || colors.primary}14` },
  successText: { ...typography.subheading, color: colors.success || colors.primary, textAlign: 'center', marginBottom: 4 },
  successSubtext: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  errorCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: `${colors.error}14` },
  errorText: { ...typography.subheading, color: colors.error, textAlign: 'center', marginBottom: 4 },
  errorSubtext: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  btn: { marginBottom: 12 },
});
