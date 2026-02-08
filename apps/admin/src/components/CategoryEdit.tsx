'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Props = { id?: string };

export default function CategoryEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name_sw: '',
    name_en: '',
    slug: '',
    image_url: '',
    parent_id: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    supabase.from('categories').select('id, name_sw, name_en').order('sort_order').then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data)
          setForm({
            name_sw: data.name_sw ?? '',
            name_en: data.name_en ?? '',
            slug: data.slug ?? '',
            image_url: data.image_url ?? '',
            parent_id: data.parent_id ?? '',
            sort_order: data.sort_order ?? 0,
            is_active: data.is_active ?? true,
          });
        setLoading(false);
      });
  }, [id, isNew]);

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || slugFromName(form.name_sw);
      const payload = {
        name_sw: form.name_sw,
        name_en: form.name_en || null,
        slug,
        image_url: form.image_url || null,
        parent_id: form.parent_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (isNew) {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        router.push('/categories');
      } else {
        const { error } = await supabase.from('categories').update(payload).eq('id', id);
        if (error) throw error;
        router.push('/categories');
      }
    } catch (e: any) {
      alert(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'New category' : 'Edit category'}</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="cat-name_sw" className="mb-1.5 block text-sm font-medium text-slate-700">Name (Swahili)</label>
          <input
            id="cat-name_sw"
            value={form.name_sw}
            onChange={(e) => setForm((f) => ({ ...f, name_sw: e.target.value, slug: f.slug || slugFromName(e.target.value) }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Local name"
            required
          />
        </div>
        <div>
          <label htmlFor="cat-name_en" className="mb-1.5 block text-sm font-medium text-slate-700">Name (English)</label>
          <input
            id="cat-name_en"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="English name"
          />
        </div>
        <div>
          <label htmlFor="cat-slug" className="mb-1.5 block text-sm font-medium text-slate-700">Slug</label>
          <input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="auto from name"
          />
        </div>
        <div>
          <label htmlFor="cat-image_url" className="mb-1.5 block text-sm font-medium text-slate-700">Image URL</label>
          <input
            id="cat-image_url"
            type="url"
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="cat-parent_id" className="mb-1.5 block text-sm font-medium text-slate-700">Parent category</label>
          <select
            id="cat-parent_id"
            value={form.parent_id}
            onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {categories.filter((c) => c.id !== id).map((c) => (
              <option key={c.id} value={c.id}>{c.name_sw ?? c.name_en ?? c.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cat-sort_order" className="mb-1.5 block text-sm font-medium text-slate-700">Sort order</label>
          <input
            id="cat-sort_order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
