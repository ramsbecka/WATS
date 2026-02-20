import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable, TextInput } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  }
  return value.trim() ? `+${digits}` : '';
}

export default function ResetPassword() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify' | 'reset'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus code input when step changes to verify
  useEffect(() => {
    if (step === 'verify' && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 300);
    }
  }, [step]);

  // Auto-submit when code is 6 digits
  useEffect(() => {
    if (code.length === 6 && step === 'verify' && !loading && phoneNumber) {
      verifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step, loading, phoneNumber]);

  const sendOTP = async (isResend = false) => {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 12) {
      Alert.alert('Phone', 'Please enter a valid phone number (e.g. 0712345678).');
      return;
    }
    
    if (isResend) {
      setResending(true);
    } else {
      setLoading(true);
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms',
      },
    });
    
    if (isResend) {
      setResending(false);
    } else {
      setLoading(false);
    }
    
    if (error) {
      // Handle Twilio daily limit error
      let errorMessage = error.message || 'Please try again later.';
      let errorTitle = 'Send failed';
      
      if (error.message?.includes('daily messages limit') || error.message?.includes('63038')) {
        errorTitle = 'Daily SMS Limit Reached';
        errorMessage = 'Twilio account has reached the daily SMS limit (5 messages for trial accounts).\n\nPlease try again tomorrow or upgrade your Twilio account for higher limits.';
      } else if (error.message?.includes('Invalid phone number') || error.message?.includes('phone')) {
        errorTitle = 'Invalid Phone Number';
        errorMessage = 'Please enter a valid phone number in format: 0712345678 or 255712345678';
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        errorTitle = 'Too Many Requests';
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      }
      
      Alert.alert(errorTitle, errorMessage);
      return;
    }
    
    setPhoneNumber(normalizedPhone);
    setCode(''); // Clear previous code
    setCountdown(60); // Start 60 second countdown
    if (!isResend) {
      setStep('verify');
    } else {
      Alert.alert('Code sent', 'A new verification code has been sent to your phone.');
    }
  };

  const resendOTP = () => {
    if (countdown > 0) return;
    sendOTP(true);
  };

  const verifyOTP = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Code', 'Please enter the 6-digit code sent to your phone.');
      return;
    }
    
    // Only allow digits
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      Alert.alert('Code', 'Please enter a valid 6-digit code.');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: cleanCode,
      type: 'sms',
    });
    setLoading(false);
    
    if (error) {
      Alert.alert(
        'Verification failed',
        error.message || 'Invalid code. Please check and try again.',
        [
          { text: 'OK' },
          {
            text: 'Resend code',
            onPress: () => {
              setCode('');
              resendOTP();
            },
          },
        ]
      );
      setCode(''); // Clear code on error
      return;
    }
    
    setCountdown(0); // Stop countdown
    setStep('reset');
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password', 'Password and confirmation do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Reset failed', error.message || 'Please try again later.');
      return;
    }
    Alert.alert(
      'Password reset',
      'Your password has been reset successfully.',
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
  };

  // Step 1: Enter phone number
  if (step === 'phone') {
    return (
      <Screen style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="lock-closed" size={36} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your phone number. We will send you a code via SMS.
              </Text>
            </View>

            {!hasValidSupabase && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
              </View>
            )}

            <Card style={styles.card}>
              <Input
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                placeholder="0712345678 or 255712345678"
                keyboardType="phone-pad"
              />
              <Button title="Send code" onPress={sendOTP} loading={loading} />
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Link href="/auth/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // Step 2: Verify OTP code
  if (step === 'verify') {
    return (
      <Screen style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoCircle, styles.verifyCircle]}>
                  <Ionicons name="phone-portrait" size={32} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.title}>Verify Code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {phoneNumber}
              </Text>
            </View>

            <Card style={styles.card}>
              <View style={styles.codeInputWrapper}>
                <Text style={styles.codeLabel}>Verification code</Text>
                <TextInput
                  ref={codeInputRef}
                  value={code}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digits = text.replace(/\D/g, '').slice(0, 6);
                    setCode(digits);
                  }}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={[styles.codeInput, styles.codeInputField]}
                />
              </View>
              
              {countdown > 0 && (
                <Text style={styles.countdownText}>
                  Resend code in {countdown}s
                </Text>
              )}
              
              <Button 
                title="Verify" 
                onPress={verifyOTP} 
                loading={loading}
                disabled={code.length !== 6}
              />
              
              <View style={styles.resendContainer}>
                <Pressable
                  onPress={resendOTP}
                  disabled={countdown > 0 || resending}
                  style={[styles.resendButton, (countdown > 0 || resending) && styles.resendButtonDisabled]}
                >
                  <Text style={[styles.resendButtonText, (countdown > 0 || resending) && styles.resendButtonTextDisabled]}>
                    {resending ? 'Sending...' : 'Resend code'}
                  </Text>
                </Pressable>
              </View>
              
              <Pressable
                onPress={() => {
                  setStep('phone');
                  setCode('');
                  setCountdown(0);
                }}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>Change phone number</Text>
              </Pressable>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // Step 3: Reset password
  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, styles.successCircle]}>
                <Ionicons name="checkmark-circle" size={36} color={colors.success} />
              </View>
            </View>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new account password
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="New password (at least 6 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              passwordToggle
            />
            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              passwordToggle
            />
            <Button title="Reset password" onPress={resetPassword} loading={loading} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    padding: spacing.lg, 
    justifyContent: 'center', 
    paddingBottom: spacing.xxl, 
    minHeight: 400 
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    borderWidth: 3,
    borderColor: colors.primary + '20',
  },
  verifyCircle: {
    borderColor: colors.primary + '30',
  },
  successCircle: {
    borderColor: colors.success + '30',
  },
  title: { 
    ...typography.hero, 
    color: colors.textPrimary, 
    marginBottom: spacing.sm, 
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: { 
    ...typography.body, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    paddingHorizontal: spacing.lg,
    fontSize: 15,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  envWarning: { 
    ...typography.caption, 
    color: colors.warning, 
    flex: 1,
    fontSize: 12,
  },
  card: { 
    padding: spacing.xl,
    borderRadius: radius.lg,
    ...shadows.md,
    backgroundColor: colors.surface,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerText: { 
    ...typography.body, 
    color: colors.textSecondary,
    fontSize: 15,
  },
  footerLink: { 
    ...typography.subheading, 
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  centered: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginTop: spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  backBtnText: { ...typography.subheading, color: colors.primary },
  backLink: {
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  backLinkText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  codeInputWrapper: {
    marginBottom: 16,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeInputField: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countdownText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  resendContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  resendButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
