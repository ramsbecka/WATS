import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Pressable, Alert, FlatList, Dimensions, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getProduct, isInWishlist, addToWishlist, removeFromWishlist, getProductReviews, getProductRating, submitReview } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { getOrCreateCart, addCartItem } from '@/api/client';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import { trackProductView, trackAddToCart } from '@/services/ai';

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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({}); // attribute_id -> option_id
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState({ average_rating: 0, total_reviews: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

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
    if (id) {
      getProductReviews(id).then(setReviews);
      getProductRating(id).then(setRating);
      // Track recently viewed
      if (user?.id) {
        import('@/api/client').then(({ addToRecentlyViewed }) => {
          addToRecentlyViewed(user.id, id).catch(() => {
            // Silently handle errors
          });
        });
      }
    }
  }, [id, user?.id]);

  // Track product view with analytics
  useEffect(() => {
    if (product) {
      trackProductView(product.id, product.name_en || 'Product');
    }
  }, [product?.id]);

  useEffect(() => {
    if (!user || !id) return;
    isInWishlist(user.id, id).then(setInWishlist);
  }, [user, id]);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedOptions({});
    setSelectedVariant(null);
  }, [id]);

  // Reset image index when variant changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant]);

  // Group variant values by attribute
  const getVariantDisplayName = (variant: any) => {
    if (!variant?.product_variant_values || variant.product_variant_values.length === 0) return 'Default';
    const values = variant.product_variant_values.map((vv: any) => {
      const opt = vv.product_variant_options;
      return opt?.value_en || '';
    });
    return values.join(' / ');
  };

  // Organize variants by attributes
  const getAttributesWithOptions = () => {
    if (!product?.product_variants || product.product_variants.length === 0) return [];
    const variants = product.product_variants;
    const attributesMap = new Map<string, { attribute: any; options: Set<string> }>();
    
    variants.filter((v: any) => v.is_active).forEach((variant: any) => {
      if (!variant.product_variant_values) return;
      variant.product_variant_values.forEach((vv: any) => {
        const opt = vv.product_variant_options;
        if (!opt) return;
        const attr = opt.product_variant_attributes;
        if (!attr) return;
        
        const attrId = attr.id;
        if (!attributesMap.has(attrId)) {
          attributesMap.set(attrId, {
            attribute: attr,
            options: new Set(),
          });
        }
        const optionId = opt.id;
        attributesMap.get(attrId)!.options.add(optionId);
      });
    });

    return Array.from(attributesMap.entries()).map(([attrId, data]) => {
      const options = Array.from(data.options).map((optionId) => {
        // Find option details from any variant
        for (const variant of variants) {
          if (!variant.product_variant_values) continue;
          for (const vv of variant.product_variant_values) {
            const opt = vv.product_variant_options;
            if (opt && opt.id === optionId) {
              return opt;
            }
          }
        }
        return null;
      }).filter(Boolean);

      return {
        attribute: data.attribute,
        options: options.sort((a: any, b: any) => {
          const aVal = a?.value_en || '';
          const bVal = b?.value_en || '';
          return aVal.localeCompare(bVal);
        }),
      };
    }).sort((a, b) => {
      const aName = a.attribute.name_en || '';
      const bName = b.attribute.name_en || '';
      return aName.localeCompare(bName);
    });
  };

  // Find variant matching selected options
  const findMatchingVariant = (selections: Record<string, string>) => {
    if (!product?.product_variants || Object.keys(selections).length === 0) return null;
    const variants = product.product_variants;
    const selectedOptionIds = Object.values(selections);
    
    return variants.find((variant: any) => {
      if (!variant.is_active || !variant.product_variant_values) return false;
      const variantOptionIds = variant.product_variant_values.map((vv: any) => vv.product_variant_options?.id).filter(Boolean);
      
      // Check if all selected options are in this variant AND variant has same number of options as selections
      // This ensures exact match - variant must have exactly the same options as selected
      if (selectedOptionIds.length !== variantOptionIds.length) return false;
      return selectedOptionIds.every((id) => variantOptionIds.includes(id)) && 
             variantOptionIds.every((id) => selectedOptionIds.includes(id));
    });
  };

  // Auto-select variant when all required attributes are selected
  useEffect(() => {
    if (!product?.product_variants || !product.product_variants.length) {
      if (selectedVariant) setSelectedVariant(null);
      return;
    }
    
    const allAttributes = getAttributesWithOptions();
    if (allAttributes.length === 0) {
      if (selectedVariant) setSelectedVariant(null);
      return;
    }
    
    const allSelected = allAttributes.every((attr) => selectedOptions[attr.attribute.id]);
    
    if (allSelected) {
      const matchingVariant = findMatchingVariant(selectedOptions);
      if (matchingVariant) {
        if (matchingVariant.id !== selectedVariant) {
          setSelectedVariant(matchingVariant.id);
        }
      } else if (selectedVariant) {
        // Clear selection if no match found
        setSelectedVariant(null);
      }
    } else if (selectedVariant) {
      // Clear selection if not all attributes are selected
      setSelectedVariant(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions, product?.product_variants]);

  // Check if option is available with current selections
  const isOptionAvailable = (attributeId: string, optionId: string) => {
    if (!product?.product_variants) return true;
    const variants = product.product_variants;
    const currentSelections = { ...selectedOptions, [attributeId]: optionId };
    
    // Check if there's any variant that matches these selections
    return variants.some((variant: any) => {
      if (!variant.is_active || !variant.product_variant_values) return false;
      const variantOptionIds = variant.product_variant_values.map((vv: any) => vv.product_variant_options?.id).filter(Boolean);
      const selectedOptionIds = Object.values(currentSelections);
      
      // Check if all selected options are in this variant
      return selectedOptionIds.every((id) => variantOptionIds.includes(id));
    });
  };

  // Handle option selection
  const handleOptionSelect = (attributeId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const newSelections = { ...prev, [attributeId]: optionId };
      
      // Find matching variant
      const matchingVariant = findMatchingVariant(newSelections);
      
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.id);
      } else {
        setSelectedVariant(null);
      }
      
      return newSelections;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert(
        'Sign in to add to cart',
        'You need to sign in to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
    const variants = product.product_variants || [];
    if (variants.length > 0) {
      // Check if variant is selected
      if (!selectedVariant) {
        const allAttributes = getAttributesWithOptions();
        const missingAttributes = allAttributes.filter((attr) => !selectedOptions[attr.attribute.id]);
        if (missingAttributes.length > 0) {
          const missingNames = missingAttributes.map((attr) => attr.attribute.name_en || '').join(', ');
          Alert.alert('Choose variant', `Please select: ${missingNames}`);
          return;
        }
        
        // Try to find matching variant one more time
        const matchingVariant = findMatchingVariant(selectedOptions);
        if (matchingVariant && matchingVariant.is_active) {
          // Use the matching variant directly
          const variant = matchingVariant;
          const price = variant.price_tzs;
          setAdding(true);
          try {
            const cartId = await getOrCreateCart(user.id);
            await addCartItem(cartId, product.id, qty, variant.id);
            addItem({
              product_id: product.id,
              variant_id: variant.id,
              quantity: qty,
              product: {
                name_en: product.name_en,
                price_tzs: price,
                product_images: product.product_images,
              },
            });
            // Track analytics
            trackAddToCart(product.id, product.name_en || 'Product', Number(price) * qty);
            router.push('/(tabs)/cart');
          } catch (e: any) {
            Alert.alert('Add to cart failed', e?.message ?? 'Could not add to cart. Try again.');
          } finally {
            setAdding(false);
          }
          return;
        } else {
          Alert.alert('Choose variant', 'Selected variant is no longer available. Please choose again.');
          return;
        }
      }
      
      // Verify selected variant exists and is active
      const selectedVariantObj = variants.find((v: any) => v.id === selectedVariant);
      if (!selectedVariantObj || !selectedVariantObj.is_active) {
        Alert.alert('Invalid variant', 'Please choose another variant.');
        setSelectedVariant(null);
        return;
      }
    }
    setAdding(true);
    try {
      const cartId = await getOrCreateCart(user.id);
      const variant = variants.find((v: any) => v.id === selectedVariant);
      const price = variant ? variant.price_tzs : product.price_tzs;
      await addCartItem(cartId, product.id, qty, selectedVariant || undefined);
      addItem({
        product_id: product.id,
        variant_id: selectedVariant || undefined,
        quantity: qty,
        product: {
          name_en: product.name_en,
          price_tzs: price,
          product_images: product.product_images,
        },
      });
      // Track analytics
      trackAddToCart(product.id, product.name_en || 'Product', Number(price) * qty);
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

  const productImages = product?.product_images || [];
  const variants = product?.product_variants || [];
  const selectedVariantData = variants.find((v: any) => v.id === selectedVariant);
  
  // Use variant images if variant is selected, otherwise use product images
  const displayImages = selectedVariantData?.variant_images && selectedVariantData.variant_images.length > 0
    ? selectedVariantData.variant_images.sort((a: any, b: any) => a.sort_order - b.sort_order)
    : productImages;
  
  const img = displayImages[selectedImageIndex]?.url || displayImages[0]?.url;
  const name = product?.name_en ?? '';
  const displayPrice = selectedVariantData ? selectedVariantData.price_tzs : product?.price_tzs || 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imgWrap}>
          {displayImages.length > 0 ? (
            <>
              <FlatList
                data={displayImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) => item.id || `img-${idx}`}
                onMomentumScrollEnd={(e) => {
                  const screenWidth = Dimensions.get('window').width;
                  const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setSelectedImageIndex(index);
                }}
                renderItem={({ item }) => {
                  const screenWidth = Dimensions.get('window').width;
                  return (
                    <Image source={{ uri: item.url }} style={[styles.img, { width: screenWidth }]} resizeMode="cover" />
                  );
                }}
                style={styles.imageCarousel}
              />
              {displayImages.length > 1 && (
                <View style={styles.imageIndicators}>
                  {displayImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.indicator,
                        selectedImageIndex === idx && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              {displayImages.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {selectedImageIndex + 1} / {displayImages.length}
                  </Text>
                </View>
              )}
            </>
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
            <Text style={styles.price}>TZS {Number(displayPrice).toLocaleString()}</Text>
            {selectedVariantData?.compare_at_price_tzs && selectedVariantData.compare_at_price_tzs > selectedVariantData.price_tzs && (
              <Text style={styles.comparePrice}>Was TZS {Number(selectedVariantData.compare_at_price_tzs).toLocaleString()}</Text>
            )}
            {!selectedVariantData && product.compare_at_price_tzs && product.compare_at_price_tzs > product.price_tzs && (
              <Text style={styles.comparePrice}>Was TZS {Number(product.compare_at_price_tzs).toLocaleString()}</Text>
            )}
          </View>
          {product.description_en && (
            <Text style={styles.desc}>{product.description_en}</Text>
          )}
          {variants.length > 0 && (
            <Card style={styles.variantCard}>
              <Text style={styles.variantLabel}>Choose variant</Text>
              {getAttributesWithOptions().map(({ attribute, options }) => {
                const currentSelectedOption = selectedOptions[attribute.id];
                return (
                  <View key={attribute.id} style={styles.attributeSection}>
                    <Text style={styles.attributeName}>
                      {attribute.name_en}
                    </Text>
                    <View style={styles.attributeOptions}>
                      {options.map((option: any) => {
                        const isSelected = currentSelectedOption === option.id;
                        const isAvailable = isOptionAvailable(attribute.id, option.id);
                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => {
                              if (isAvailable) {
                                handleOptionSelect(attribute.id, option.id);
                              }
                            }}
                            disabled={!isAvailable}
                            style={[
                              styles.optionBtn,
                              isSelected && styles.optionBtnSelected,
                              !isAvailable && styles.optionBtnDisabled,
                            ]}
                          >
                            <Text style={[
                              styles.optionBtnText,
                              isSelected && styles.optionBtnTextSelected,
                              !isAvailable && styles.optionBtnTextDisabled,
                            ]}>
                              {option.value_en}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
              {selectedVariant && (
                <View style={styles.selectedVariantInfo}>
                  <Text style={styles.selectedVariantText}>
                    Selected: {getVariantDisplayName(variants.find((v: any) => v.id === selectedVariant))}
                  </Text>
                  <Text style={styles.selectedVariantPrice}>
                    TZS {Number(variants.find((v: any) => v.id === selectedVariant)?.price_tzs || 0).toLocaleString()}
                  </Text>
                </View>
              )}
            </Card>
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

        {/* Reviews Section */}
        <Card style={styles.reviewsCard}>
          <View style={styles.ratingHeader}>
            <View>
              <Text style={styles.ratingValue}>{rating.average_rating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(rating.average_rating) ? 'star' : 'star-outline'}
                    size={16}
                    color={colors.warning || '#FFB800'}
                  />
                ))}
              </View>
              <Text style={styles.ratingCount}>({rating.total_reviews} reviews)</Text>
            </View>
            {user && (
              <Button
                title="Write Review"
                onPress={() => setShowReviewForm(true)}
                variant="outline"
                style={styles.reviewBtn}
              />
            )}
          </View>

          {showReviewForm && user && (
            <Card style={styles.reviewFormCard}>
              <Text style={styles.reviewFormTitle}>Rate this product</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setReviewRating(star)}>
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={32}
                      color={colors.warning || '#FFB800'}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.textArea}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Write your review..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  variant="outline"
                  style={styles.cancelBtn}
                />
                <Button
                  title="Submit"
                  onPress={async () => {
                    if (reviewRating === 0) {
                      Alert.alert('Required', 'Please select a rating.');
                      return;
                    }
                    try {
                      await submitReview(id!, null, reviewRating, reviewComment);
                      Alert.alert('Success', 'Review submitted. It will be reviewed by admin.');
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewComment('');
                      getProductReviews(id!).then(setReviews);
                      getProductRating(id!).then(setRating);
                    } catch (e: any) {
                      Alert.alert('Error', e?.message ?? 'Failed to submit review.');
                    }
                  }}
                  style={styles.submitBtn}
                />
              </View>
            </Card>
          )}

          {reviews.length > 0 && (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.profile?.display_name || 'Anonymous'}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={colors.warning || '#FFB800'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                  {review.review_images && review.review_images.length > 0 && (
                    <View style={styles.reviewImages}>
                      {review.review_images.map((img: any, idx: number) => (
                        <Image key={idx} source={{ uri: img.url }} style={styles.reviewImage} />
                      ))}
                    </View>
                  )}
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('sw-TZ')}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Product Features Section */}
        {product.product_features && product.product_features.length > 0 && (
          <Card style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Product details</Text>
            <View style={styles.featuresList}>
              {product.product_features.map((feature: any, idx: number) => {
                const title = feature.title_en || '';
                const description = feature.description_en || '';
                return (
                  <View key={feature.id || idx} style={styles.featureItem}>
                    {title ? <Text style={styles.featureTitle}>{title}</Text> : null}
                    {description ? <Text style={styles.featureDescription}>{description}</Text> : null}
                    {feature.media_url && (
                      <View style={styles.featureMedia}>
                        {feature.media_type === 'video' ? (
                          <Video
                            source={{ uri: feature.media_url }}
                            style={styles.featureVideo}
                            useNativeControls
                            resizeMode="contain"
                          />
                        ) : (
                          <Image source={{ uri: feature.media_url }} style={styles.featureImage} resizeMode="cover" />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  imgWrap: { backgroundColor: colors.borderLight, position: 'relative', width: '100%' },
  imageCarousel: { width: '100%', aspectRatio: 1 },
  img: { aspectRatio: 1 },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  wishlistBtn: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
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
  variantCard: { padding: spacing.md, marginBottom: spacing.lg },
  variantLabel: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md, fontWeight: '600' },
  attributeSection: { marginBottom: spacing.lg },
  attributeName: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', fontSize: 11 },
  attributeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionBtnDisabled: {
    opacity: 0.4,
    borderColor: colors.borderLight,
    backgroundColor: colors.borderLight,
  },
  optionBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '500' },
  optionBtnTextSelected: { color: colors.onPrimary || colors.surface, fontWeight: '700' },
  optionBtnTextDisabled: { color: colors.textMuted },
  selectedVariantInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  selectedVariantText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 4 },
  selectedVariantPrice: { ...typography.subheading, color: colors.primary, fontWeight: '600' },
  comparePrice: { ...typography.bodySmall, fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through', marginLeft: 8 },
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
  reviewsCard: { padding: spacing.lg, marginBottom: spacing.md },
  ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  ratingValue: { ...typography.hero, fontSize: 32, color: colors.primary },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  ratingCount: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  reviewBtn: { marginTop: 8 },
  reviewFormCard: { padding: spacing.md, marginTop: spacing.md, backgroundColor: colors.background },
  reviewFormTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  starsInput: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  formActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1 },
  reviewsList: { marginTop: spacing.md },
  reviewItem: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { ...typography.subheading, color: colors.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  reviewImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  reviewImage: { width: 60, height: 60, borderRadius: radius.sm },
  reviewDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  featuresCard: { padding: spacing.lg, marginBottom: spacing.md },
  featuresTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  featuresList: { gap: spacing.lg },
  featureItem: { marginBottom: spacing.md },
  featureTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  featureDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 22 },
  featureMedia: { marginTop: spacing.sm, borderRadius: radius.md, overflow: 'hidden' },
  featureImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.borderLight },
  featureVideo: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.borderLight },
});
