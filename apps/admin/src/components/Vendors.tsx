'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    supabase
      .from('vendors')
      .select('id, business_name, business_reg_no, contact_phone, commission_rate, is_approved, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setVendors(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stores</h1>
          <p className="mt-1 text-sm text-slate-500">Store list; admin adds products after following the store owner.</p>
        </div>
        <Link
          href="/vendors/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Add store
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading…
          </div>
        ) : (
          <table className="table-row-hover min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Biashara</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Usajili</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Simu</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Komisheni</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Vitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <Store className="h-4 w-4 text-slate-400" />
                      {v.business_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{v.business_reg_no ?? '–'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{v.contact_phone}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{Number(v.commission_rate)}%</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${v.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {v.is_approved ? 'Imewezeshwa' : 'Haijawezeshwa'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/vendors/${v.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && vendors.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No stores yet. <Link href="/vendors/new" className="text-primary hover:underline">Add store</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
