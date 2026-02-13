'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Load main categories (parent_id is null)
    supabase
      .from('categories')
      .select('id, name_en')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order')
      .then(({ data }) => setMainCategories(data ?? []));
  }, []);

  useEffect(() => {
    // Load sub-categories when a main category is selected
    if (selectedCategoryId) {
      supabase
        .from('categories')
        .select('id, name_en')
        .eq('is_active', true)
        .eq('parent_id', selectedCategoryId)
        .order('sort_order')
        .then(({ data }) => {
          setSubCategories(data ?? []);
          // Reset sub-category selection when category changes
          setSelectedSubCategoryId('');
        });
    } else {
      setSubCategories([]);
      setSelectedSubCategoryId('');
    }
  }, [selectedCategoryId]);

  const loadProducts = () => {
    setLoading(true);
    let q = supabase
      .from('products')
      .select('id, name_en, sku, price_tzs, is_active, category_id, created_at')
      .order('created_at', { ascending: false });
    
    // Filter by sub-category if selected, otherwise by main category
    const filterCategoryId = selectedSubCategoryId || selectedCategoryId;
    if (filterCategoryId) {
      q = q.eq('category_id', filterCategoryId);
    }
    
    if (search.trim()) {
      q = q.or(`name_en.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
    }
    
    q.then(({ data, error }) => {
      if (!error) setProducts(data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedSubCategoryId, search]);

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Je, una uhakika unataka kufuta bidhaa "${productName}"?\n\nHii itaondoa bidhaa kabisa na hauwezi kuirejesha.`)) {
      return;
    }
    
    setDeleting(productId);
    try {
      // Delete product (cascade will delete variants, images, etc.)
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      alert('Bidhaa imefutwa.');
      loadProducts();
    } catch (e: any) {
      alert(`Failed to delete product: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Catalog and pricing</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
          aria-label="Search products"
        />
        <select
          aria-label="Filter by category"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All categories</option>
          {mainCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
        {selectedCategoryId && (
          <select
            aria-label="Filter by sub-category (kundi)"
            value={selectedSubCategoryId}
            onChange={(e) => setSelectedSubCategoryId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            disabled={subCategories.length === 0}
          >
            <option value="">{subCategories.length > 0 ? 'All sub-categories' : 'No sub-categories'}</option>
            {subCategories.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.name_en}</option>
            ))}
          </select>
        )}
      </div>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Price (TZS)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{p.name_en ?? p.id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{p.sku ?? '–'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-900">{Number(p.price_tzs).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/products/${p.id}`} className="text-sm font-medium text-primary hover:text-primary-dark">
                        Edit →
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name_en || 'Product')}
                        disabled={deleting === p.id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        aria-label="Delete product"
                      >
                        {deleting === p.id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" /> Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && (
          <div className="p-12 text-center text-slate-500">No products yet.</div>
        )}
      </div>
    </div>
  );
}
