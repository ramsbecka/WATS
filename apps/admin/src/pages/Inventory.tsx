'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const LOW_STOCK_THRESHOLD = 5;

export default function Inventory() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    supabase
      .from('inventory')
      .select(`
        id, product_id, quantity, reserved, updated_at,
        products(id, name_sw, name_en, sku),
        fulfillment_centers(id, name, region)
      `)
      .then(({ data, error }) => {
        if (!error) setRows(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = lowStockOnly ? rows.filter((r) => r.quantity <= LOW_STOCK_THRESHOLD) : rows;

  const saveQuantity = async (id: string, productId: string, centerId: string | null) => {
    const raw = editQty[id];
    const qty = Math.max(0, parseInt(raw ?? '0', 10) || 0);
    setUpdatingId(id);
    const { error } = await supabase.from('inventory').update({ quantity: qty }).eq('id', id);
    setUpdatingId(null);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: qty } : r)));
    const next = { ...editQty }; delete next[id]; setEditQty(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Stock by product and fulfillment center</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Low stock only (≤{LOW_STOCK_THRESHOLD})
        </label>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((r) => (
                <tr key={r.id} className={r.quantity <= LOW_STOCK_THRESHOLD ? 'bg-amber-50/50' : ''}>
                  <td className="px-5 py-3.5">
                    <Link href={`/products/${r.product_id}`} className="font-medium text-primary hover:text-primary-dark">
                      {r.products?.name_sw ?? r.products?.name_en ?? r.product_id}
                    </Link>
                    {r.products?.sku && <span className="ml-1 text-slate-500">({r.products.sku})</span>}
                    {r.quantity <= LOW_STOCK_THRESHOLD && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-amber-700" title="Low stock">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {r.fulfillment_centers?.name ?? '–'} {r.fulfillment_centers?.region && `(${r.fulfillment_centers.region})`}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <input
                      type="number"
                      min="0"
                      aria-label="Quantity"
                      value={editQty[r.id] ?? r.quantity}
                      onChange={(e) => setEditQty((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      onBlur={() => {
                        const v = editQty[r.id];
                        if (v !== undefined && String(r.quantity) !== v) saveQuantity(r.id, r.product_id, r.fulfillment_centers?.id);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), e.preventDefault())}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                    />
                    {updatingId === r.id && <span className="ml-1 text-slate-400">…</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600">{r.reserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">{lowStockOnly ? 'No low stock items.' : 'No inventory records.'}</div>
        )}
      </div>
    </div>
  );
}
