import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { verifyReferralCode, applyReferralCode } from '@/api/client';
import { colors, spacing, typography, radius, shadows } from '@/theme/tokens';

export default function FriendCode() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyReferralCode(code.trim());
      setVerified(true);
      Alert.alert('Valid Code', 'This referral code is valid. You can apply it now.');
    } catch (e: any) {
      setVerified(false);
      Alert.alert('Invalid Code', e?.message || 'This referral code is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!code.trim() || !verified) {
      Alert.alert('Error', 'Please verify the code first');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to apply a referral code');
      return;
    }

    setLoading(true);
    try {
      await applyReferralCode(code.trim());
      Alert.alert(
        'Success!',
        'Referral code applied successfully! You have received bonus points.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to apply referral code');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Friend's Code</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to apply a friend's referral code</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.title}>Nambari ya Rafiki</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.descriptionContainer}>
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
            <Text style={styles.description}>
              Ingiza nambari ya rafiki yako ili upate alama za ziada unapojisajili au kufanya ununuzi wako wa kwanza.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Referral Code"
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase().trim());
                setVerified(false);
              }}
              placeholder="Enter code (e.g., ABC12345)"
              autoCapitalize="characters"
              maxLength={20}
              style={styles.input}
            />
          </View>

          {verified && (
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.successText}>Nambari imethibitishwa</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="Thibitisha Nambari"
              onPress={handleVerify}
              loading={loading && !verified}
              variant="outline"
              style={styles.verifyBtn}
            />
            {verified && (
              <Button
                title="Tumia Nambari"
                onPress={handleApply}
                loading={loading && verified}
                style={styles.applyBtn}
              />
            )}
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={28} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Jinsi Inavyofanya Kazi</Text>
              <Text style={styles.infoDescription}>
                • Ingiza nambari ya rafiki yako{'\n'}
                • Thibitisha nambari ni halali{'\n'}
                • Tumia ili upate alama za ziada{'\n'}
                • Rafiki yako pia atapata alama za ziada!
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    textTransform: 'uppercase',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  successText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.md,
  },
  verifyBtn: {
    marginTop: spacing.sm,
  },
  applyBtn: {
    marginTop: spacing.xs,
    ...shadows.md,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
