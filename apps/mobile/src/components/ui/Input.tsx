import { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '@/theme/tokens';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  /** When true, shows an eye icon to toggle password visibility */
  passwordToggle?: boolean;
};

export function Input({ label, error, style, passwordToggle, secureTextEntry, ...props }: InputProps) {
  const [hidden, setHidden] = useState(true);
  const isPassword = passwordToggle ?? secureTextEntry;
  const secure = isPassword ? (passwordToggle ? hidden : secureTextEntry) : secureTextEntry;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, error && styles.inputError, style, passwordToggle && styles.inputWithIcon]}
          secureTextEntry={secure}
          {...props}
        />
        {passwordToggle && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4 },
});
