import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable, Modal, FlatList } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export const COUNTRY_OPTIONS: { code: string; dial: string; label: string }[] = [
  { code: 'TZ', dial: '255', label: 'Tanzania' },
  { code: 'KE', dial: '254', label: 'Kenya' },
  { code: 'UG', dial: '256', label: 'Uganda' },
  { code: 'RW', dial: '250', label: 'Rwanda' },
  { code: 'BI', dial: '257', label: 'Burundi' },
  { code: 'CD', dial: '243', label: 'DR Congo' },
  { code: 'ZM', dial: '260', label: 'Zambia' },
  { code: 'MW', dial: '265', label: 'Malawi' },
  { code: 'MZ', dial: '258', label: 'Mozambique' },
  { code: 'ZA', dial: '27', label: 'South Africa' },
  { code: 'ET', dial: '251', label: 'Ethiopia' },
  { code: 'SO', dial: '252', label: 'Somalia' },
  { code: 'SS', dial: '211', label: 'South Sudan' },
  { code: 'GH', dial: '233', label: 'Ghana' },
  { code: 'NG', dial: '234', label: 'Nigeria' },
  { code: 'EG', dial: '20', label: 'Egypt' },
  { code: 'MA', dial: '212', label: 'Morocco' },
  { code: 'IN', dial: '91', label: 'India' },
  { code: 'GB', dial: '44', label: 'United Kingdom' },
  { code: 'US', dial: '1', label: 'United States' },
  { code: 'AE', dial: '971', label: 'UAE' },
  { code: 'OTHER', dial: '', label: 'Other' },
];

function buildFullPhone(countryDial: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits.length) return '';
  if (countryDial) return `+${countryDial}${digits}`;
  return digits.startsWith('+') ? nationalNumber.trim() : `+${digits}`;
}

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const selectedCountry = COUNTRY_OPTIONS[countryIndex];
  const countryDial = selectedCountry.dial;

  const handleRegister = async () => {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      Alert.alert('Name', 'Please enter your first name.');
      return;
    }
    if (!last) {
      Alert.alert('Name', 'Please enter your last name.');
      return;
    }
    const name = `${first} ${last}`.trim();
    const e = email.trim();
    if (!e) {
      Alert.alert('Email', 'Please enter your email.');
      return;
    }
    const fullPhone = buildFullPhone(countryDial, phone);
    const nationalDigits = phone.replace(/\D/g, '');
    if (!nationalDigits.length || nationalDigits.length < 6) {
      Alert.alert('Phone', 'Please enter your phone number (after country code).');
      return;
    }
    if (fullPhone.length < 10) {
      Alert.alert('Phone', 'Invalid phone number. Select country and enter a valid number.');
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
        data: { display_name: name, phone: fullPhone },
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
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>Create an account and start shopping</Text>
          </View>

          {!hasValidSupabase && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={styles.envWarning}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to connect.</Text>
            </View>
          )}

          <Card style={styles.card}>
            <Input
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              autoCapitalize="words"
            />
            <Input
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
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
            <Text style={styles.inputLabel}>Country</Text>
            <Pressable
              style={styles.countryButton}
              onPress={() => setCountryPickerVisible(true)}
            >
              <Text style={styles.countryButtonText}>
                {selectedCountry.label} (+{selectedCountry.dial || '…'})
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </Pressable>
            <Modal
              visible={countryPickerVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setCountryPickerVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setCountryPickerVisible(false)}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select country</Text>
                    <Pressable onPress={() => setCountryPickerVisible(false)} hitSlop={12}>
                      <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                  <FlatList
                    data={COUNTRY_OPTIONS}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item, index }) => (
                      <Pressable
                        style={[styles.countryRow, index === countryIndex && styles.countryRowSelected]}
                        onPress={() => {
                          setCountryIndex(index);
                          setCountryPickerVisible(false);
                        }}
                      >
                        <Text style={styles.countryRowLabel}>{item.label}</Text>
                        <Text style={styles.countryRowDial}>+{item.dial || '…'}</Text>
                      </Pressable>
                    )}
                  />
                </Pressable>
              </Pressable>
            </Modal>
            <Text style={styles.inputLabel}>Phone number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+{countryDial || '…'}</Text>
              </View>
              <View style={styles.phoneInputWrap}>
                <Input
                  label=""
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={!countryDial ? '255 712 345 678' : countryDial === '255' ? '712 345 678' : '...'}
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                />
              </View>
            </View>
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
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: 16,
  },
  countryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  countryRowSelected: {
    backgroundColor: colors.primary + '15',
  },
  countryRowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  countryRowDial: {
    ...typography.body,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
    gap: spacing.sm,
  },
  phonePrefix: {
    minWidth: 72,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  phoneInputWrap: { flex: 1 },
  phoneInput: { marginBottom: 0 },
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
