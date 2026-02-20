import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';
import { colors, spacing, typography, radius } from '@/theme/tokens';

const SIDEBAR_WIDTH = 240;

const navItems = [
  { name: 'Home', route: '/(tabs)', icon: 'home' as const },
  { name: 'Products', route: '/(tabs)/products', icon: 'grid' as const },
  { name: 'Cart', route: '/(tabs)/cart', icon: 'cart' as const },
  { name: 'Orders', route: '/(tabs)/orders', icon: 'list' as const },
  { name: 'Profile', route: '/(tabs)/profile', icon: 'person' as const },
];

export function WebSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.count());

  const isActive = (route: string) => {
    if (route === '/(tabs)') return pathname === '/(tabs)' || pathname === '/(tabs)/';
    return pathname.startsWith(route);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoBlock}>
        <Text style={styles.logo}>WATS</Text>
        <Text style={styles.tagline}>Shop Tanzania</Text>
      </View>
      <View style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.route);
          const showBadge = item.route === '/(tabs)/cart' && cartCount > 0;
          return (
            <Pressable
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.name}</Text>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    ...(Platform.OS === 'web' ? { 
      minHeight: '100vh',
      height: '100vh',
      position: 'fixed' as any,
      left: 0,
      top: 0,
      zIndex: 100,
    } : {}),
  },
  logoBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nav: {
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
    gap: spacing.md,
  },
  navItemActive: {
    backgroundColor: colors.primary + '14',
  },
  navLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
