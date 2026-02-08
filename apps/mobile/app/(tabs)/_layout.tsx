import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';
import { colors, typography } from '@/theme/tokens';

export default function TabsLayout() {
  const cartCount = useCartStore((s) => s.count());
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
