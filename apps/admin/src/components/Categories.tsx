'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Pencil, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Category = {
  id: string;
  name_en: string | null;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    supabase
      .from('categories')
      .select('id, name_en, slug, image_url, sort_order, is_active, parent_id')
      .order('sort_order')
      .order('name_en')
      .then(({ data, error }) => {
        if (!error) setCategories((data ?? []) as Category[]);
        setLoading(false);
      });
  };

  const mainCategories = categories.filter((c) => !c.parent_id);
  const getSubCategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(mainCategories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage main categories and sub-categories for your products.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Collapse all
          </button>
          <Link
            href="/categories/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" /> Add main category
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading…
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slug
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Order
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {mainCategories.map((main) => {
                const subs = getSubCategories(main.id);
                const isExpanded = expandedIds.has(main.id);
                return (
                  <React.Fragment key={main.id}>
                    <tr className="bg-slate-50/80 hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(main.id)}
                            className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {subs.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            ) : (
                              <span className="w-4" />
                            )}
                          </button>
                          {main.image_url ? (
                            <Image
                              src={main.image_url}
                              alt=""
                              width={36}
                              height={36}
                              className="rounded-md object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-200 text-slate-400">
                              <Folder className="h-4 w-4" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900">
                            {main.name_en || 'Unnamed'}
                          </span>
                          {subs.length > 0 && (
                            <span className="text-xs text-slate-400">
                              ({subs.length} sub{subs.length === 1 ? '' : 's'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">Main</td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 font-mono text-xs">
                        {main.slug}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">{main.sort_order}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            main.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {main.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/categories/new?parent=${main.id}`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Add sub-category"
                          >
                            <Plus className="h-3.5 w-3.5" /> Sub
                          </Link>
                          <Link
                            href={`/categories/${main.id}`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {isExpanded &&
                      subs.map((sub) => (
                        <tr key={sub.id} className="bg-white hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-14">
                            <div className="flex items-center gap-2">
                              {sub.image_url ? (
                                <Image
                                  src={sub.image_url}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="rounded object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-400">
                                  <FolderOpen className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <span className="text-slate-700">└ {sub.name_en || 'Unnamed'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">Sub</td>
                          <td className="px-4 py-3 text-sm text-slate-500 font-mono text-xs">
                            {sub.slug}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{sub.sort_order}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                sub.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/categories/${sub.id}`}
                              className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
              {categories.some((c) => c.parent_id && !mainCategories.some((m) => m.id === c.parent_id)) && (
                <>
                  <tr className="bg-amber-50/50">
                    <td colSpan={6} className="px-4 py-2 text-xs font-medium text-amber-800">
                      Orphaned sub-categories (parent missing)
                    </td>
                  </tr>
                  {categories
                    .filter((c) => c.parent_id && !mainCategories.some((m) => m.id === c.parent_id))
                    .map((orphan) => (
                      <tr key={orphan.id} className="bg-amber-50/30 hover:bg-amber-50/50">
                        <td className="px-4 py-3 pl-14">
                          <div className="flex items-center gap-2">
                            {orphan.image_url ? (
                              <Image
                                src={orphan.image_url}
                                alt=""
                                width={28}
                                height={28}
                                className="rounded object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-400">
                                <FolderOpen className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="text-slate-700">{orphan.name_en || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-700">Sub (orphan)</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono text-xs">
                          {orphan.slug}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{orphan.sort_order}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              orphan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {orphan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/categories/${orphan.id}`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        )}

        {!loading && mainCategories.length === 0 && (
          <div className="border-t border-slate-200 p-12 text-center">
            <p className="text-slate-500">No categories yet.</p>
            <p className="mt-1 text-sm text-slate-400">Add a main category to get started.</p>
            <Link
              href="/categories/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" /> Add main category
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
