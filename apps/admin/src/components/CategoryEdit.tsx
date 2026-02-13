'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'media';
const CATEGORIES_PREFIX = 'categories';

type Props = { id?: string };

type CategoryOption = { id: string; name_en: string | null };

export default function CategoryEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const parentFromQuery = searchParams?.get('parent') ?? '';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mainCategories, setMainCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState({
    name_en: '',
    slug: '',
    image_url: '',
    parent_id: parentFromQuery,
    sort_order: 0,
    is_active: true,
  });

  // Load main categories for parent dropdown
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_en')
      .is('parent_id', null)
      .order('sort_order')
      .order('name_en')
      .then(({ data }) => setMainCategories((data ?? []) as CategoryOption[]));
  }, []);

  // Pre-fill parent when coming from "Add sub" link
  useEffect(() => {
    if (isNew && parentFromQuery) setForm((f) => ({ ...f, parent_id: parentFromQuery }));
  }, [isNew, parentFromQuery]);

  // Load existing category when editing
  useEffect(() => {
    if (isNew || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name_en: (data.name_en ?? data.name_sw ?? '') as string,
            slug: data.slug ?? '',
            image_url: data.image_url ?? '',
            parent_id: data.parent_id ?? '',
            sort_order: data.sort_order ?? 0,
            is_active: data.is_active ?? true,
          });
        }
        setLoading(false);
      });
  }, [id, isNew]);

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (e.g. JPG, PNG).');
      return;
    }
    setImageFile(file);
    setForm((f) => ({ ...f, image_url: '' }));
    e.target.value = '';
  };

  const removeImage = () => {
    setImageFile(null);
    setForm((f) => ({ ...f, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.image_url || '';

      if (imageFile) {
        setUploading(true);
        try {
          const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const categoryId = isNew ? crypto.randomUUID() : id;
          const path = `${CATEGORIES_PREFIX}/${categoryId}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, imageFile, {
              contentType: imageFile.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
              upsert: true,
            });
          if (upErr) throw new Error(upErr.message);
          const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        } catch (err: unknown) {
          alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setSaving(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const name = form.name_en.trim();
      const slug = form.slug?.trim() || slugFromName(name);
      const payload = {
        name_sw: name || '',
        name_en: name || null,
        slug: slug || null,
        image_url: imageUrl || null,
        parent_id: form.parent_id?.trim() || null,
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const parentName = form.parent_id
    ? mainCategories.find((c) => c.id === form.parent_id)?.name_en ?? null
    : null;

  if (loading && !isNew) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {isNew ? (form.parent_id ? 'New sub-category' : 'New main category') : 'Edit category'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isNew
            ? form.parent_id
              ? 'Create a sub-category under the selected parent.'
              : 'Create a top-level category.'
            : 'Update name, image, parent, and settings.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Basic info</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                value={form.name_en}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name_en: e.target.value,
                    slug: f.slug || slugFromName(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Electronics"
                required
              />
            </div>
            <div>
              <label htmlFor="cat-slug" className="mb-1.5 block text-sm font-medium text-slate-700">
                Slug
              </label>
              <input
                id="cat-slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="auto-generated from name"
              />
              <p className="mt-1 text-xs text-slate-500">Used in URLs. Leave blank to generate from name.</p>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Image</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cat-image" className="mb-1.5 block text-sm font-medium text-slate-700">
                Upload image
              </label>
              <input
                id="cat-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
              />
            </div>
            <p className="text-xs text-slate-500">or paste an image URL:</p>
            <input
              id="cat-image_url"
              type="url"
              value={form.image_url}
              onChange={(e) => {
                setForm((f) => ({ ...f, image_url: e.target.value }));
                setImageFile(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://..."
            />
            {(form.image_url || imageFile) && (
              <div className="flex items-start gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={form.image_url}
                      alt="Category"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hierarchy */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Hierarchy</h2>
          <div className="mt-4">
            <label htmlFor="cat-parent" className="mb-1.5 block text-sm font-medium text-slate-700">
              Parent category
            </label>
            <select
              id="cat-parent"
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">None — this is a main category</option>
              {mainCategories
                .filter((c) => c.id !== id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en || c.id}
                  </option>
                ))}
            </select>
            {form.parent_id && parentName && (
              <p className="mt-2 text-sm text-slate-600">
                This will be a <strong>sub-category</strong> of “{parentName}”.
              </p>
            )}
            {form.parent_id && !parentName && (
              <p className="mt-2 text-sm text-amber-600">Selected parent may have been deleted. Choose another or None.</p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Settings</h2>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <label htmlFor="cat-sort" className="mb-1 block text-sm font-medium text-slate-700">
                Sort order
              </label>
              <input
                id="cat-sort"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="cat-active" className="text-sm font-medium text-slate-700">
                Active (visible in app)
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
