import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart';
import { useIsDesktopWeb } from '@/hooks/useIsWeb';
import { WebSidebar } from '@/components/layout/WebSidebar';
import { colors } from '@/theme/tokens';

const WEB_SIDEBAR_WIDTH = 240;

export default function TabsLayout() {
  const cartCount = useCartStore((s) => s.count());
  const isDesktopWeb = useIsDesktopWeb();
  const insets = useSafeAreaInsets();

  // Kwa mobile web na native, tumia tabs chini
  if (!isDesktopWeb) {
    // Calculate tab bar padding kwa safe area - ku-ensure tabs ziko juu ya system navigation bar
    const tabBarPaddingBottom = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8);
    
    return (
      <View style={styles.mobileContainer}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: { 
              backgroundColor: colors.surface, 
              borderTopColor: colors.border,
              borderTopWidth: 1,
              paddingBottom: tabBarPaddingBottom,
              paddingTop: 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              ...(Platform.OS === 'web' ? { 
                position: 'fixed' as any,
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1000,
              } : {}),
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            sceneStyle: { 
              flex: 1, 
              backgroundColor: colors.background,
              ...(Platform.OS === 'web' ? { 
                paddingBottom: 70, // Space for fixed tab bar
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
              } : {}),
            },
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

  // Kwa desktop web, tumia layout ya kawaida na sidebar
  return (
    <View style={styles.webContainer}>
      <WebSidebar />
      <View style={styles.webContent}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: { display: 'none', height: 0 },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            sceneStyle: { 
              flex: 1, 
              backgroundColor: colors.background,
              ...(Platform.OS === 'web' ? { 
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              } : {}),
            },
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
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { 
      minHeight: '100vh',
      height: '100vh',
      width: '100%',
      position: 'relative',
    } : {}),
  },
  webContent: {
    flex: 1,
    marginLeft: Platform.OS === 'web' ? WEB_SIDEBAR_WIDTH : 0,
    ...(Platform.OS === 'web' ? { 
      width: `calc(100% - ${WEB_SIDEBAR_WIDTH}px)`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    } : {}),
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { 
      minHeight: '100vh',
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    } : {}),
  },
});
