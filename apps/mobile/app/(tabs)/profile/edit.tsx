import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  }
  return value.trim() ? `+${digits}` : '';
}

function displayPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length >= 12) return digits.slice(3); // 712345678
  return digits;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

const AVATAR_PATH = (userId: string) => `${userId}/avatar.jpg`;

export default function EditProfile() {
  const router = useRouter();
  const { profile, user, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setPhone(displayPhone(profile.phone));
      setAvatarUrl(profile.avatar_url ?? null);
      setDateOfBirth(formatDate(profile.date_of_birth));
      setGender(profile.gender ?? '');
      setNationalId(profile.national_id ?? '');
      setRegion(profile.region ?? '');
      setDistrict(profile.district ?? '');
      setWard(profile.ward ?? '');
      setStreetAddress(profile.street_address ?? '');
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'We need access to your photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !user?.id) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const arrayBuffer = new Uint8Array(byteNumbers).buffer;
      const path = AVATAR_PATH(user.id);
      const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert('Name', 'Please enter your name.');
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length > 0 && normalizedPhone.length < 12) {
      Alert.alert('Phone', 'Please enter a valid phone number (e.g. 0712345678).');
      return;
    }
    setLoading(true);
    const { error } = await updateProfile({
      display_name: name,
      phone: normalizedPhone.length >= 12 ? normalizedPhone : null,
      avatar_url: avatarUrl || null,
      date_of_birth: dateOfBirth.trim() || null,
      gender: gender.trim() || null,
      national_id: nationalId.trim() || null,
      region: region.trim() || null,
      district: district.trim() || null,
      ward: ward.trim() || null,
      street_address: streetAddress.trim() || null,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Update failed', error.message || 'Please try again.');
      return;
    }
    Alert.alert('Saved', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  if (!user) return null;

  const isVerified = profile && 
    profile.display_name && profile.display_name.trim() !== '' &&
    profile.phone && profile.phone.trim() !== '' &&
    profile.email && profile.email.trim() !== '' &&
    profile.date_of_birth &&
    profile.gender &&
    profile.national_id && profile.national_id.trim() !== '' &&
    profile.region && profile.region.trim() !== '' &&
    profile.district && profile.district.trim() !== '' &&
    profile.street_address && profile.street_address.trim() !== '';

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
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
          <Pressable
            onPress={pickImage}
            disabled={uploadingImage}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.avatarWrapPressed]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={36} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              {uploadingImage ? (
                <Text style={styles.avatarBadgeText}>...</Text>
              ) : (
                <Ionicons name="camera" size={18} color={colors.surface} />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change profile photo</Text>

          {isVerified && (
            <View style={styles.verifiedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.verifiedText}>Profile Verified</Text>
            </View>
          )}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Input
              label="Full name *"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="John Doe"
              autoCapitalize="words"
            />
            <Input
              label="Phone number *"
              value={phone}
              onChangeText={setPhone}
              placeholder="0712345678 or 255712345678"
              keyboardType="phone-pad"
            />
            {profile?.email != null && profile.email !== '' && (
              <View style={styles.readOnlyRow}>
                <Text style={styles.label}>Email *</Text>
                <Text style={styles.readOnlyValue}>{profile.email}</Text>
                <Text style={styles.hint}>Email cannot be changed here.</Text>
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <Input
              label="Date of Birth *"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD (e.g. 1990-01-15)"
            />
            <View style={styles.genderRow}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderOptions}>
                {['male', 'female', 'other'].map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.genderOption, gender === g && styles.genderOptionActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderOptionText, gender === g && styles.genderOptionTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Input
              label="National ID *"
              value={nationalId}
              onChangeText={setNationalId}
              placeholder="Enter your National ID number"
              keyboardType="default"
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            <Input
              label="Region *"
              value={region}
              onChangeText={setRegion}
              placeholder="e.g. Dar es Salaam"
              autoCapitalize="words"
            />
            <Input
              label="District *"
              value={district}
              onChangeText={setDistrict}
              placeholder="e.g. Kinondoni"
              autoCapitalize="words"
            />
            <Input
              label="Ward"
              value={ward}
              onChangeText={setWard}
              placeholder="e.g. Mbezi"
              autoCapitalize="words"
            />
            <Input
              label="Street Address *"
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="House number, street name"
              autoCapitalize="words"
              multiline
              numberOfLines={2}
            />
          </Card>

          <Button title="Save changes" onPress={handleSave} loading={loading} style={styles.saveBtn} />
          <Text style={styles.hintText}>
            * Required fields. Complete all required fields to verify your profile.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  avatarWrapPressed: { opacity: 0.9 },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: { color: colors.surface, fontSize: 12 },
  avatarHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.success}15`,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  verifiedText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  readOnlyRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  readOnlyValue: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  genderRow: { marginTop: spacing.md },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  genderOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  genderOptionTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  saveBtn: { marginTop: spacing.md },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
