import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { getReferralCode, getReferralStats } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import * as Clipboard from 'expo-clipboard';

export default function InviteFriend() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const code = await getReferralCode(user.id);
      setReferralCode(code);
      const referralStats = await getReferralStats(user.id);
      setStats(referralStats);
    } catch (e: any) {
      console.error('Failed to load referral code:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { load(); }, [user]));

  const handleCopyCode = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    if (!referralCode) return;
    const message = `Join me on WATS! Use my referral code: ${referralCode} and get ${stats?.referred_bonus_points || 50} bonus points!`;
    try {
      await Share.share({ message });
    } catch (e: any) {
      console.error('Failed to share:', e);
    }
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Invite Friend</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to invite friends</Text>
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Invite Friend</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading...</Text>
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
        <Text style={styles.title}>Invite Friend</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Pressable onPress={handleCopyCode} style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.codeHint}>Tap to copy</Text>
        </Card>

        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Benefits</Text>
          <View style={styles.benefitRow}>
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
            <View style={styles.benefitText}>
              <Text style={styles.benefitLabel}>Your Friend Gets</Text>
              <Text style={styles.benefitValue}>
                {stats?.referred_bonus_points || 50} Bonus Points
              </Text>
            </View>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <View style={styles.benefitText}>
              <Text style={styles.benefitLabel}>You Get</Text>
              <Text style={styles.benefitValue}>
                {stats?.referral_bonus_points || 100} Bonus Points
              </Text>
            </View>
          </View>
        </Card>

        {stats && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_referrals || 0}</Text>
                <Text style={styles.statLabel}>Total Referrals</Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color={colors.surface} />
            <Text style={styles.shareBtnText}>Share Referral Code</Text>
          </Pressable>
        </View>
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
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
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
  codeCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  codeText: {
    ...typography.heading,
    fontSize: 28,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  codeHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  benefitsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  benefitsTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  benefitLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  benefitValue: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    fontSize: 32,
    color: colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  shareBtnText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
});
