'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_sw, name_en, slug, image_url, sort_order, is_active, parent_id')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error) setCategories(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
        <Link
          href="/categories/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Add category
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">Product categories</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading...
          </div>
        ) : (
          <table className="table-row-hover min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name (SW)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Parent</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Slug</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                    {c.image_url ? <img src={c.image_url} alt="" className="mr-2 inline-block h-8 w-8 rounded object-cover" /> : null}
                    {c.name_sw} {c.name_en && ` / ${c.name_en}`}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{c.parent_id ? (categories.find((p) => p.id === c.parent_id)?.name_sw ?? '–') : '–'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{c.slug}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{c.sort_order}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/categories/${c.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && categories.length === 0 && (
          <div className="p-12 text-center text-slate-500">No categories. Add one to get started.</div>
        )}
      </div>
    </div>
  );
}
