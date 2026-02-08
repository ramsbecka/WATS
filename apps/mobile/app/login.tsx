import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendOtp = async () => {
    const normalized = phone.replace(/\D/g, '');
    if (normalized.length < 9) {
      Alert.alert('Invalid number', 'Please enter a valid phone number (at least 9 digits).');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized.startsWith('255') ? `+${normalized}` : `+255${normalized}`,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Send code failed', error.message || 'Could not send code. Check your number and try again.');
      return;
    }
    setSent(true);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code we sent you.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.replace(/\D/g, '').startsWith('255') ? `+${phone.replace(/\D/g, '')}` : `+255${phone.replace(/\D/g, '')}`,
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Verification failed', error.message || 'Invalid or expired code. Try again or request a new code.');
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>WATS</Text>
          <Text style={styles.subtitle}>Sign in with your phone number. We'll send you a code.</Text>
          <Card style={styles.card}>
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="255712345678"
              keyboardType="phone-pad"
              editable={!sent}
            />
            {!sent ? (
              <Button title="Send code" onPress={sendOtp} loading={loading} />
            ) : (
              <>
                <Input
                  label="6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="••••••"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Button title="Verify" onPress={verifyOtp} loading={loading} />
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', paddingBottom: spacing.xxl },
  title: { ...typography.hero, color: colors.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: 16 },
  card: { padding: spacing.lg },
});
