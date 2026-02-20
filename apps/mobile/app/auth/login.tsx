import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    const e = email.trim();
    if (!e) {
      Alert.alert('Email', 'Please enter your email.');
      return;
    }
    if (!password) {
      Alert.alert('Password', 'Please enter your password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message || 'Email or password is incorrect. Try again.');
      return;
    }
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
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome to WATS</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {!hasValidSupabase && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
            </View>
          )}

          <Card style={styles.card}>
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
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              passwordToggle
            />
            <Pressable 
              onPress={() => router.push('/auth/reset-password')} 
              style={styles.forgotLink}
            >
              <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
            <Button title="Sign in" onPress={signInWithEmail} loading={loading} />
            
            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Social login buttons (optional - can be added later) */}
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.footerLink}>Register</Text>
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
    paddingTop: spacing.xxl,
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
  forgotLink: { 
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end', 
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  linkText: { 
    ...typography.caption, 
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
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
