import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';
import { useIsWeb } from '@/hooks/useIsWeb';
import { WebSidebar } from '@/components/layout/WebSidebar';
import { colors } from '@/theme/tokens';

const WEB_SIDEBAR_WIDTH = 240;

export default function TabsLayout() {
  const cartCount = useCartStore((s) => s.count());
  const isWeb = useIsWeb();

  return (
    <View style={isWeb ? styles.webContainer : undefined}>
      {isWeb && <WebSidebar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: isWeb
            ? { display: 'none', height: 0 }
            : { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          sceneStyle: isWeb ? { marginLeft: WEB_SIDEBAR_WIDTH, flex: 1 } : undefined,
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
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
});
