'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ImagePlus, Trash2, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProductVariants from './ProductVariants';

const MEDIA_BUCKET = 'media';
const PRODUCTS_PREFIX = 'products';

type ImageRow = { id?: string; url: string; sort_order: number; file?: File };

type FeatureRow = {
  id?: string;
  title_en: string;
  description_en: string;
  media_type: 'image' | 'video' | '';
  media_url: string;
  sort_order: number;
  media_file?: File;
};

type Props = { id?: string };

export default function ProductEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>('');
  const [images, setImages] = useState<ImageRow[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [form, setForm] = useState({
    vendor_id: '',
    category_id: '',
    sku: '',
    name_en: '',
    description_en: '',
    price_tzs: '',
    compare_at_price_tzs: '',
    cost_tzs: '',
    is_active: true,
  });

  useEffect(() => {
    supabase.from('vendors').select('id, business_name').then(({ data }) => setVendors(data ?? []));
    // Load main categories (parent_id is null)
    supabase
      .from('categories')
      .select('id, name_en, parent_id')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order')
      .then(({ data }) => setMainCategories(data ?? []));
  }, []);

  useEffect(() => {
    // Load sub-categories when main category is selected
    if (selectedMainCategoryId) {
      supabase
        .from('categories')
        .select('id, name_en')
        .eq('is_active', true)
        .eq('parent_id', selectedMainCategoryId)
        .order('sort_order')
        .then(({ data }) => setSubCategories(data ?? []));
    } else {
      setSubCategories([]);
    }
  }, [selectedMainCategoryId]);

  useEffect(() => {
    // When category_id changes, find if it's a main category or sub-category
    if (form.category_id) {
      // Check if it's a main category
      const isMain = mainCategories.some(c => c.id === form.category_id);
      if (isMain) {
        setSelectedMainCategoryId(form.category_id);
      } else {
        // It's a sub-category, find its parent
        supabase
          .from('categories')
          .select('parent_id')
          .eq('id', form.category_id)
          .single()
          .then(({ data }) => {
            if (data?.parent_id) {
              setSelectedMainCategoryId(data.parent_id);
            }
          });
      }
    } else {
      setSelectedMainCategoryId('');
    }
  }, [form.category_id, mainCategories]);

  useEffect(() => {
    if (isNew || !id) return;
    Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_images').select('id, url, sort_order').eq('product_id', id).order('sort_order'),
      supabase.from('product_features').select('*').eq('product_id', id).order('sort_order'),
    ]).then(([prod, imgs, feats]) => {
      if (prod.data) {
        const categoryId = prod.data.category_id ?? '';
        setForm({
          vendor_id: prod.data.vendor_id ?? '',
          category_id: categoryId,
          sku: prod.data.sku ?? '',
          name_en: prod.data.name_en ?? '',
          description_en: prod.data.description_en ?? '',
          price_tzs: String(prod.data.price_tzs ?? ''),
          compare_at_price_tzs: prod.data.compare_at_price_tzs != null ? String(prod.data.compare_at_price_tzs) : '',
          cost_tzs: prod.data.cost_tzs != null ? String(prod.data.cost_tzs) : '',
          is_active: prod.data.is_active ?? true,
        });
        // Set main category if product has a category
        if (categoryId) {
          // Check if it's a main category or sub-category
          supabase
            .from('categories')
            .select('parent_id')
            .eq('id', categoryId)
            .single()
            .then(({ data }) => {
              if (data?.parent_id) {
                setSelectedMainCategoryId(data.parent_id);
              } else {
                setSelectedMainCategoryId(categoryId);
              }
            });
        }
      }
      setImages((imgs.data ?? []).map((r: any, i) => ({ id: r.id, url: r.url, sort_order: i })));
      setFeatures((feats.data ?? []).map((f: any, i) => ({
        id: f.id,
        title_en: f.title_en ?? '',
        description_en: f.description_en ?? '',
        media_type: f.media_type ?? '',
        media_url: f.media_url ?? '',
        sort_order: i,
      })));
      setLoading(false);
    });
  }, [id, isNew]);

  // Generate SKU from product name
  const generateSKU = (name: string, existingSKU?: string): string => {
    if (existingSKU && existingSKU.trim()) return existingSKU.trim();
    // Generate SKU from name: take first 3-4 letters of each word, uppercase, remove spaces
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return `PROD-${Date.now().toString().slice(-6)}`;
    const skuParts = words.slice(0, 3).map((word) => word.slice(0, 4).toUpperCase());
    const baseSKU = skuParts.join('-');
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSKU}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor_id) {
      alert('Please select a store (vendor).');
      return;
    }
    setSaving(true);
    try {
      const generatedSKU = generateSKU(form.name_en || 'Product', form.sku);
      const payload = {
        vendor_id: form.vendor_id,
        category_id: form.category_id || null,
        sku: generatedSKU,
        name_en: form.name_en,
        description_en: form.description_en || null,
        price_tzs: Number(form.price_tzs) || 0,
        compare_at_price_tzs: form.compare_at_price_tzs ? Number(form.compare_at_price_tzs) : null,
        cost_tzs: form.cost_tzs ? Number(form.cost_tzs) : null,
        is_active: form.is_active,
      };
      let productId = id as string;
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
      }
      const urls: string[] = [];
      const uploadErrors: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.file) {
          try {
            const ext = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${PRODUCTS_PREFIX}/${productId}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, img.file, {
              contentType: img.file.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
              upsert: true,
            });
            if (upErr) {
              uploadErrors.push(`Image ${i + 1}: ${upErr.message}`);
              continue;
            }
            const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
            urls.push(urlData.publicUrl);
          } catch (err: any) {
            uploadErrors.push(`Image ${i + 1}: ${err.message ?? 'Upload failed'}`);
          }
        } else if (img.url) {
          urls.push(img.url);
        }
      }
      if (uploadErrors.length > 0 && urls.length === 0) {
        throw new Error(`Upload zote zimeshindwa:\n${uploadErrors.join('\n')}`);
      }
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (urls.length > 0) {
        const { error: imgErr } = await supabase.from('product_images').insert(
          urls.map((url, i) => ({ product_id: productId, url, sort_order: i }))
        );
        if (imgErr) throw new Error(`Failed to save images: ${imgErr.message}`);
      }
      if (uploadErrors.length > 0) {
        alert(`Product saved, but some images failed to upload:\n${uploadErrors.join('\n')}`);
      }
      // Save product features
      await supabase.from('product_features').delete().eq('product_id', productId);
      const featureErrors: string[] = [];
      for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        if (!feat.title_en && !feat.description_en) continue;
        let mediaUrl = feat.media_url;
        if (feat.media_file) {
          try {
            const ext = feat.media_file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const isVideo = feat.media_file.type.startsWith('video/');
            const path = `${PRODUCTS_PREFIX}/${productId}/features/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, feat.media_file, {
              contentType: feat.media_file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
              upsert: true,
            });
            if (upErr) {
              featureErrors.push(`Feature ${i + 1}: ${upErr.message}`);
              continue;
            }
            const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
          } catch (err: any) {
            featureErrors.push(`Feature ${i + 1}: ${err.message ?? 'Upload failed'}`);
            continue;
          }
        }
        const { error: featErr } = await supabase.from('product_features').insert({
          product_id: productId,
          title_en: feat.title_en || null,
          description_en: feat.description_en || null,
          media_type: feat.media_type || null,
          media_url: mediaUrl || null,
          sort_order: i,
        });
        if (featErr) featureErrors.push(`Feature ${i + 1}: ${featErr.message}`);
      }
      if (featureErrors.length > 0) {
        alert(`Product saved, but some features failed to save:\n${featureErrors.join('\n')}`);
      }
      // After successful save, go back to products list
      router.push('/products');
    } catch (e: any) {
      alert(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, { url, sort_order: prev.length }]);
    setNewImageUrl('');
  };

  const addImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const toAdd: ImageRow[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      toAdd.push({ url: '', sort_order: images.length + toAdd.length, file });
    }
    if (toAdd.length) setImages((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i })));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const newImages = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newImages.length) return prev;
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      return newImages.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  const addFeature = () => {
    setFeatures((prev) => [
      ...prev,
      {
        title_en: '',
        description_en: '',
        media_type: '',
        media_url: '',
        sort_order: prev.length,
      },
    ]);
  };

  const updateFeature = (index: number, updates: Partial<FeatureRow>) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i })));
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    setFeatures((prev) => {
      const newFeatures = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFeatures.length) return prev;
      [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];
      return newFeatures.map((f, i) => ({ ...f, sort_order: i }));
    });
  };

  const handleFeatureMediaChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      alert('Please select image or video only.');
      return;
    }
    updateFeature(index, {
      media_type: isVideo ? 'video' : 'image',
      media_file: file,
      media_url: '',
    });
    e.target.value = '';
  };

  if (loading && !isNew) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{isNew ? 'New product' : 'Edit product'}</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Store <span className="text-red-500">*</span></label>
            <select
              aria-label="Duka"
              aria-required="true"
              value={form.vendor_id}
              onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select store</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.business_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category (Kundi kuu)</label>
            <select
              aria-label="Main Category"
              value={selectedMainCategoryId}
              onChange={(e) => {
                setSelectedMainCategoryId(e.target.value);
                setForm((f) => ({ ...f, category_id: e.target.value || '' }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">–</option>
              {mainCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Sub-category (Kundi) {selectedMainCategoryId && subCategories.length === 0 && <span className="text-xs text-slate-400">(hakuna sub-categories)</span>}
            </label>
            <select
              aria-label="Sub-category"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={!selectedMainCategoryId || subCategories.length === 0}
            >
              <option value="">{selectedMainCategoryId ? (subCategories.length > 0 ? 'Select sub-category' : 'No sub-categories') : 'Select category first'}</option>
              {selectedMainCategoryId && (
                <option value={selectedMainCategoryId}>Tumia main category</option>
              )}
              {subCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name_en}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label id="product-sku-label" className="block text-sm font-medium text-slate-700">SKU</label>
          <p className="mt-0.5 text-xs text-slate-500">SKU itajitengeneza kiotomatiki kutoka jina la bidhaa. Unaweza kuibadilisha kwa kujaza hapa.</p>
          <input
            id="product-sku"
            aria-labelledby="product-sku-label"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder={generateSKU(form.name_en || 'Product')}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label id="product-name_en-label" className="block text-sm font-medium text-slate-700">Name</label>
          <input
            id="product-name_en"
            aria-labelledby="product-name_en-label"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label id="product-price-label" className="block text-sm font-medium text-slate-700">Price (TZS)</label>
            <input
              id="product-price"
              type="number"
              min="0"
              aria-labelledby="product-price-label"
              value={form.price_tzs}
              onChange={(e) => setForm((f) => ({ ...f, price_tzs: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label id="product-compare-label" className="block text-sm font-medium text-slate-700">Compare at (TZS)</label>
            <input
              id="product-compare"
              type="number"
              min="0"
              aria-labelledby="product-compare-label"
              value={form.compare_at_price_tzs}
              onChange={(e) => setForm((f) => ({ ...f, compare_at_price_tzs: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Was"
            />
          </div>
          <div>
            <label id="product-cost-label" className="block text-sm font-medium text-slate-700">Cost (TZS)</label>
            <input
              id="product-cost"
              type="number"
              min="0"
              aria-labelledby="product-cost-label"
              value={form.cost_tzs}
              onChange={(e) => setForm((f) => ({ ...f, cost_tzs: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Cost"
            />
          </div>
        </div>
        <div>
          <label id="product-desc_en-label" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="product-desc_en"
            aria-labelledby="product-desc_en-label"
            value={form.description_en}
            onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="rounded border-slate-300"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
        </div>
        <div>
          <label id="product-images-label" className="block text-sm font-medium text-slate-700">Images (bucket: media)</label>
          <p className="mt-0.5 text-xs text-slate-500">Paste URL or upload image files; stored in Storage bucket &quot;media&quot;.</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id="product-images-url"
              type="url"
              aria-labelledby="product-images-label"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://..."
              className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <button type="button" onClick={addImage} className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5">
              <ImagePlus className="h-4 w-4" /> Add URL
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Upload image
              <input type="file" accept="image/*" multiple className="sr-only" onChange={addImageFiles} aria-label="Upload product image" />
            </label>
          </div>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, index) => (
                <div key={img.id ?? `f-${index}`} className="group relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                  {img.url && !img.file ? (
                    <img src={img.url} alt={`Product image ${index + 1}`} className="h-32 w-full object-cover" />
                  ) : img.file ? (
                    <div className="flex h-32 items-center justify-center bg-slate-100">
                      <span className="text-xs text-slate-500">{img.file.name}</span>
                    </div>
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="opacity-0 group-hover:opacity-100 rounded-full bg-red-600 p-1.5 text-white transition-opacity hover:bg-red-700"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute top-0 left-0 flex flex-col gap-1 p-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white flex items-center justify-between">
                    <span className="truncate">
                      {img.file ? (
                        <span className="text-yellow-300">Upload on save</span>
                      ) : (
                        <span className="truncate">{img.url}</span>
                      )}
                    </span>
                    <span className="ml-2 shrink-0 text-slate-300">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Features Section */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700">Product features</label>
              <p className="mt-0.5 text-xs text-slate-500">Add detailed product features with image/video</p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <ImagePlus className="h-4 w-4" /> Add Feature
            </button>
          </div>
          {features.length > 0 && (
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={feature.id ?? `f-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Feature #{index + 1}</span>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveFeature(index, 'up')}
                          className="rounded bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      )}
                      {index < features.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveFeature(index, 'down')}
                          className="rounded bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="rounded bg-red-100 p-1 text-red-600 hover:bg-red-200"
                        aria-label="Remove feature"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Title</label>
                    <input
                      value={feature.title_en}
                      onChange={(e) => updateFeature(index, { title_en: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Feature title"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600">Description</label>
                    <textarea
                      value={feature.description_en}
                      onChange={(e) => updateFeature(index, { description_en: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Detailed description..."
                    />
                  </div>
                  <div className="mt-3">
                    <label htmlFor={`feature-media-${index}`} className="block text-xs font-medium text-slate-600 mb-2">Media (Image or Video)</label>
                    <div className="flex gap-2">
                      <select
                        id={`feature-media-${index}`}
                        aria-label="Media type"
                        value={feature.media_type}
                        onChange={(e) => updateFeature(index, { media_type: e.target.value as 'image' | 'video' | '' })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">No media</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      {feature.media_type && (
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          <Upload className="h-4 w-4" /> Upload {feature.media_type === 'video' ? 'Video' : 'Image'}
                          <input
                            type="file"
                            accept={feature.media_type === 'video' ? 'video/*' : 'image/*'}
                            className="sr-only"
                            onChange={(e) => handleFeatureMediaChange(index, e)}
                            aria-label={`Upload ${feature.media_type}`}
                          />
                        </label>
                      )}
                    </div>
                    {feature.media_file && (
                      <div className="mt-2 text-xs text-slate-600">
                        File: {feature.media_file.name} (will upload on save)
                      </div>
                    )}
                    {feature.media_url && !feature.media_file && (
                      <div className="mt-2">
                        {feature.media_type === 'image' ? (
                          <img src={feature.media_url} alt="Feature media" className="h-32 rounded-lg object-cover" />
                        ) : (
                          <video src={feature.media_url} controls className="h-32 w-full rounded-lg" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || deleting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving || deleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          {!isNew && id && (
            <button
              type="button"
              onClick={async () => {
                const productName = form.name_en || 'Product';
                if (!confirm(`Are you sure you want to delete product "${productName}"?\n\nThis will remove the product and its variants, images, and features. Cannot be undone.`)) {
                  return;
                }
                setDeleting(true);
                try {
                  const { error } = await supabase.from('products').delete().eq('id', id);
                  if (error) throw error;
                  alert('Product deleted.');
                  router.push('/products');
                } catch (e: any) {
                  alert(`Failed to delete product: ${e.message}`);
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={saving || deleting}
              className="ml-auto rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Product'}
            </button>
          )}
        </div>
      </form>
      {!isNew && id && <ProductVariants productId={id} productImages={images.map((img) => ({ id: img.id, url: img.url, sort_order: img.sort_order }))} />}
    </div>
  );
}
