'use client';
import { useEffect, useState } from 'react';
import { ImagePlus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'media';
const BANNER_PREFIX = 'banners';

type Banner = {
  id?: string;
  image_url: string;
  title_en: string;
  description_en: string;
  button_text_en: string;
  button_link: string;
  link_type: 'category' | 'product' | 'url' | null;
  sort_order: number;
  is_active: boolean;
  file?: File;
};

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    title_en: '',
    description_en: '',
    button_text_en: 'Shop Now',
    button_link: '',
    link_type: null,
    sort_order: 0,
    is_active: true,
  });

  const loadBanners = () => {
    setLoading(true);
    supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setBanners((data ?? []) as Banner[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBanner((prev) => ({ ...prev, file }));
    }
  };

  const handleAdd = async () => {
    if (!newBanner.file && !newBanner.image_url) {
      alert('Please select an image or enter an image URL.');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = newBanner.image_url || '';
      if (newBanner.file) {
        const ext = newBanner.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${BANNER_PREFIX}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, newBanner.file, {
          contentType: newBanner.file.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
          upsert: false,
        });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const maxOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.sort_order)) : -1;
      const { error } = await supabase.from('banners').insert({
        image_url: imageUrl,
        title_en: newBanner.title_en || null,
        description_en: newBanner.description_en || null,
        button_text_en: newBanner.button_text_en || 'Shop Now',
        button_link: newBanner.button_link || null,
        link_type: newBanner.link_type || null,
        sort_order: maxOrder + 1,
        is_active: newBanner.is_active ?? true,
      });
      if (error) throw error;
      setShowAddForm(false);
      setNewBanner({
        title_en: '',
        description_en: '',
        button_text_en: 'Shop Now',
        button_link: '',
        link_type: null,
        sort_order: 0,
        is_active: true,
      });
      loadBanners();
    } catch (e: any) {
      alert(`Failed to add banner: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadBanners();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    loadBanners();
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex((b) => b.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const temp = banners[index].sort_order;
    banners[index].sort_order = banners[newIndex].sort_order;
    banners[newIndex].sort_order = temp;

    const { error: err1 } = await supabase
      .from('banners')
      .update({ sort_order: banners[index].sort_order })
      .eq('id', banners[index].id);
    const { error: err2 } = await supabase
      .from('banners')
      .update({ sort_order: banners[newIndex].sort_order })
      .eq('id', banners[newIndex].id);

    if (err1 || err2) {
      alert('Failed to reorder banners');
      loadBanners();
      return;
    }
    loadBanners();
  };

  const handleUpdate = async (banner: Banner) => {
    const { error } = await supabase
      .from('banners')
      .update({
        title_en: banner.title_en || null,
        description_en: banner.description_en || null,
        button_text_en: banner.button_text_en || 'Shop Now',
        button_link: banner.button_link || null,
        link_type: banner.link_type || null,
      })
      .eq('id', banner.id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      loadBanners();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500">Loading banners...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Manage promotional banners for home page</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
          aria-label="Add new banner"
          title="Add new banner"
        >
          <ImagePlus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      {/* Add New Banner Form */}
      {showAddForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Add New Banner</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close form"
              title="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="banner-image-upload" className="mb-1.5 block text-sm font-medium text-slate-700">
                Upload Image
              </label>
              <input
                id="banner-image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full text-sm"
                aria-label="Upload banner image file"
                title="Select image file to upload"
              />
            </div>
            <div>
              <label htmlFor="banner-image-url" className="mb-1.5 block text-sm font-medium text-slate-700">
                Or Image URL
              </label>
              <input
                id="banner-image-url"
                type="url"
                value={newBanner.image_url || ''}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Banner image URL"
              />
            </div>
            <div>
              <label htmlFor="banner-title-en" className="mb-1.5 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="banner-title-en"
                type="text"
                value={newBanner.title_en || ''}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, title_en: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Banner title"
              />
            </div>
            <div>
              <label htmlFor="banner-description-en" className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="banner-description-en"
                value={newBanner.description_en || ''}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, description_en: e.target.value }))}
                placeholder="Detailed description..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Banner description"
              />
            </div>
            <div>
              <label htmlFor="banner-button-text-en" className="mb-1.5 block text-sm font-medium text-slate-700">
                Button Text
              </label>
              <input
                id="banner-button-text-en"
                type="text"
                value={newBanner.button_text_en || ''}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, button_text_en: e.target.value }))}
                placeholder="Shop Now"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Button text"
              />
            </div>
            <div>
              <label htmlFor="banner-link-type" className="mb-1.5 block text-sm font-medium text-slate-700">
                Link Type
              </label>
              <select
                id="banner-link-type"
                value={newBanner.link_type || ''}
                onChange={(e) =>
                  setNewBanner((prev) => ({
                    ...prev,
                    link_type: e.target.value === '' ? null : (e.target.value as 'category' | 'product' | 'url'),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Banner link type"
              >
                <option value="">None</option>
                <option value="category">Category</option>
                <option value="product">Product</option>
                <option value="url">External URL</option>
              </select>
            </div>
            <div>
              <label htmlFor="banner-link" className="mb-1.5 block text-sm font-medium text-slate-700">
                Link (Category ID, Product ID, or URL)
              </label>
              <input
                id="banner-link"
                type="text"
                value={newBanner.button_link || ''}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, button_link: e.target.value }))}
                placeholder="Category/Product ID or URL"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Banner link"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="banner-active"
                type="checkbox"
                checked={newBanner.is_active ?? true}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300"
                aria-label="Set banner as active"
              />
              <label htmlFor="banner-active" className="text-sm text-slate-700">
                Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={uploading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Add Banner'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List of existing banners */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner, index) => (
          <div key={banner.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              <img
                src={banner.image_url}
                alt={banner.title_en || 'Banner'}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Order: {banner.sort_order}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveOrder(banner.id!, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move up"
                    aria-label="Move banner up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveOrder(banner.id!, 'down')}
                    disabled={index === banners.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move down"
                    aria-label="Move banner down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={banner.title_en || ''}
                onChange={(e) => {
                  const updated = { ...banner, title_en: e.target.value };
                  setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
                }}
                onBlur={() => handleUpdate(banner)}
                placeholder="Title"
                className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                aria-label="Edit title"
                title="Edit title"
              />
              <div className="mt-2 text-xs text-slate-500">
                Link: {banner.link_type || 'None'} {banner.button_link ? `- ${banner.button_link}` : ''}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleToggleActive(banner.id!, banner.is_active)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${
                    banner.is_active ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {banner.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(banner.id!)}
                  className="rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  aria-label="Delete banner"
                  title="Delete banner"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {banners.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No banners yet. Add one to get started.
        </div>
      )}
    </div>
  );
}
