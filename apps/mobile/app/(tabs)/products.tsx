import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getProducts, getCategories } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import { trackEvent } from '@/services/ai';

export default function ProductsTab() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Load categories once (they're cached)
      if (categories.length === 0) {
        const cats = await getCategories(true);
        setCategories(cats);
      }
      
      // Load products
      const prods = await getProducts({ categoryId: categoryId ?? undefined, search: search || undefined, limit: 50 });
      setProducts(prods.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load products.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(false).finally(() => setRefreshing(false));
  };

  // Load categories on mount only
  useEffect(() => {
    getCategories(true).then(setCategories).catch(() => {
      // Silently handle errors
    });
  }, []);

  useEffect(() => { load(); }, [categoryId]);
  
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() || categoryId) {
        load();
      }
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>Choose what you need</Text>
        <Input
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <FlatList
          horizontal
          data={[{ id: null, name_sw: 'All' }, ...categories]}
          keyExtractor={(c) => c.id ?? 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, categoryId === item.id && styles.chipActive]}
              onPress={() => setCategoryId(item.id)}
            >
              <Text style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}>
                {item.name_sw ?? item.name_en ?? 'All'}
              </Text>
            </Pressable>
          )}
        />
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error || colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>No products found</Text>
          <Text style={[styles.errorText, { fontSize: 12, marginTop: 4 }]}>
            {search ? 'Try a different search term' : 'Products will appear here once added'}
          </Text>
        </View>
      ) : (
        <>
          {!categoryId && !search && (
            <ProductRecommendations categoryId={undefined} limit={10} />
          )}
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            renderItem={({ item }) => {
            const img = item.product_images?.[0]?.url;
            return (
              <Pressable
                style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.9 }]}
                onPress={() => router.push(`/products/${item.id}`)}
              >
                <Card style={styles.card}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.img} />
                  ) : (
                    <View style={[styles.img, styles.imgPlaceholder]}>
                      <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name_sw ?? item.name_en ?? 'Product'}
                    </Text>
                    <Text style={styles.price}>TZS {Number(item.price_tzs).toLocaleString()}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  search: { marginBottom: spacing.sm },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.onPrimary, fontWeight: '600' },
  grid: { padding: spacing.lg, paddingTop: 0, paddingBottom: 100 },
  gridRow: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1, maxWidth: '48%' },
  card: { overflow: 'hidden' },
  img: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.borderLight,
  },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md },
  name: { ...typography.bodySmall, color: colors.textPrimary, marginBottom: 4 },
  price: { ...typography.subheading, color: colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { ...typography.caption, color: colors.textSecondary, marginTop: 12 },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
  retryText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
});
