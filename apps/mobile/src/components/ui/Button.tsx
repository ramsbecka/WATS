import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme/tokens';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const variants = {
  primary: {
    bg: colors.primary,
    text: colors.onPrimary,
    border: 'transparent',
    shadow: true,
  },
  secondary: {
    bg: colors.surface,
    text: colors.primary,
    border: colors.border,
    shadow: true,
  },
  ghost: {
    bg: 'transparent',
    text: colors.primary,
    border: 'transparent',
    shadow: false,
  },
  outline: {
    bg: 'transparent',
    text: colors.primary,
    border: colors.primary,
    shadow: false,
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const v = variants[variant];
  const isLarge = size === 'lg';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: v.bg,
          borderWidth: v.border === 'transparent' ? 0 : 2,
          borderColor: v.border === 'transparent' ? undefined : v.border,
          paddingVertical: isLarge ? 16 : 14,
          paddingHorizontal: isLarge ? 32 : 24,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || disabled ? 0.8 : 1,
          minHeight: isLarge ? 52 : 48,
          ...(v.shadow ? shadows.md : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text
          style={[
            {
              color: v.text,
              fontSize: isLarge ? 16 : 15,
              fontWeight: '600',
              letterSpacing: 0.2,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
