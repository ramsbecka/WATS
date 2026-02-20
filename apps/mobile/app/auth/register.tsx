import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

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
        // Disable email confirmation - allow immediate login
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
        // Set user in auth store for immediate login
        useAuthStore.getState().setUser(data.user);
        // Fetch profile
        await useAuthStore.getState().fetchProfile(data.user.id);
      } catch (_) {}
    }
    setLoading(false);
    // Redirect to app immediately without email verification
    router.replace('/(tabs)');
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
          {/* Header with logo */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={36} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>Unda account mpya na uanze kununua</Text>
          </View>

          {!hasValidSupabase && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
            </View>
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
});
