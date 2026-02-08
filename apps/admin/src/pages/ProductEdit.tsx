'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ImageRow = { id?: string; url: string; sort_order: number };

type Props = { id?: string };

export default function ProductEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [form, setForm] = useState({
    vendor_id: '',
    category_id: '',
    sku: '',
    name_sw: '',
    name_en: '',
    description_sw: '',
    description_en: '',
    price_tzs: '',
    compare_at_price_tzs: '',
    cost_tzs: '',
    is_active: true,
  });

  useEffect(() => {
    supabase.from('vendors').select('id, business_name').then(({ data }) => setVendors(data ?? []));
    supabase.from('categories').select('id, name_sw, name_en').then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_images').select('id, url, sort_order').eq('product_id', id).order('sort_order'),
    ]).then(([prod, imgs]) => {
      if (prod.data)
        setForm({
          vendor_id: prod.data.vendor_id ?? '',
          category_id: prod.data.category_id ?? '',
          sku: prod.data.sku ?? '',
          name_sw: prod.data.name_sw ?? '',
          name_en: prod.data.name_en ?? '',
          description_sw: prod.data.description_sw ?? '',
          description_en: prod.data.description_en ?? '',
          price_tzs: String(prod.data.price_tzs ?? ''),
          compare_at_price_tzs: prod.data.compare_at_price_tzs != null ? String(prod.data.compare_at_price_tzs) : '',
          cost_tzs: prod.data.cost_tzs != null ? String(prod.data.cost_tzs) : '',
          is_active: prod.data.is_active ?? true,
        });
      setImages((imgs.data ?? []).map((r: any, i) => ({ id: r.id, url: r.url, sort_order: i })));
      setLoading(false);
    });
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vendor_id: form.vendor_id || null,
        category_id: form.category_id || null,
        sku: form.sku || null,
        name_sw: form.name_sw,
        name_en: form.name_en || null,
        description_sw: form.description_sw || null,
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
        router.replace(`/products/${data.id}`);
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
      }
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (images.length > 0) {
        await supabase.from('product_images').insert(
          images.map((img, i) => ({ product_id: productId, url: img.url, sort_order: i }))
        );
      }
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading && !isNew) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{isNew ? 'New product' : 'Edit product'}</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Vendor</label>
            <select
              aria-label="Vendor"
              value={form.vendor_id}
              onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">–</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.business_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              aria-label="Category"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">–</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_sw ?? c.name_en}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label id="product-sku-label" className="block text-sm font-medium text-slate-700">SKU</label>
          <input
            id="product-sku"
            aria-labelledby="product-sku-label"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label id="product-name_sw-label" className="block text-sm font-medium text-slate-700">Name (Swahili)</label>
            <input
              id="product-name_sw"
              aria-labelledby="product-name_sw-label"
              value={form.name_sw}
              onChange={(e) => setForm((f) => ({ ...f, name_sw: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label id="product-name_en-label" className="block text-sm font-medium text-slate-700">Name (English)</label>
            <input
              id="product-name_en"
              aria-labelledby="product-name_en-label"
              placeholder="Optional"
              value={form.name_en}
              onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
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
          <label id="product-desc_sw-label" className="block text-sm font-medium text-slate-700">Description (Swahili)</label>
          <textarea
            id="product-desc_sw"
            aria-labelledby="product-desc_sw-label"
            value={form.description_sw}
            onChange={(e) => setForm((f) => ({ ...f, description_sw: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div>
          <label id="product-desc_en-label" className="block text-sm font-medium text-slate-700">Description (English)</label>
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
          <label id="product-images-label" className="block text-sm font-medium text-slate-700">Images (URLs)</label>
          <div className="mt-1 flex gap-2">
            <input
              id="product-images-url"
              type="url"
              aria-labelledby="product-images-label"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <button type="button" onClick={addImage} className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5">
              <ImagePlus className="h-4 w-4" /> Add
            </button>
          </div>
          {images.length > 0 && (
            <ul className="mt-2 space-y-1">
              {images.map((img, index) => (
                <li key={img.id ?? index} className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-slate-700">{img.url}</span>
                  <button type="button" onClick={() => removeImage(index)} className="shrink-0 text-red-600 hover:text-red-700" aria-label="Remove image">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
