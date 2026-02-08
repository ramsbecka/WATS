'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Warehouse, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FulfillmentCenters() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('fulfillment_centers')
      .select('id, name, region, address, is_active, created_at')
      .order('name')
      .then(({ data, error }) => {
        if (!error) setCenters(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fulfillment centers</h1>
          <p className="mt-1 text-sm text-slate-500">Warehouses and pickup locations</p>
        </div>
        <Link
          href="/fulfillment-centers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Add center
        </Link>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Region</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Address</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {centers.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <Warehouse className="h-4 w-4 text-slate-400" />
                      {c.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.region}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.address}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/fulfillment-centers/${c.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && centers.length === 0 && (
          <div className="p-12 text-center text-slate-500">No fulfillment centers. <Link href="/fulfillment-centers/new" className="text-primary hover:underline">Add one</Link>.</div>
        )}
      </div>
    </div>
  );
}
