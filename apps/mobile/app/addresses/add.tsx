import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { addUserAddress } from '@/api/client';
import { colors, spacing, typography } from '@/theme/tokens';

export default function AddAddress() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: 'Home',
    recipient_name: '',
    recipient_phone: '',
    region: '',
    district: '',
    ward: '',
    street_address: '',
    is_default: false,
  });

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to add an address');
      return;
    }

    if (!form.recipient_name || !form.recipient_phone || !form.region || !form.district || !form.street_address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addUserAddress(user.id, form);
      Alert.alert('Success', 'Address added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Address</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Input
            label="Label"
            value={form.label}
            onChangeText={(text) => setForm({ ...form, label: text })}
            placeholder="e.g., Home, Work, Office"
            autoCapitalize="words"
          />

          <Input
            label="Recipient Name *"
            value={form.recipient_name}
            onChangeText={(text) => setForm({ ...form, recipient_name: text })}
            placeholder="Full name"
            autoCapitalize="words"
          />

          <Input
            label="Recipient Phone *"
            value={form.recipient_phone}
            onChangeText={(text) => setForm({ ...form, recipient_phone: text })}
            placeholder="e.g., +255 123 456 789"
            keyboardType="phone-pad"
          />

          <Input
            label="Region *"
            value={form.region}
            onChangeText={(text) => setForm({ ...form, region: text })}
            placeholder="e.g., Dar es Salaam"
            autoCapitalize="words"
          />

          <Input
            label="District *"
            value={form.district}
            onChangeText={(text) => setForm({ ...form, district: text })}
            placeholder="e.g., Kinondoni"
            autoCapitalize="words"
          />

          <Input
            label="Ward"
            value={form.ward}
            onChangeText={(text) => setForm({ ...form, ward: text })}
            placeholder="e.g., Mbezi"
            autoCapitalize="words"
          />

          <Input
            label="Street Address *"
            value={form.street_address}
            onChangeText={(text) => setForm({ ...form, street_address: text })}
            placeholder="House number, street name"
            autoCapitalize="words"
            multiline
            numberOfLines={3}
          />

          <View style={styles.checkboxContainer}>
            <Button
              variant={form.is_default ? 'primary' : 'outline'}
              onPress={() => setForm({ ...form, is_default: !form.is_default })}
              title={form.is_default ? 'Set as Default Address' : 'Set as Default Address'}
              style={styles.checkboxBtn}
            />
          </View>
        </Card>

        <Button
          title="Save Address"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
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
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  checkboxContainer: {
    marginTop: spacing.md,
  },
  checkboxBtn: {
    width: '100%',
  },
  saveBtn: {
    marginBottom: spacing.xl,
  },
});
