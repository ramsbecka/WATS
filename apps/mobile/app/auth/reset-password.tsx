import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const e = email.trim();
    if (!e) {
      Alert.alert('Email', 'Please enter your email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: undefined,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Send failed', error.message || 'Please try again later.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a password reset link to {email}. Open your email and tap the link to set a new password.
          </Text>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back to Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    );
  }

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
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email. We'll send you a link to set a new password.
          </Text>
          {!hasValidSupabase && (
            <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
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
            <Button title="Send link" onPress={sendResetLink} loading={loading} />
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
});
