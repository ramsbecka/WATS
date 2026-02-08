import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getProduct, isInWishlist, addToWishlist, removeFromWishlist } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { getOrCreateCart, addCartItem } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);

  const loadProduct = () => {
    if (!id) { setError('Product not found'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    getProduct(id)
      .then(setProduct)
      .catch((e: any) => setError(e?.message ?? 'Failed to load product.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    isInWishlist(user.id, id).then(setInWishlist);
  }, [user, id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert(
        'Sign in to add to cart',
        'You need to sign in to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/login') },
        ]
      );
      return;
    }
    setAdding(true);
    try {
      const cartId = await getOrCreateCart(user.id);
      await addCartItem(cartId, product.id, qty);
      addItem({
        product_id: product.id,
        quantity: qty,
        product: {
          name_sw: product.name_sw,
          name_en: product.name_en,
          price_tzs: product.price_tzs,
          product_images: product.product_images,
        },
      });
      router.push('/(tabs)/cart');
    } catch (e: any) {
      Alert.alert('Add to cart failed', e?.message ?? 'Could not add to cart. Try again.');
    } finally {
      setAdding(false);
    }
  };

  if (loading && !product) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || (!loading && !product)) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <Button title="Retry" onPress={loadProduct} variant="outline" style={styles.retryBtn} />
          <Button title="Back" onPress={() => router.back()} variant="outline" style={styles.retryBtn} />
        </View>
      </Screen>
    );
  }

  const img = product.product_images?.[0]?.url;
  const name = product.name_sw ?? product.name_en ?? '';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imgWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]}>
              <Ionicons name="image-outline" size={64} color={colors.textMuted} />
            </View>
          )}
          {user && (
            <Pressable
              onPress={async () => {
                if (!user) return;
                setInWishlist((prev) => !prev);
                try {
                  if (inWishlist) await removeFromWishlist(user.id, product.id);
                  else await addToWishlist(user.id, product.id);
                } catch (_) {
                  setInWishlist((prev) => !prev);
                }
              }}
              style={styles.wishlistBtn}
            >
              <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={26} color={inWishlist ? colors.error : colors.surface} />
            </Pressable>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>TZS {Number(product.price_tzs).toLocaleString()}</Text>
          </View>
          {(product.description_sw || product.description_en) && (
            <Text style={styles.desc}>{product.description_sw ?? product.description_en}</Text>
          )}
          <Card style={styles.qtyCard}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => setQty((x) => Math.max(1, x - 1))}
                style={({ pressed }) => [styles.qtyBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="remove" size={22} color={colors.primary} />
              </Pressable>
              <Text style={styles.qtyVal}>{qty}</Text>
              <Pressable
                onPress={() => setQty((x) => x + 1)}
                style={({ pressed }) => [styles.qtyBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            </View>
          </Card>
          <Button
            title="Add to cart"
            onPress={handleAddToCart}
            loading={adding}
            style={styles.addBtn}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  imgWrap: { backgroundColor: colors.borderLight, position: 'relative' },
  img: { width: '100%', aspectRatio: 1 },
  wishlistBtn: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  name: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  priceRow: { marginBottom: spacing.md },
  price: { ...typography.hero, fontSize: 24, color: colors.primary },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  qtyCard: { padding: spacing.md, marginBottom: spacing.lg },
  qtyLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: { ...typography.heading, minWidth: 32, textAlign: 'center' },
  addBtn: { marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { marginTop: 8 },
});
