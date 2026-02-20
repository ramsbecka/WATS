'use client';
import { useEffect, useState } from 'react';
import { ImagePlus, Trash2, Upload, ChevronUp, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MEDIA_BUCKET = 'media';
const SPLASH_PREFIX = 'splash';

type SplashImage = {
  id?: string;
  image_url: string;
  title_en: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
  file?: File;
};

export default function SplashImages({ hideTitle }: { hideTitle?: boolean } = {}) {
  const [images, setImages] = useState<SplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImage, setNewImage] = useState<Partial<SplashImage>>({
    title_en: '',
    description_en: '',
    sort_order: 0,
    is_active: true,
  });

  const loadImages = () => {
    setLoading(true);
    supabase
      .from('splash_images')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setImages((data ?? []) as SplashImage[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage((prev) => ({ ...prev, file }));
    }
  };

  const handleAdd = async () => {
    if (!newImage.file && !newImage.image_url) {
      alert('Please select an image or enter an image URL.');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = newImage.image_url || '';
      if (newImage.file) {
        const ext = newImage.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${SPLASH_PREFIX}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, newImage.file, {
          contentType: newImage.file.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
          upsert: false,
        });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;
      const { error } = await supabase.from('splash_images').insert({
        image_url: imageUrl,
        title_en: newImage.title_en || null,
        description_en: newImage.description_en || null,
        sort_order: maxOrder + 1,
        is_active: newImage.is_active ?? true,
      });
      if (error) throw error;
      setShowAddForm(false);
      setNewImage({
        title_en: '',
        description_en: '',
        sort_order: 0,
        is_active: true,
      });
      loadImages();
    } catch (e: any) {
      alert(`Failed to add splash image: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this splash image?')) return;
    const { error } = await supabase.from('splash_images').delete().eq('id', id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadImages();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('splash_images').update({ is_active: !current }).eq('id', id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    loadImages();
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = images.findIndex((i) => i.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    const [current, target] = [images[index], images[newIndex]];
    const [currentOrder, targetOrder] = [current.sort_order, target.sort_order];
    await supabase.from('splash_images').update({ sort_order: targetOrder }).eq('id', current.id);
    await supabase.from('splash_images').update({ sort_order: currentOrder }).eq('id', target.id);
    loadImages();
  };

  const handleUpdate = async (img: SplashImage) => {
    const { error } = await supabase
      .from('splash_images')
      .update({
        title_en: img.title_en || null,
        description_en: img.description_en || null,
        is_active: img.is_active,
      })
      .eq('id', img.id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    loadImages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading splash images...
      </div>
    );
  }

  return (
    <div>
      <div className={`flex flex-wrap items-center justify-between gap-4 ${hideTitle ? 'mt-0' : ''}`}>
        {!hideTitle && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Splash Images</h1>
            <p className="mt-1 text-sm text-slate-500">Manage onboarding carousel images for mobile app</p>
          </div>
        )}
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <ImagePlus className="h-4 w-4" /> Add Splash Image
        </button>
      </div>

      {showAddForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Add New Splash Image</h2>
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
              <label htmlFor="splash-image-upload" className="mb-1.5 block text-sm font-medium text-slate-700">Upload Image</label>
              <input 
                id="splash-image-upload"
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect} 
                className="w-full text-sm"
                aria-label="Upload splash image file"
                title="Select image file to upload"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Or Image URL</label>
              <input
                type="url"
                value={newImage.image_url || ''}
                onChange={(e) => setNewImage((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={newImage.title_en || ''}
                onChange={(e) => setNewImage((prev) => ({ ...prev, title_en: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="splash-description-en" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                id="splash-description-en"
                value={newImage.description_en || ''}
                onChange={(e) => setNewImage((prev) => ({ ...prev, description_en: e.target.value }))}
                placeholder="Detailed description..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="Splash image description in English"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="splash-image-active"
                type="checkbox"
                checked={newImage.is_active ?? true}
                onChange={(e) => setNewImage((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300"
                aria-label="Set splash image as active"
              />
              <label htmlFor="splash-image-active" className="text-sm text-slate-700">Active</label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={uploading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Add Image'}
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {images.map((img, index) => (
          <div key={img.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative aspect-[9/16] bg-slate-100">
              <img src={img.image_url} alt={img.title_en || 'Splash'} className="h-full w-full object-cover" />
              <div className="absolute top-2 right-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${img.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {img.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Order: {img.sort_order}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveOrder(img.id!, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveOrder(img.id!, 'down')}
                    disabled={index === images.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={img.title_en || ''}
                onChange={(e) => {
                  const updated = { ...img, title_en: e.target.value };
                  setImages((prev) => prev.map((i) => (i.id === img.id ? updated : i)));
                }}
                onBlur={() => handleUpdate(img)}
                placeholder="Title"
                className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                aria-label="Edit title in Swahili"
                title="Edit title in Swahili"
              />
              <input
                type="text"
                value={img.title_en || ''}
                onChange={(e) => {
                  const updated = { ...img, title_en: e.target.value };
                  setImages((prev) => prev.map((i) => (i.id === img.id ? updated : i)));
                }}
                onBlur={() => handleUpdate(img)}
                placeholder="Title (English)"
                className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                aria-label="Edit title in English"
                title="Edit title in English"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleToggleActive(img.id!, img.is_active)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${img.is_active ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                  {img.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(img.id!)}
                  className="rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  aria-label="Delete splash image"
                  title="Delete splash image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No splash images yet. Add one to get started.
        </div>
      )}
    </div>
  );
}
