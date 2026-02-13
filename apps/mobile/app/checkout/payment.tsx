import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';
import { initiateCheckout } from '@/api/client';

export default function PaymentStatus() {
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId?: string; orderNumber?: string }>();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'initiated' | 'completed' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [providerReference, setProviderReference] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasOrder = Boolean(orderId && orderNumber);

  const checkPaymentStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, provider_reference, provider_callback')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (payment) {
        setPaymentId(payment.id);
        setProviderReference(payment.provider_reference);
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
      if (paymentStatus === 'pending' || paymentStatus === 'initiated') {
        setLoading(false);
      }
    }
  };

  // Setup real-time subscription for payment status updates
  useEffect(() => {
    if (!orderId || paymentStatus === 'completed' || paymentStatus === 'failed') return;

    // Initial check
    checkPaymentStatus();

    // Subscribe to payment status changes
    let paymentChannel: any = null;
    let orderChannel: any = null;
    
    if (paymentId) {
      paymentChannel = supabase
        .channel(`payment-${paymentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments',
            filter: `id=eq.${paymentId}`,
          },
          (payload) => {
            const newStatus = payload.new.status as any;
            setPaymentStatus(newStatus);
            if (newStatus === 'completed') {
              setLoading(false);
              setTimeout(() => {
                router.replace(`/orders/${orderId}`);
              }, 2000);
            } else if (newStatus === 'failed') {
              setLoading(false);
            }
          }
        )
        .subscribe();

      // Also subscribe to order status changes
      orderChannel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            const orderStatus = payload.new.status;
            if (orderStatus === 'confirmed' && paymentStatus !== 'completed') {
              checkPaymentStatus();
            }
          }
        )
        .subscribe();
      
      subscriptionRef.current = { paymentChannel, orderChannel };
    }

    // Fallback polling every 5 seconds (in case realtime fails)
    const interval = setInterval(() => {
      if (paymentStatus === 'pending' || paymentStatus === 'initiated') {
        checkPaymentStatus();
      }
    }, 5000);

    // Payment timeout: 5 minutes
    timeoutRef.current = setTimeout(() => {
      if (paymentStatus === 'pending' || paymentStatus === 'initiated') {
        Alert.alert(
          'Payment Timeout',
          'Payment is taking longer than expected. Please check your phone or try again.',
          [
            { text: 'Retry Payment', onPress: handleRetryPayment },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (subscriptionRef.current) {
        if (subscriptionRef.current.paymentChannel) {
          subscriptionRef.current.paymentChannel.unsubscribe();
        }
        if (subscriptionRef.current.orderChannel) {
          subscriptionRef.current.orderChannel.unsubscribe();
        }
      }
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentId]);

  const handleRetryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      // Get order details for retry
      const { data: order } = await supabase
        .from('orders')
        .select('shipping_address, total_tzs')
        .eq('id', orderId)
        .single();

      if (order) {
        // Retry payment with new idempotency key
        const result = await initiateCheckout({
          shipping_address: order.shipping_address as any,
          idempotency_key: `retry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          payment_provider: 'mpesa',
        });
        
        // Update payment status
        setPaymentStatus('initiated');
        setLoading(true);
        Alert.alert('Success', 'Payment request sent. Check your phone for M-Pesa prompt.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to retry payment. Please try again.');
    } finally {
      setRetrying(false);
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
          <>
            <Button 
              title="View order" 
              onPress={() => router.replace(`/orders/${orderId}`)} 
              style={styles.btn} 
            />
            {(paymentStatus === 'failed' || paymentStatus === 'pending') && (
              <Button 
                title={retrying ? "Retrying..." : "Retry Payment"} 
                onPress={handleRetryPayment} 
                loading={retrying}
                style={styles.btn} 
              />
            )}
          </>
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
