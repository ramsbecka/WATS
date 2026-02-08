import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { getLoyaltyBalance } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

function maskPhone(phone: string) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-4);
}

export default function Profile() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getLoyaltyBalance(user.id).then(setLoyaltyPoints);
  }, [user?.id]);

  const handleSignOut = () => {
    signOut().then(() => router.replace('/login'));
  };

  if (!user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My account</Text>
          <Text style={styles.subtitle}>Sign in to view your profile</Text>
        </View>
        <View style={styles.content}>
          <Button title="Sign in" onPress={() => router.push('/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>My account</Text>
        <Text style={styles.subtitle}>Account details</Text>
      </View>
      <View style={styles.content}>
        {loyaltyPoints !== null && (
          <Card style={styles.loyaltyCard}>
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
            <View style={styles.loyaltyText}>
              <Text style={styles.loyaltyLabel}>Loyalty points</Text>
              <Text style={styles.loyaltyValue}>{loyaltyPoints.toLocaleString()} points</Text>
            </View>
          </Card>
        )}
        <Pressable onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.linkCard, pressed && { opacity: 0.9 }]}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          <Text style={styles.linkText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Card style={styles.card}>
          {profile && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{maskPhone(profile.phone)}</Text>
              </View>
              {profile.display_name && (
                <View style={[styles.row, styles.rowBorder]}>
                  <Text style={styles.label}>Name</Text>
                  <Text style={styles.value}>{profile.display_name}</Text>
                </View>
              )}
            </>
          )}
        </Card>
        <Button title="Sign out" onPress={handleSignOut} variant="outline" style={styles.logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, alignItems: 'center', paddingBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: 100 },
  loyaltyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, marginBottom: spacing.md },
  loyaltyText: { flex: 1 },
  loyaltyLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  loyaltyValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 14, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  linkText: { flex: 1, ...typography.body, color: colors.textPrimary },
  card: { padding: 0, marginBottom: spacing.xl },
  row: { padding: spacing.lg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  logout: {},
});
