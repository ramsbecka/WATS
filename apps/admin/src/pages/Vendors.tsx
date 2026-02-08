'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);

  const load = () => {
    setLoading(true);
    let q = supabase
      .from('vendors')
      .select('id, business_name, business_reg_no, contact_phone, commission_rate, is_approved, created_at')
      .order('created_at', { ascending: false });
    if (pendingOnly) q = q.eq('is_approved', false);
    q.then(({ data, error }) => {
      if (!error) setVendors(data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [pendingOnly]);

  const setApproved = async (id: string, is_approved: boolean) => {
    setUpdating(id);
    const { error } = await supabase.from('vendors').update({ is_approved }).eq('id', id);
    setUpdating(null);
    if (!error) setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, is_approved } : v)));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendors</h1>
          <p className="mt-1 text-sm text-slate-500">Vendor onboarding and approval</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} className="rounded border-slate-300" />
          Pending only
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Business</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reg. no</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Commission</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{v.business_name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{v.business_reg_no ?? '–'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{v.contact_phone}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{Number(v.commission_rate)}%</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${v.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {v.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {v.is_approved ? (
                      <button
                        onClick={() => setApproved(v.id, false)}
                        disabled={updating === v.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    ) : (
                      <button
                        onClick={() => setApproved(v.id, true)}
                        disabled={updating === v.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && vendors.length === 0 && (
          <div className="p-12 text-center text-slate-500">No vendors.</div>
        )}
      </div>
    </div>
  );
}
