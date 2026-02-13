'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, ImagePlus, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'media';
const PRODUCTS_PREFIX = 'products';

type VariantOption = { id: string; value_sw: string; value_en?: string; attribute_id: string };
type VariantAttribute = { id: string; name_sw: string; name_en?: string };
type VariantValue = { option_id: string; attribute_id: string };
type VariantImage = { id?: string; url: string; sort_order: number; file?: File };
type Variant = {
  id?: string;
  sku: string;
  price_tzs: string;
  compare_at_price_tzs: string;
  cost_tzs: string;
  quantity: string;
  is_active: boolean;
  values: VariantValue[];
  images: VariantImage[];
};

type Props = { productId: string; productImages?: Array<{ id?: string; url: string; sort_order: number }> };

export default function ProductVariants({ productId, productImages = [] }: Props) {
  const [attributes, setAttributes] = useState<VariantAttribute[]>([]);
  const [optionsByAttribute, setOptionsByAttribute] = useState<Record<string, VariantOption[]>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageSelector, setShowImageSelector] = useState<{ variantIndex: number; show: boolean }>({ variantIndex: -1, show: false });
  const [productSKU, setProductSKU] = useState<string>('');

  // Fetch product SKU
  useEffect(() => {
    if (!productId || productId === 'new') return;
    supabase
      .from('products')
      .select('sku')
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        if (data) setProductSKU(data.sku || '');
      });
  }, [productId]);

  // Generate variant SKU
  const generateVariantSKU = (variant: Variant, baseSKU: string, variantIndex: number): string => {
    if (variant.sku && variant.sku.trim()) return variant.sku.trim();
    if (!baseSKU) baseSKU = 'VAR';
    
    // Get variant option values
    const optionValues: string[] = [];
    variant.values.forEach((val) => {
      const attr = attributes.find((a) => a.id === val.attribute_id);
      const opt = optionsByAttribute[val.attribute_id]?.find((o) => o.id === val.option_id);
      if (opt) {
        const value = opt.value_sw || opt.value_en || '';
        optionValues.push(value.slice(0, 3).toUpperCase());
      }
    });
    
    const variantPart = optionValues.length > 0 ? optionValues.join('-') : `V${variantIndex + 1}`;
    return `${baseSKU}-${variantPart}`;
  };

  useEffect(() => {
    Promise.all([
      supabase.from('product_variant_attributes').select('*').order('sort_order'),
      supabase.from('product_variant_options').select('*').order('sort_order'),
    ]).then(([attrs, opts]) => {
      if (attrs.data) setAttributes(attrs.data);
      if (opts.data) {
        const grouped: Record<string, VariantOption[]> = {};
        opts.data.forEach((opt: any) => {
          if (!grouped[opt.attribute_id]) grouped[opt.attribute_id] = [];
          grouped[opt.attribute_id].push(opt);
        });
        setOptionsByAttribute(grouped);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!productId || productId === 'new') return;
    Promise.all([
      supabase
        .from('product_variants')
        .select(`
          id, sku, price_tzs, compare_at_price_tzs, cost_tzs, quantity, is_active,
          product_variant_values(option_id, product_variant_options(attribute_id))
        `)
        .eq('product_id', productId),
      supabase
        .from('variant_images')
        .select('variant_id, id, url, sort_order')
        .in('variant_id', []),
    ]).then(([variantsRes, imagesRes]) => {
      if (variantsRes.data) {
        const variantIds = variantsRes.data.map((v: any) => v.id);
        supabase
          .from('variant_images')
          .select('variant_id, id, url, sort_order')
          .in('variant_id', variantIds)
          .order('sort_order')
          .then(({ data: imagesData }) => {
            const imagesByVariant: Record<string, VariantImage[]> = {};
            (imagesData || []).forEach((img: any) => {
              if (!imagesByVariant[img.variant_id]) imagesByVariant[img.variant_id] = [];
              imagesByVariant[img.variant_id].push({
                id: img.id,
                url: img.url,
                sort_order: img.sort_order,
              });
            });
            setVariants(
              variantsRes.data.map((v: any) => ({
                id: v.id,
                sku: v.sku ?? '',
                price_tzs: String(v.price_tzs ?? ''),
                compare_at_price_tzs: v.compare_at_price_tzs != null ? String(v.compare_at_price_tzs) : '',
                cost_tzs: v.cost_tzs != null ? String(v.cost_tzs) : '',
                quantity: String(v.quantity ?? 0),
                is_active: v.is_active ?? true,
                values: (v.product_variant_values ?? []).map((vv: any) => ({
                  option_id: vv.option_id,
                  attribute_id: vv.product_variant_options?.attribute_id ?? '',
                })),
                images: imagesByVariant[v.id] || [],
              }))
            );
          });
      }
    });
  }, [productId]);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: '',
        price_tzs: '',
        compare_at_price_tzs: '',
        cost_tzs: '',
        quantity: '0',
        is_active: true,
        values: [],
        images: [],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const toggleVariantValue = (variantIndex: number, optionId: string, attributeId: string) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const existing = v.values.find((val) => val.option_id === optionId);
        if (existing) {
          return { ...v, values: v.values.filter((val) => val.option_id !== optionId) };
        }
        return { ...v, values: [...v.values, { option_id: optionId, attribute_id: attributeId }] };
      })
    );
  };

  const addVariantImage = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const toAdd: VariantImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const variant = variants[variantIndex];
      toAdd.push({ url: '', sort_order: variant.images.length + toAdd.length, file });
    }
    if (toAdd.length) {
      setVariants((prev) =>
        prev.map((v, i) => (i === variantIndex ? { ...v, images: [...v.images, ...toAdd] } : v))
      );
    }
    e.target.value = '';
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, images: v.images.filter((_, idx) => idx !== imageIndex).map((img, idx) => ({ ...img, sort_order: idx })) }
          : v
      )
    );
  };

  const addProductImageToVariant = (variantIndex: number, imageUrl: string) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, images: [...v.images, { url: imageUrl, sort_order: v.images.length }] }
          : v
      )
    );
    setShowImageSelector({ variantIndex: -1, show: false });
  };

  const saveVariants = async () => {
    if (!productId || productId === 'new') return;
    try {
      // Delete existing variants (cascade will delete images and values)
      await supabase.from('product_variants').delete().eq('product_id', productId);
      // Insert new variants
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.price_tzs) continue;
        const generatedSKU = generateVariantSKU(variant, productSKU, i);
        const { data: vData, error: vErr } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: variant.sku && variant.sku.trim() ? variant.sku.trim() : generatedSKU,
            price_tzs: Number(variant.price_tzs),
            compare_at_price_tzs: variant.compare_at_price_tzs ? Number(variant.compare_at_price_tzs) : null,
            cost_tzs: variant.cost_tzs ? Number(variant.cost_tzs) : null,
            quantity: Number(variant.quantity) || 0,
            is_active: variant.is_active,
          })
          .select('id')
          .single();
        if (vErr) throw vErr;
        if (vData && variant.values.length > 0) {
          await supabase.from('product_variant_values').insert(
            variant.values.map((val) => ({ variant_id: vData.id, option_id: val.option_id }))
          );
        }
        // Save variant images
        if (vData && variant.images.length > 0) {
          const imageUrls: string[] = [];
          for (let i = 0; i < variant.images.length; i++) {
            const img = variant.images[i];
            if (img.file) {
              try {
                const ext = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${PRODUCTS_PREFIX}/${productId}/variants/${vData.id}/${crypto.randomUUID()}.${ext}`;
                const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, img.file, {
                  contentType: img.file.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
                  upsert: true,
                });
                if (upErr) throw upErr;
                const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
                imageUrls.push(urlData.publicUrl);
              } catch (err: any) {
                console.error(`Failed to upload image ${i + 1}:`, err);
              }
            } else if (img.url) {
              imageUrls.push(img.url);
            }
          }
          if (imageUrls.length > 0) {
            await supabase.from('variant_images').insert(
              imageUrls.map((url, i) => ({ variant_id: vData.id, url, sort_order: i }))
            );
          }
        }
      }
      alert('Variants zimehifadhiwa.');
    } catch (e: any) {
      alert(`Failed to save variants: ${e.message}`);
    }
  };

  if (loading) return <div className="text-slate-500">Loading variants...</div>;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Variants (Ukubwa, Rangi, n.k.)</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ongeza variants za bidhaa (k.m. Size: L, Color: Red) na bei tofauti</p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" /> Add variant
        </button>
      </div>
      {variants.length === 0 ? (
        <p className="text-sm text-slate-500">Hakuna variants. Bofya &quot;Add variant&quot; kuongeza.</p>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Variant {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-600 hover:text-red-700"
                  aria-label="Remove variant"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600">SKU</label>
                  <p className="text-xs text-slate-400 mb-1">SKU itajitengeneza kiotomatiki</p>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    placeholder={generateVariantSKU(variant, productSKU, index)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Price (TZS) *</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.price_tzs}
                    onChange={(e) => updateVariant(index, 'price_tzs', e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Compare at (TZS)</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.compare_at_price_tzs}
                    onChange={(e) => updateVariant(index, 'compare_at_price_tzs', e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Was"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.quantity}
                    onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Chagua attributes (Size, Color, n.k.)</label>
                <div className="space-y-3">
                  {attributes.map((attr) => {
                    const options = optionsByAttribute[attr.id] ?? [];
                    return (
                      <div key={attr.id} className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide">
                          {attr.name_sw || attr.name_en}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {options.map((opt) => {
                            const isSelected = variant.values.some((v) => v.option_id === opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleVariantValue(index, opt.id, attr.id)}
                                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                {opt.value_sw || opt.value_en}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Picha za Variant</label>
                <p className="mb-2 text-xs text-slate-500">Chagua picha kutoka product images au pakia picha mpya</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {productImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowImageSelector({ variantIndex: index, show: !showImageSelector.show || showImageSelector.variantIndex !== index })}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                    >
                      <ImagePlus className="h-4 w-4" /> Chagua kutoka Product Images
                    </button>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-4 w-4" /> Upload images mpya
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => addVariantImage(index, e)}
                      aria-label="Upload variant images"
                    />
                  </label>
                </div>
                {showImageSelector.show && showImageSelector.variantIndex === index && productImages.length > 0 && (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Chagua picha kutoka product images:</span>
                      <button
                        type="button"
                        onClick={() => setShowImageSelector({ variantIndex: -1, show: false })}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Funga
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {productImages.map((prodImg) => {
                        const isAlreadyAdded = variant.images.some((img) => img.url === prodImg.url);
                        return (
                          <button
                            key={prodImg.id || prodImg.url}
                            type="button"
                            onClick={() => !isAlreadyAdded && addProductImageToVariant(index, prodImg.url)}
                            disabled={isAlreadyAdded}
                            className={`relative rounded-lg border-2 overflow-hidden ${
                              isAlreadyAdded
                                ? 'border-slate-300 opacity-50 cursor-not-allowed'
                                : 'border-slate-300 hover:border-primary cursor-pointer'
                            }`}
                          >
                            <img src={prodImg.url} alt="Product image" className="h-16 w-full object-cover" />
                            {isAlreadyAdded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <span className="text-xs text-white font-medium">Added</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {variant.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {variant.images.map((img, imgIndex) => (
                      <div key={img.id ?? `img-${imgIndex}`} className="group relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                        {img.url && !img.file ? (
                          <img src={img.url} alt={`Variant image ${imgIndex + 1}`} className="h-24 w-full object-cover" />
                        ) : img.file ? (
                          <div className="flex h-24 items-center justify-center bg-slate-100">
                            <span className="text-xs text-slate-500">{img.file.name}</span>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeVariantImage(index, imgIndex)}
                          className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`variant-active-${index}`}
                  checked={variant.is_active}
                  onChange={(e) => updateVariant(index, 'is_active', e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor={`variant-active-${index}`} className="text-xs text-slate-700">
                  Active
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={saveVariants}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Save variants
          </button>
        </div>
      )}
    </div>
  );
}
