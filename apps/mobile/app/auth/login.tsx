import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

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
          <Text style={styles.title}>WATS</Text>
          <Text style={styles.subtitle}>Sign in with your email and password.</Text>
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
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              passwordToggle
            />
            <Pressable onPress={() => router.push('/auth/reset-password')} style={styles.forgotLink}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
            <Button title="Sign in" onPress={signInWithEmail} loading={loading} />
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
  screen: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', paddingBottom: spacing.xxl, minHeight: 400 },
  title: { ...typography.hero, color: colors.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', paddingHorizontal: 16 },
  envWarning: { ...typography.caption, color: colors.warning, marginBottom: spacing.md, textAlign: 'center', paddingHorizontal: 16 },
  card: { padding: spacing.lg },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.md },
  linkText: { ...typography.caption, color: colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.subheading, color: colors.primary },
});
