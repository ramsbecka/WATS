import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography } from '@/theme/tokens';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  }
  return value.trim() ? `+${digits}` : '';
}

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const name = fullName.trim();
    if (!name) {
      Alert.alert('Full name', 'Please enter your full name.');
      return;
    }
    const e = email.trim();
    if (!e) {
      Alert.alert('Email', 'Please enter your email.');
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 12) {
      Alert.alert('Phone', 'Please enter a valid phone number (e.g. 0712345678).');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password', 'Password and confirmation do not match.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: e,
      password,
      options: {
        emailRedirectTo: undefined,
        data: { display_name: name, phone: normalizedPhone },
      },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Registration failed', error.message || 'Please try again later.');
      return;
    }
    if (data?.user) {
      try {
        await useAuthStore.getState().ensureProfile(data.user);
      } catch (_) {}
    }
    setLoading(false);
    Alert.alert(
      'Check your email',
      'We sent a confirmation link to your email. Open it and tap the link, then sign in here.',
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
  };

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
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create a new account with your details.</Text>
          {!hasValidSupabase && (
            <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
          )}

          <Card style={styles.card}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="0712345678 or 255712345678"
              keyboardType="phone-pad"
            />
            <Input
              label="Password (at least 6 characters)"
              value={password}
              onChangeText={setPassword}
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
            <Button title="Register" onPress={handleRegister} loading={loading} />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', paddingBottom: spacing.xxl, minHeight: 400 },
  title: { ...typography.hero, color: colors.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: 16 },
  envWarning: { ...typography.caption, color: colors.warning, marginBottom: spacing.md, textAlign: 'center', paddingHorizontal: 16 },
  card: { padding: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.subheading, color: colors.primary },
});
